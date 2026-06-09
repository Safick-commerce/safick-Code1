import { randomUUID } from "crypto";
import { AccessToken } from "livekit-server-sdk";
import { prisma } from "../config/database";
import { getLivekitConfig } from "../config/livekit";
import { AppError } from "../middleware/errorHandler";

type StartLiveInput = {
  sellerId: string;
  title: string;
  category?: string;
  audience?: "public" | "followers";
  productId?: string;
};

async function mintLiveToken(opts: {
  roomName: string;
  identity: string;
  name: string;
  canPublish: boolean;
}): Promise<string> {
  const { url: _url, apiKey, apiSecret } = getLivekitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: "2h",
  });

  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: opts.canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}

export async function startLiveSession(input: StartLiveInput) {
  const { sellerId, title, category, audience = "public", productId } = input;

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
      started_at: new Date(),
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

  const token = await mintLiveToken({
    roomName,
    identity: sellerId,
    name: sellerName,
    canPublish: true,
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

  const { url } = getLivekitConfig();
  const token = await mintLiveToken({
    roomName: event.livekit_room_name,
    identity: viewerId,
    name: viewerName ?? "Viewer",
    canPublish: false,
  });

  return { token, url, event };
}

export async function endLiveSession(liveId: string, sellerId: string) {
  const updated = await prisma.live_events.updateMany({
    where: { id: liveId, seller_id: sellerId, status: "live" },
    data: { status: "ended", ended_at: new Date() },
  });

  if (updated.count === 0) {
    throw new AppError("Live session not found", 404);
  }
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
