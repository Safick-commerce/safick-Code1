// =============================================================================
// For You feed service
// =============================================================================
// Feed rules:
//   • Signed in + onboarding_completed + valid interests → personalized (by category)
//   • Otherwise → random (deterministic per seed for pagination)
//   • Personalized pages backfill with newest videos when interest pool is small
//
// Views: POST handler calls recordProductView — dedupe window below.
// =============================================================================

import { createHash, randomUUID } from "crypto";
import { prisma } from "../config/database";
import { filterInterestCategoryLabels } from "../constants/interestCategories";
import { AppError } from "../middleware/errorHandler";
import type { Prisma } from "../generated/prisma";
import type {
  ForYouFeedItemResponse,
  ForYouFeedMode,
  ForYouFeedResponse,
  RecordProductViewResponse,
  SellerProductViewCountsResponse,
} from "../types/feed";

/** Same product + viewer/client not counted twice within this window. */
const VIEW_DEDUPE_MINUTES = 45;

const CURSOR_VERSION = 1 as const;

type PersonalizedCursor = {
  v: typeof CURSOR_VERSION;
  mode: "personalized";
  createdAt: string;
  id: string;
};

type RandomCursor = {
  v: typeof CURSOR_VERSION;
  mode: "random";
  seed: string;
  offset: number;
};

type FeedCursor = PersonalizedCursor | RandomCursor;

type ProductWithSeller = Prisma.productsGetPayload<{
  include: { profiles: true };
}>;

const feedProductInclude = { profiles: true } as const;

// =============================================================================
// Public API
// =============================================================================

export async function getForYouFeed(options: {
  viewerId?: string;
  limit: number;
  cursor?: string;
}): Promise<ForYouFeedResponse> {
  const limit = options.limit;
  const { mode, interests } = await resolveFeedMode(options.viewerId);
  const parsedCursor = parseFeedCursor(options.cursor);

  if (parsedCursor && parsedCursor.mode !== mode) {
    // Mode changed (e.g. user finished onboarding) — ignore stale cursor.
    return mode === "personalized"
      ? buildPersonalizedFeed(interests, limit, undefined, options.viewerId)
      : buildRandomFeed(limit, undefined);
  }

  if (mode === "personalized") {
    const pCursor =
      parsedCursor?.mode === "personalized" ? parsedCursor : undefined;
    return buildPersonalizedFeed(interests, limit, pCursor, options.viewerId);
  }

  const rCursor = parsedCursor?.mode === "random" ? parsedCursor : undefined;
  return buildRandomFeed(limit, rCursor);
}

export async function recordProductView(options: {
  productId: string;
  viewerId?: string;
  clientId?: string;
}): Promise<RecordProductViewResponse> {
  const { productId, viewerId, clientId } = options;

  if (!viewerId && !clientId?.trim()) {
    throw new AppError("clientId is required when not signed in", 400);
  }

  const product = await prisma.products.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const since = new Date(Date.now() - VIEW_DEDUPE_MINUTES * 60 * 1000);

  const existing = await prisma.product_views.findFirst({
    where: {
      product_id: productId,
      created_at: { gte: since },
      ...(viewerId
        ? { viewer_id: viewerId }
        : { client_id: clientId!.trim(), viewer_id: null }),
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: true, duplicate: true };
  }

  await prisma.product_views.create({
    data: {
      product_id: productId,
      viewer_id: viewerId ?? null,
      client_id: viewerId ? null : clientId!.trim(),
    },
  });

  return { ok: true, duplicate: false };
}

/** Aggregated view counts for a seller's ready video listings (public profile grid). */
export async function getSellerProductViewCounts(
  sellerId: string,
): Promise<SellerProductViewCountsResponse> {
  const products = await prisma.products.findMany({
    where: {
      seller_id: sellerId,
      video_url: { not: null },
      media_status: "ready",
    },
    select: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const product of products) {
    counts[product.id] = 0;
  }

  if (products.length === 0) {
    return { counts };
  }

  const productIds = products.map((product) => product.id);
  const grouped = await prisma.product_views.groupBy({
    by: ["product_id"],
    where: { product_id: { in: productIds } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    counts[row.product_id] = row._count._all;
  }

  return { counts };
}

// =============================================================================
// Feed mode
// =============================================================================

async function resolveFeedMode(viewerId?: string): Promise<{
  mode: ForYouFeedMode;
  interests: string[];
}> {
  if (!viewerId) {
    return { mode: "random", interests: [] };
  }

  const profile = await prisma.profiles.findUnique({
    where: { id: viewerId },
    select: { onboarding_completed: true, interests: true },
  });

  if (!profile?.onboarding_completed) {
    return { mode: "random", interests: [] };
  }

  const interests = filterInterestCategoryLabels(profile.interests ?? []);
  if (interests.length === 0) {
    return { mode: "random", interests: [] };
  }

  return { mode: "personalized", interests };
}

// =============================================================================
// Personalized feed
// =============================================================================

async function buildPersonalizedFeed(
  interests: string[],
  limit: number,
  cursor: PersonalizedCursor | undefined,
  _viewerId?: string,
): Promise<ForYouFeedResponse> {
  const primaryWhere = {
    ...baseFeedWhere(),
    category: { in: interests },
    ...(cursor ? cursorWhere(cursor) : {}),
  };

  const primary = await prisma.products.findMany({
    where: primaryWhere,
    orderBy: feedOrderBy(),
    take: limit + 1,
    include: feedProductInclude,
  });

  const { page: primaryPage, hasMore: primaryHasMore } = splitPage(primary, limit);
  const items = primaryPage.map(mapProductToFeedItem);

  if (items.length < limit) {
    const excludeIds = items.map((i) => i.id);
    const filler = await prisma.products.findMany({
      where: {
        ...baseFeedWhere(),
        id: { notIn: excludeIds },
        OR: [{ category: null }, { category: { notIn: interests } }],
      },
      orderBy: feedOrderBy(),
      take: limit - items.length,
      include: feedProductInclude,
    });
    items.push(...filler.map(mapProductToFeedItem));
  }

  let nextCursor: string | null = null;
  if (primaryHasMore && primaryPage.length > 0) {
    const last = primaryPage[primaryPage.length - 1]!;
    nextCursor = encodeCursor({
      v: CURSOR_VERSION,
      mode: "personalized",
      createdAt: toIsoCursorTime(last.created_at),
      id: last.id,
    });
  }

  return { items, nextCursor, mode: "personalized" };
}

// =============================================================================
// Random feed (seeded order for stable pagination)
// =============================================================================

async function buildRandomFeed(
  limit: number,
  cursor: RandomCursor | undefined,
): Promise<ForYouFeedResponse> {
  const seed = cursor?.seed ?? randomUUID();
  const offset = cursor?.offset ?? 0;

  const candidates = await prisma.products.findMany({
    where: baseFeedWhere(),
    select: { id: true },
  });

  const orderedIds = candidates
    .map((row) => ({
      id: row.id,
      rank: hashRank(row.id, seed),
    }))
    .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0))
    .map((row) => row.id);

  const sliceIds = orderedIds.slice(offset, offset + limit + 1);
  const hasMore = sliceIds.length > limit;
  const pageIds = hasMore ? sliceIds.slice(0, limit) : sliceIds;

  if (pageIds.length === 0) {
    return { items: [], nextCursor: null, mode: "random" };
  }

  const rows = await prisma.products.findMany({
    where: { id: { in: pageIds } },
    include: feedProductInclude,
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const orderedRows = pageIds
    .map((id) => byId.get(id))
    .filter((row): row is ProductWithSeller => row != null);

  const nextCursor = hasMore
    ? encodeCursor({
        v: CURSOR_VERSION,
        mode: "random",
        seed,
        offset: offset + limit,
      })
    : null;

  return {
    items: orderedRows.map(mapProductToFeedItem),
    nextCursor,
    mode: "random",
  };
}

// =============================================================================
// Query helpers
// =============================================================================

function baseFeedWhere(): Prisma.productsWhereInput {
  return {
    video_url: { not: null },
    media_status: "ready",
    seller_id: { not: null },
  };
}

function feedOrderBy(): Prisma.productsOrderByWithRelationInput[] {
  return [{ created_at: "desc" }, { id: "desc" }];
}

function cursorWhere(cursor: PersonalizedCursor): Prisma.productsWhereInput {
  const createdAt = new Date(cursor.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new AppError("Invalid feed cursor", 400);
  }

  return {
    OR: [
      { created_at: { lt: createdAt } },
      { created_at: createdAt, id: { lt: cursor.id } },
    ],
  };
}

function splitPage<T>(rows: T[], limit: number): { page: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit;
  return { page: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

function hashRank(id: string, seed: string): string {
  return createHash("sha256").update(`${seed}:${id}`).digest("hex");
}

// =============================================================================
// Mapping & cursor codec
// =============================================================================

function mapProductToFeedItem(row: ProductWithSeller): ForYouFeedItemResponse {
  if (!row.video_url?.trim()) {
    throw new AppError("Feed invariant violated: product missing video_url", 500);
  }

  const seller = row.profiles;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: formatFeedPrice(row.price),
    category: row.category,
    videoUrl: row.video_url.trim(),
    thumbnailUrl: row.thumbnail_url?.trim() ?? null,
    seller: {
      id: row.seller_id!,
      username: seller?.username ?? null,
      displayName: seller?.display_name ?? seller?.full_name ?? null,
      avatarUrl: seller?.avatar_url ?? null,
      city: seller?.city ?? null,
    },
    createdAt: toIsoCursorTime(row.created_at),
  };
}

function formatFeedPrice(price: Prisma.Decimal): string {
  const n = Number(price);
  if (!Number.isFinite(n)) {
    return "0 XAF";
  }
  return `${Math.round(n).toLocaleString("en-US")} XAF`;
}

function toIsoCursorTime(value: Date | null | undefined): string {
  return (value ?? new Date()).toISOString();
}

function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function parseFeedCursor(raw?: string): FeedCursor | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(raw.trim(), "base64url").toString("utf8"));
  } catch {
    throw new AppError("Invalid feed cursor", 400);
  }

  if (!json || typeof json !== "object") {
    throw new AppError("Invalid feed cursor", 400);
  }

  const o = json as Record<string, unknown>;
  if (o.v !== CURSOR_VERSION) {
    throw new AppError("Invalid feed cursor", 400);
  }

  if (o.mode === "personalized") {
    if (typeof o.createdAt !== "string" || typeof o.id !== "string") {
      throw new AppError("Invalid feed cursor", 400);
    }
    return {
      v: CURSOR_VERSION,
      mode: "personalized",
      createdAt: o.createdAt,
      id: o.id,
    };
  }

  if (o.mode === "random") {
    if (typeof o.seed !== "string" || typeof o.offset !== "number" || o.offset < 0) {
      throw new AppError("Invalid feed cursor", 400);
    }
    return {
      v: CURSOR_VERSION,
      mode: "random",
      seed: o.seed,
      offset: o.offset,
    };
  }

  throw new AppError("Invalid feed cursor", 400);
}
