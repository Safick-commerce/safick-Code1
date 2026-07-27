export const CHAT_IMAGE_PREFIX = "IMAGE:";
export const CHAT_OFFER_PREFIX = "Price offer: ";

export type ParsedChatMessage =
  | { kind: "text"; text: string }
  | { kind: "image"; imageUrl: string }
  | { kind: "offer"; label: string };

/** Wire format stored in messages.body for chat photos. */
export function formatChatImageMessage(imageUrl: string): string {
  return `${CHAT_IMAGE_PREFIX}${imageUrl}`;
}

const CHAT_STORAGE_IMAGE_RE =
  /^https?:\/\/[^\s/]+\/storage\/v1\/object\/public\/avatars\/[^/]+\/chat\/[^\s?]+\.(?:jpg|jpeg|png|webp|heic)(?:\?.*)?$/i;

/** Classify a persisted or in-flight message body for rendering. */
export function parseChatMessageBody(raw: string): ParsedChatMessage {
  const text = raw.trim();
  if (!text) return { kind: "text", text: "" };

  if (text.startsWith(CHAT_IMAGE_PREFIX)) {
    const imageUrl = text.slice(CHAT_IMAGE_PREFIX.length).trim();
    if (imageUrl) return { kind: "image", imageUrl };
  }

  if (text.startsWith(CHAT_OFFER_PREFIX)) {
    return { kind: "offer", label: text.slice(CHAT_OFFER_PREFIX.length) };
  }

  // Backward compatibility for rows saved as a bare public storage URL.
  if (CHAT_STORAGE_IMAGE_RE.test(text)) {
    return { kind: "image", imageUrl: text };
  }

  return { kind: "text", text };
}

/** Short label for conversation list previews (never show raw IMAGE: URLs). */
export function formatChatMessagePreview(body: string, photoLabel: string): string {
  const parsed = parseChatMessageBody(body);
  switch (parsed.kind) {
    case "image":
      return photoLabel;
    case "offer":
      return `${CHAT_OFFER_PREFIX}${parsed.label}`;
    default:
      return parsed.text;
  }
}
