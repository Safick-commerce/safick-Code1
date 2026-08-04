// Server-side image validation by magic bytes (not client Content-Type).

export type DetectedImageType = "jpeg" | "png" | "webp" | "heic";

const SIGNATURES: { type: DetectedImageType; check: (buf: Buffer) => boolean }[] = [
  {
    type: "jpeg",
    check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    type: "png",
    check: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
  },
  {
    type: "webp",
    check: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    type: "heic",
    check: (buf) => {
      if (buf.length < 12) return false;
      if (buf.subarray(4, 8).toString("ascii") !== "ftyp") return false;
      const brand = buf.subarray(8, 12).toString("ascii");
      return ["heic", "heix", "hevc", "hevx", "mif1"].includes(brand);
    },
  },
];

export function detectImageType(buffer: Buffer): DetectedImageType | null {
  for (const { type, check } of SIGNATURES) {
    if (check(buffer)) return type;
  }
  return null;
}

export function contentTypeForImage(type: DetectedImageType): string {
  switch (type) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export function extensionForImage(type: DetectedImageType): string {
  return type === "jpeg" ? "jpg" : type;
}

export function assertValidProfileImage(
  buffer: Buffer,
  maxBytes: number,
): DetectedImageType {
  if (!buffer.length) {
    throw new Error("Empty file");
  }
  if (buffer.length > maxBytes) {
    throw new Error(`Image exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`);
  }
  const type = detectImageType(buffer);
  if (!type) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or HEIC.");
  }
  return type;
}
