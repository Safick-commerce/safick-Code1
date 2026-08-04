import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectImageType, assertValidProfileImage } from "../src/utils/imageValidation";

describe("imageValidation", () => {
  it("detects JPEG magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(detectImageType(buf), "jpeg");
  });

  it("detects PNG magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectImageType(buf), "png");
  });

  it("rejects non-image bytes", () => {
    const buf = Buffer.from("not an image");
    assert.throws(() => assertValidProfileImage(buf, 1024), /Unsupported image type/);
  });

  it("rejects files over max size", () => {
    const buf = Buffer.alloc(20);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    assert.throws(() => assertValidProfileImage(buf, 10), /exceeds/);
  });
});
