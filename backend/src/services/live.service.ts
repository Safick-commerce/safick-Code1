import { randomUUID } from "crypto";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { prisma } from "../config/database";
import { getLivekitConfig } from "../config/livekit";
import { AppError } from "../middleware/errorHandler";
import { clearLiveLikeCount } from "./liveLikes.store";
import { notifyFollowersSellerLive } from "./notification.service";

/** LiveKit join tokens are minted server-side only — never on the client. */
const LIVE_TOKEN_TTL = "2h";

const DEFAULT_HEARTBEAT_TIMEOUT_MS = 90_000;

export function getLiveHeartbeatTimeoutMs(): number {
  const raw = process.env.LIVE_HEARTBEAT_TIMEOUT_MS?.trim();
  const parsed = raw ? Number(raw) : DEFAULT_HEARTBEAT_TIMEOUT_MS;
  return Number.isFinite(parsed) && parsed > 10_000 ? parsed : DEFAULT_HEARTBEAT_TIMEOUT_MS;
}

function getRoomServiceClient(): RoomServiceClient {
  const { url, apiKey, apiSecret } = getLivekitConfig();
  const host = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  return new RoomServiceClient(host, apiKey, apiSecret);
}

export async function closeLiveKitRoom(roomName: string): Promise<void> {
  try {
    await getRoomServiceClient().deleteRoom(roomName);
  } catch (err) {
    console.warn("[live] closeLiveKitRoom failed", roomName, err);
  }
}

type StartLiveInput = {
  sellerId: string;
  title: string;
  category?: string;
  audience?: "public" | "followers";
  productId?: string;
};

async function mintSellerToken(opts: {
  roomName: string;
  identity: string;
  name: string;
}): Promise<string> {
  const { apiKey, apiSecret } = getLivekitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: LIVE_TOKEN_TTL,
  });

  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}

async function mintViewerToken(opts: {
  roomName: string;
  identity: string;
  name: string;
}): Promise<string> {
  const { apiKey, apiSecret } = getLivekitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: LIVE_TOKEN_TTL,
  });

  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
  });

  return at.toJwt();
}

export async function assertViewerMayJoinLive(
  event: { audience: string; seller_id: string },
  viewerId: string,
): Promise<void> {
  if (event.audience !== "followers") return;

  const follow = await prisma.follows.findUnique({
    where: {
      follower_id_followee_id: {
        follower_id: viewerId,
        followee_id: event.seller_id,
      },
    },
    select: { follower_id: true },
  });

  if (!follow) {
    throw new AppError("This live stream is for followers only", 403);
  }
}

export async function startLiveSession(input: StartLiveInput) {
  const { sellerId, title, category, audience = "public", productId } = input;

  const activeSession = await prisma.live_events.findFirst({
    where: { seller_id: sellerId, status: "live" },
    select: { id: true },
  });
  if (activeSession) {
    throw new AppError(
      "You already have an active live stream. End it before starting a new one.",
      409,
    );
  }

  if (productId) {
    const product = await prisma.products.findFirst({
      where: { id: productId, seller_id: sellerId },
    });
    if (!product) {
      throw new AppError("Product not found or not yours", 404);
    }
  }

  const liveId = randomUUID();
  const roomName = `safick-live-${liveId}`;
  const { url } = getLivekitConfig();

  const now = new Date();
  const event = await prisma.live_events.create({
    data: {
      id: liveId,
      seller_id: sellerId,
      product_id: productId ?? null,
      title: title.trim(),
      category: category ?? null,
      audience,
      status: "live",
      livekit_room_name: roomName,
      started_at: now,
      seller_last_heartbeat_at: now,
    },
    include: {
      profiles: {
        select: {
          display_name: true,
          full_name: true,
          username: true,
          avatar_url: true,
        },
      },
      products: {
        select: { id: true, title: true, price: true, image_url: true },
      },
    },
  });

  const sellerName =
    event.profiles?.display_name?.trim() ||
    event.profiles?.full_name?.trim() ||
    event.profiles?.username ||
    "Seller";

  void notifyFollowersSellerLive({
    sellerId,
    liveEventId: event.id,
    sellerName,
  });

  const token = await mintSellerToken({
    roomName,
    identity: sellerId,
    name: sellerName,
  });

  return { event, token, url };
}

export async function getViewerToken(liveId: string, viewerId: string, viewerName?: string) {
  const event = await prisma.live_events.findFirst({
    where: { id: liveId, status: "live" },
  });

  if (!event) {
    throw new AppError("Live session not found or ended", 404);
  }

  if (viewerId === event.seller_id) {
    throw new AppError("Sellers join with the publish token from /live/start", 400);
  }

  await assertViewerMayJoinLive(event, viewerId);

  const { url } = getLivekitConfig();
  const token = await mintViewerToken({
    roomName: event.livekit_room_name,
    identity: viewerId,
    name: viewerName ?? "Viewer",
  });

  return { token, url, event };
}

export async function endLiveSession(liveId: string, sellerId: string) {
  const event = await prisma.live_events.findFirst({
    where: { id: liveId, seller_id: sellerId, status: "live" },
    select: { livekit_room_name: true },
  });

  if (!event) {
    throw new AppError("Live session not found", 404);
  }

  await prisma.live_events.update({
    where: { id: liveId },
    data: { status: "ended", ended_at: new Date() },
  });

  clearLiveLikeCount(liveId);
  await closeLiveKitRoom(event.livekit_room_name);
}

export async function recordLiveHeartbeat(liveId: string, sellerId: string): Promise<void> {
  const updated = await prisma.live_events.updateMany({
    where: { id: liveId, seller_id: sellerId, status: "live" },
    data: { seller_last_heartbeat_at: new Date() },
  });

  if (updated.count === 0) {
    throw new AppError("Live session not found or ended", 404);
  }
}

/** Ends live sessions whose seller stopped heartbeating (crash / force-close). */
export async function sweepStaleLiveSessions(): Promise<number> {
  const timeoutMs = getLiveHeartbeatTimeoutMs();
  const cutoff = new Date(Date.now() - timeoutMs);

  const stale = await prisma.live_events.findMany({
    where: {
      status: "live",
      OR: [
        { seller_last_heartbeat_at: { lt: cutoff } },
        { seller_last_heartbeat_at: null, started_at: { lt: cutoff } },
      ],
    },
    select: { id: true, livekit_room_name: true },
    take: 50,
  });

  if (stale.length === 0) return 0;

  for (const row of stale) {
    await prisma.live_events.update({
      where: { id: row.id },
      data: { status: "ended", ended_at: new Date() },
    });
    clearLiveLikeCount(row.id);
    await closeLiveKitRoom(row.livekit_room_name);
  }

  console.log(`[live] swept ${stale.length} stale session(s)`);
  return stale.length;
}

export async function listLiveFeed() {
  return prisma.live_events.findMany({
    where: { status: { in: ["live", "ended"] } },
    orderBy: [{ status: "asc" }, { started_at: "desc" }],
    take: 50,
    include: {
      profiles: {
        select: {
          id: true,
          display_name: true,
          full_name: true,
          username: true,
          avatar_url: true,
        },
      },
      products: {
        select: { id: true, title: true, price: true, image_url: true },
      },
    },
  });
}
