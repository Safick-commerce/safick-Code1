import { supabase } from "../lib/supabase";

const PROFILE_MEDIA_BUCKET = "avatars";
/** Aligned with typical storage limits; raise if your bucket allows more. */
const MAX_BYTES_AVATAR = 5 * 1024 * 1024;
const MAX_BYTES_COVER = 8 * 1024 * 1024;

function extFromUri(uri: string): string {
  const m = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  const ext = m?.[1]?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp", "heic"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  return "jpg";
}

function guessContentType(ext: string): string {
  switch (ext) {
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

async function uploadToProfileBucket(
  userId: string,
  storagePath: string,
  imageUri: string,
  maxBytes: number
): Promise<string> {
  const ext = extFromUri(imageUri);

  const res = await fetch(imageUri);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    throw new Error(
      `Image is too large. Choose one under ${Math.round(maxBytes / (1024 * 1024))} MB.`
    );
  }
  const body = new Uint8Array(buf);

  const { error: uploadError } = await supabase.storage.from(PROFILE_MEDIA_BUCKET).upload(storagePath, body, {
    contentType: guessContentType(ext),
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}

/**
 * Uploads a profile picture to `avatars/{userId}/…`, updates `profiles.avatar_url`,
 * preserves `cover_image_url` if set.
 */
export async function uploadProfileAvatar(imageUri: string): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to update your avatar.");

  const ext = extFromUri(imageUri);
  const storagePath = `${user.id}/${Date.now()}.${ext}`;
  const publicUrl = await uploadToProfileBucket(user.id, storagePath, imageUri, MAX_BYTES_AVATAR);

  const { data: row } = await supabase
    .from("profiles")
    .select("cover_image_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      avatar_url: publicUrl,
      ...(row?.cover_image_url ? { cover_image_url: row.cover_image_url } : {}),
    },
    { onConflict: "id" }
  );

  if (profileError) throw profileError;

  return publicUrl;
}

/**
 * Uploads a cover/banner image to `avatars/{userId}/…`, updates `profiles.cover_image_url`,
 * preserves `avatar_url` if set.
 */
export async function uploadProfileCoverImage(imageUri: string): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to update your cover image.");

  const ext = extFromUri(imageUri);
  const storagePath = `${user.id}/cover-${Date.now()}.${ext}`;
  const publicUrl = await uploadToProfileBucket(user.id, storagePath, imageUri, MAX_BYTES_COVER);

  const { data: row } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      cover_image_url: publicUrl,
      ...(row?.avatar_url ? { avatar_url: row.avatar_url } : {}),
    },
    { onConflict: "id" }
  );

  if (profileError) throw profileError;

  return publicUrl;
}
