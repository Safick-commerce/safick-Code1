import type { LivePost } from "../types";

export function filterLivePostsByQuery(posts: LivePost[], raw: string): LivePost[] {
  const q = raw.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter(
    (p) =>
      p.sellerName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
}

/** Unbox: `null` = all categories; otherwise matches `LivePost.category` (Discover names). */
export function filterLivePostsByDiscoverCategory(
  posts: LivePost[],
  active: string | null,
): LivePost[] {
  if (active == null) return posts;
  return posts.filter((p) => p.category === active);
}
