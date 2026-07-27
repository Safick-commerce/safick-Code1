import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  expectedVideoPosterUrl,
  resolveVideoCoverUrl,
} from "../src/utils/videoCover.js";

describe("videoCover", () => {
  it("expectedVideoPosterUrl replaces video extension with _cover.jpg", () => {
    const video =
      "https://x.supabase.co/storage/v1/object/public/videos/seller/clip.mp4";
    assert.equal(
      expectedVideoPosterUrl(video),
      "https://x.supabase.co/storage/v1/object/public/videos/seller/clip_cover.jpg",
    );
  });

  it("resolveVideoCoverUrl accepts tied poster only", () => {
    const video =
      "https://x.supabase.co/storage/v1/object/public/videos/a/clip.mp4";
    const tied =
      "https://x.supabase.co/storage/v1/object/public/videos/a/clip_cover.jpg";
    const unrelated = "https://x.supabase.co/storage/v1/object/public/images/photo.jpg";

    assert.equal(resolveVideoCoverUrl(video, tied), tied);
    assert.equal(resolveVideoCoverUrl(video, unrelated), null);
    assert.equal(resolveVideoCoverUrl(video, null), null);
  });
});
