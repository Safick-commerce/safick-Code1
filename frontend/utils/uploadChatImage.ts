import { supabase } from "../lib/supabase";

const CHAT_MEDIA_BUCKET = "avatars";
const MAX_BYTES = 8 * 1024 * 1024;

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

/** Uploads a chat image to the user's folder in Supabase Storage and returns a public URL. */
export async function uploadChatImage(conversationId: string, imageUri: string): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to send photos.");

  const ext = extFromUri(imageUri);
  const storagePath = `${user.id}/chat/${conversationId}/${Date.now()}.${ext}`;

  const res = await fetch(imageUri);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    throw new Error(`Image is too large. Choose one under ${Math.round(MAX_BYTES / (1024 * 1024))} MB.`);
  }

  const { error: uploadError } = await supabase.storage.from(CHAT_MEDIA_BUCKET).upload(storagePath, new Uint8Array(buf), {
    contentType: guessContentType(ext),
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(CHAT_MEDIA_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}
