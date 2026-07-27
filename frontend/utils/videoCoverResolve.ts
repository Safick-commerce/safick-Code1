import * as VideoThumbnails from "expo-video-thumbnails";
import { Image } from "expo-image";

import type { ForYouFeedItem } from "./forYouFeed";

const coverCache = new Map<string, string>();

function cacheKey(videoUrl: string, serverCoverUrl: string | null): string {
  return serverCoverUrl?.trim() ? `s:${serverCoverUrl.trim()}` : `v:${videoUrl.trim()}`;
}

/** Resolve cover URI (server poster or extracted frame). Uses in-memory cache. */
export async function resolveVideoCoverUri(
  videoUrl: string,
  serverCoverUrl: string | null | undefined,
  timeMs = 0,
): Promise<string | null> {
  const video = videoUrl.trim();
  if (!video) return null;

  const server = serverCoverUrl?.trim() ?? "";
  if (server) return server;

  const cached = coverCache.get(video);
  if (cached) return cached;

  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(video, {
      time: timeMs,
      quality: 0.65,
    });
    coverCache.set(video, uri);
    return uri;
  } catch {
    return null;
  }
}

async function prefetchRemote(uri: string): Promise<void> {
  if (!uri.startsWith("http://") && !uri.startsWith("https://")) {
    return;
  }
  try {
    await Image.prefetch(uri);
  } catch {
    /* grid still shows uri; cache may populate on first paint */
  }
}

async function runPool(tasks: (() => Promise<void>)[], concurrency: number): Promise<void> {
  if (tasks.length === 0) return;
  const limit = Math.max(1, concurrency);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
}

/**
 * Resolve and prefetch discover covers before showing the grid.
 * Returns product id → cover uri (may be null if resolve failed).
 */
export async function prefetchDiscoverCovers(
  items: ForYouFeedItem[],
  options: { concurrency: number; deadlineMs: number },
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (items.length === 0) return map;

  const work = items.map((item) => async () => {
    const video = item.videoUrl?.trim() ?? "";
    const server = item.thumbnailUrl?.trim() ?? null;
    const key = cacheKey(video, server);
    const hit = coverCache.get(key);
    if (hit) {
      map.set(item.id, hit);
      await prefetchRemote(hit);
      return;
    }

    const uri = await resolveVideoCoverUri(video, server);
    if (uri) {
      coverCache.set(key, uri);
      if (!server) coverCache.set(video, uri);
    }
    map.set(item.id, uri);
    if (uri) await prefetchRemote(uri);
  });

  const allDone = runPool(work, options.concurrency).then(() => map);

  if (options.deadlineMs <= 0) {
    return allDone;
  }

  const deadline = new Promise<Map<string, string | null>>((resolve) => {
    setTimeout(() => {
      for (const item of items) {
        if (!map.has(item.id)) {
          map.set(item.id, null);
        }
      }
      resolve(map);
    }, options.deadlineMs);
  });

  return Promise.race([allDone, deadline]);
}

/** Hook cache reads (e.g. profile grid after Discover). */
export function getCachedVideoCover(videoUrl: string): string | undefined {
  return coverCache.get(videoUrl.trim());
}
