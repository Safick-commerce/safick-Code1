import { supabase } from "../lib/supabase";
import type { StoreProduct } from "../types/storeProduct";

export type ProductSort = "newest" | "price_asc" | "price_desc";

export type SellerPreview = {
  id: string;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
};

function sanitizeSearchTerm(raw: string): string {
  return raw
    .trim()
    .replace(/%/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function parseProductRow(raw: unknown): StoreProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.title !== "string" || typeof r.seller_id !== "string") {
    return null;
  }
  const price = typeof r.price === "number" ? r.price : Number(r.price);
  if (!Number.isFinite(price)) return null;
  const created =
    typeof r.created_at === "string"
      ? r.created_at
      : r.created_at != null
        ? String(r.created_at)
        : "";
  return {
    id: r.id,
    title: r.title,
    description: typeof r.description === "string" ? r.description : null,
    price,
    image_url: typeof r.image_url === "string" ? r.image_url : r.image_url === null ? null : null,
    seller_id: r.seller_id,
    created_at: created,
  };
}

function mapSellers(rows: unknown): SellerPreview[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((raw): SellerPreview | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      if (typeof r.id !== "string") return null;
      return {
        id: r.id,
        display_name: typeof r.display_name === "string" ? r.display_name : null,
        username: typeof r.username === "string" ? r.username : null,
        full_name: typeof r.full_name === "string" ? r.full_name : null,
        city: typeof r.city === "string" ? r.city : null,
        avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
      };
    })
    .filter((s): s is SellerPreview => s !== null);
}

const PRODUCT_COLS = "id, title, description, price, image_url, seller_id, created_at";
const PROFILE_COLS = "id, display_name, username, full_name, city, avatar_url";

function mergeProducts(rows: unknown[], byId: Map<string, StoreProduct>) {
  for (const raw of rows) {
    const p = parseProductRow(raw);
    if (p) byId.set(p.id, p);
  }
}

function sortProducts(list: StoreProduct[], sort: ProductSort): StoreProduct[] {
  const out = [...list];
  if (sort === "price_asc") out.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") out.sort((a, b) => b.price - a.price);
  else out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return out;
}

/**
 * Full-text-ish MVP: case-insensitive match on title or description.
 */
export async function searchProducts(
  query: string,
  sort: ProductSort = "newest",
  limit = 40
): Promise<StoreProduct[]> {
  const safe = sanitizeSearchTerm(query);
  if (safe.length < 2) return [];

  const pattern = `%${safe}%`;
  const [byTitle, byDesc] = await Promise.all([
    supabase.from("products").select(PRODUCT_COLS).ilike("title", pattern).limit(limit),
    supabase
      .from("products")
      .select(PRODUCT_COLS)
      .ilike("description", pattern)
      .limit(limit),
  ]);

  if (byTitle.error) console.warn("[searchProducts] title", byTitle.error.message);
  if (byDesc.error) console.warn("[searchProducts] description", byDesc.error.message);

  const byId = new Map<string, StoreProduct>();
  mergeProducts(byTitle.data ?? [], byId);
  mergeProducts(byDesc.data ?? [], byId);

  return sortProducts([...byId.values()], sort).slice(0, limit);
}

export async function searchSellers(query: string, limit = 30): Promise<SellerPreview[]> {
  const safe = sanitizeSearchTerm(query);
  if (safe.length < 2) return [];

  const pattern = `%${safe}%`;
  const [a, b, c] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLS).ilike("display_name", pattern).limit(limit),
    supabase.from("profiles").select(PROFILE_COLS).ilike("username", pattern).limit(limit),
    supabase.from("profiles").select(PROFILE_COLS).ilike("full_name", pattern).limit(limit),
  ]);

  if (a.error) console.warn("[searchSellers] display_name", a.error.message);
  if (b.error) console.warn("[searchSellers] username", b.error.message);
  if (c.error) console.warn("[searchSellers] full_name", c.error.message);

  const byId = new Map<string, SellerPreview>();
  for (const raw of [...(a.data ?? []), ...(b.data ?? []), ...(c.data ?? [])]) {
    const list = mapSellers([raw]);
    const s = list[0];
    if (s) byId.set(s.id, s);
  }

  return [...byId.values()].slice(0, limit);
}

/**
 * Sellers who have at least one listing; falls back to recent profiles with usernames.
 */
export async function fetchSellerPreviewsByIds(ids: string[]): Promise<Record<string, SellerPreview>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase.from("profiles").select(PROFILE_COLS).in("id", unique);
  if (error) {
    console.warn("[fetchSellerPreviewsByIds]", error.message);
    return {};
  }

  const map: Record<string, SellerPreview> = {};
  for (const s of mapSellers(data)) {
    map[s.id] = s;
  }
  return map;
}

export async function fetchPopularSellers(limit = 10): Promise<SellerPreview[]> {
  const { data: productRows, error: pe } = await supabase.from("products").select("seller_id").limit(300);

  if (pe) {
    console.warn("[fetchPopularSellers] products", pe.message);
  }

  const idSet = new Set<string>();
  for (const row of productRows ?? []) {
    if (row && typeof row === "object" && typeof (row as { seller_id?: string }).seller_id === "string") {
      idSet.add((row as { seller_id: string }).seller_id);
    }
  }

  const ids = [...idSet].slice(0, limit);
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .in("id", ids);
    if (error) {
      console.warn("[fetchPopularSellers] profiles by ids", error.message);
      return [];
    }
    return mapSellers(data);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[fetchPopularSellers] profiles fallback", error.message);
    return [];
  }

  return mapSellers(data);
}

export function formatPriceXaf(amount: number): string {
  try {
    return `${new Intl.NumberFormat("fr-CM", { maximumFractionDigits: 0 }).format(amount)} XAF`;
  } catch {
    return `${Math.round(amount)} XAF`;
  }
}
