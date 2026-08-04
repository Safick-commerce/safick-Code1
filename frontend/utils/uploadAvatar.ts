import { apiFetch } from "../lib/apiFetch";

function buildImageFormData(imageUri: string): FormData {
  const ext = imageUri.match(/\.([a-zA-Z0-9]+)(\?|$)/)?.[1]?.toLowerCase() ?? "jpg";
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "heic"
          ? "image/heic"
          : "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: `upload.${ext === "jpeg" ? "jpg" : ext}`,
    type: mime,
  } as unknown as Blob);
  return formData;
}

/**
 * Uploads a profile picture via the backend (magic-byte + size validation server-side).
 */
export async function uploadProfileAvatar(imageUri: string): Promise<string> {
  const { avatarUrl } = await apiFetch<{ avatarUrl: string }>("/api/users/me/avatar", {
    method: "POST",
    body: buildImageFormData(imageUri),
  });
  return avatarUrl;
}

/**
 * Uploads a cover/banner image via the backend (magic-byte + size validation server-side).
 */
export async function uploadProfileCoverImage(imageUri: string): Promise<string> {
  const { coverImageUrl } = await apiFetch<{ coverImageUrl: string }>("/api/users/me/cover", {
    method: "POST",
    body: buildImageFormData(imageUri),
  });
  return coverImageUrl;
}
