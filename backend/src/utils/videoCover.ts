/**
 * Video cover / poster URLs must be tied to the clip, not a separate listing photo.
 * Upload pipeline should write posters at the path from `expectedVideoPosterUrl`.
 */

const VIDEO_EXT = /\.(mp4|mov|m4v|webm)(\?.*)?$/i;

/** Storage convention: same object key as video, with `_cover.jpg` instead of the video extension. */
export function expectedVideoPosterUrl(videoUrl: string): string | null {
  const trimmed = videoUrl.trim();
  if (!trimmed || !VIDEO_EXT.test(trimmed)) {
    return null;
  }
  return trimmed.replace(VIDEO_EXT, "_cover.jpg$2");
}

function isTiedPosterPath(videoUrl: string, posterUrl: string): boolean {
  const expected = expectedVideoPosterUrl(videoUrl);
  if (expected && posterUrl === expected) {
    return true;
  }

  try {
    const video = new URL(videoUrl);
    const poster = new URL(posterUrl);
    if (video.origin !== poster.origin) {
      return false;
    }
    const videoStem = video.pathname.replace(VIDEO_EXT, "");
    return poster.pathname.startsWith(`${videoStem}_cover`) || poster.pathname.includes("_cover.");
  } catch {
    const videoStem = videoUrl.replace(VIDEO_EXT, "");
    return posterUrl.includes(`${videoStem.split("/").pop()}_cover`);
  }
}

/**
 * Returns a server-stored cover only when it matches the video (auto-generated poster).
 * Unrelated `thumbnail_url` / product photos are ignored.
 */
export function resolveVideoCoverUrl(
  videoUrl: string,
  storedPoster: string | null | undefined,
): string | null {
  const poster = storedPoster?.trim();
  if (!poster) {
    return null;
  }
  const video = videoUrl.trim();
  if (!video) {
    return null;
  }
  return isTiedPosterPath(video, poster) ? poster : null;
}
