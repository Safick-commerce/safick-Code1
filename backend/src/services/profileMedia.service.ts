import { randomUUID } from "crypto";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAdminClient } from "../utils/supabaseAdmin";
import {
  assertValidProfileImage,
  contentTypeForImage,
  extensionForImage,
} from "../utils/imageValidation";

const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_COVER_BYTES = 8 * 1024 * 1024;

async function uploadValidatedImage(
  userId: string,
  buffer: Buffer,
  maxBytes: number,
  pathPrefix: string,
): Promise<string> {
  let imageType;
  try {
    imageType = assertValidProfileImage(buffer, maxBytes);
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : "Invalid image", 400);
  }
  const ext = extensionForImage(imageType);
  const storagePath = `${userId}/${pathPrefix}-${randomUUID()}.${ext}`;
  const contentType = contentTypeForImage(imageType);

  const supabase = getSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    throw new AppError(uploadError.message, 400);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}

export async function uploadProfileAvatar(userId: string, buffer: Buffer): Promise<string> {
  const publicUrl = await uploadValidatedImage(userId, buffer, MAX_AVATAR_BYTES, "avatar");

  const existing = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { cover_image_url: true },
  });

  await prisma.profiles.upsert({
    where: { id: userId },
    create: { id: userId, avatar_url: publicUrl },
    update: {
      avatar_url: publicUrl,
      ...(existing?.cover_image_url ? { cover_image_url: existing.cover_image_url } : {}),
    },
  });

  return publicUrl;
}

export async function uploadProfileCover(userId: string, buffer: Buffer): Promise<string> {
  const publicUrl = await uploadValidatedImage(userId, buffer, MAX_COVER_BYTES, "cover");

  const existing = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { avatar_url: true },
  });

  await prisma.profiles.upsert({
    where: { id: userId },
    create: { id: userId, cover_image_url: publicUrl },
    update: {
      cover_image_url: publicUrl,
      ...(existing?.avatar_url ? { avatar_url: existing.avatar_url } : {}),
    },
  });

  return publicUrl;
}
