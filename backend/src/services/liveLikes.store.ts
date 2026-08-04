/** In-memory like counts for active live streams (cleared when a session ends). */

const likeCounts = new Map<string, number>();

export function getLiveLikeCount(liveId: string): number {
  return likeCounts.get(liveId) ?? 0;
}

export function incrementLiveLikeCount(liveId: string): number {
  const next = (likeCounts.get(liveId) ?? 0) + 1;
  likeCounts.set(liveId, next);
  return next;
}

export function clearLiveLikeCount(liveId: string): void {
  likeCounts.delete(liveId);
}
