export function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export function liveRoom(liveId: string): string {
  return `live:${liveId}`;
}
