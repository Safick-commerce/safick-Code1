import { useEffect, useState } from "react";

import { resolveVideoCoverUri, getCachedVideoCover } from "../utils/videoCoverResolve";

type Options = {
  serverCoverUrl?: string | null;
  timeMs?: number;
};

/**
 * Cover for a single clip (profile grid, etc.). Discover prefetches in batch before paint.
 */
export function useVideoCoverUri(
  videoUrl: string | null | undefined,
  options: Options = {},
): { coverUri: string | null; loading: boolean } {
  const { serverCoverUrl = null, timeMs = 0 } = options;
  const video = videoUrl?.trim() ?? "";
  const server = serverCoverUrl?.trim() ?? "";

  const [coverUri, setCoverUri] = useState<string | null>(() => {
    if (server) return server;
    if (!video) return null;
    return getCachedVideoCover(video) ?? null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (server) {
      setCoverUri(server);
      setLoading(false);
      return;
    }
    if (!video) {
      setCoverUri(null);
      setLoading(false);
      return;
    }

    const cached = getCachedVideoCover(video);
    if (cached) {
      setCoverUri(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const uri = await resolveVideoCoverUri(video, null, timeMs);
        if (cancelled) return;
        setCoverUri(uri);
      } catch {
        if (!cancelled) setCoverUri(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video, server, timeMs]);

  return { coverUri, loading };
}
