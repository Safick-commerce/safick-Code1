import { supabase } from "../lib/supabase";
import type { StoreProduct } from "../types/storeProduct";

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

function mapProducts(data: unknown): StoreProduct[] {
  if (!Array.isArray(data)) return [];
  return data.map(parseProductRow).filter((p): p is StoreProduct => p !== null);
}

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

export type CreateProductInput = {
  title: string;
  description: string | null;
  price: number;
  /** Local image URI from ImagePicker */
  imageUri: string;
};

/**
 * Uploads image to `products` bucket and inserts a row into `products`.
 */
export async function createProduct(input: CreateProductInput): Promise<StoreProduct> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to create a product.");

  const ext = extFromUri(input.imageUri);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `${user.id}/${unique}.${ext}`;

  const res = await fetch(input.imageUri);
  const buf = await res.arrayBuffer();
  const body = new Uint8Array(buf);

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(storagePath, body, {
      contentType: guessContentType(ext),
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("products").getPublicUrl(storagePath);

  const { data: inserted, error: insertError } = await supabase
    .from("products")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      image_url: publicUrl,
      seller_id: user.id,
    })
    .select("id, title, description, price, image_url, seller_id, created_at")
    .single();

  if (insertError) throw insertError;

  const parsed = parseProductRow(inserted);
  if (!parsed) throw new Error("Invalid product payload from server.");
  return parsed;
}

/** Most recent listing for a seller — used when starting chat from their profile. */
export async function getFirstProductIdForSeller(sellerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data && typeof data.id === "string" ? data.id : null;
}

export async function getAllProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, seller_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[getAllProducts]", error.message);
    return [];
  }

  return mapProducts(data);
}

export async function getMyProducts(): Promise<StoreProduct[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.warn("[getMyProducts] getUser:", userError.message);
    return [];
  }
  if (!user) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, seller_id, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[getMyProducts]", error.message);
    return [];
  }

  return mapProducts(data);
}

export type ProductSellerPreview = {
  id: string;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

export type ProductDetail = StoreProduct & {
  seller: ProductSellerPreview | null;
};

function mapSeller(raw: unknown): ProductSellerPreview | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  return {
    id: r.id,
    display_name: typeof r.display_name === "string" ? r.display_name : null,
    username: typeof r.username === "string" ? r.username : null,
    full_name: typeof r.full_name === "string" ? r.full_name : null,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
    city: typeof r.city === "string" ? r.city : null,
  };
}

/** Load one listing with seller profile for the product details screen. */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const { data: row, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, seller_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const product = parseProductRow(row);
  if (!product) return null;

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, full_name, avatar_url, city")
    .eq("id", product.seller_id)
    .maybeSingle();

  if (profileError) {
    console.warn("[getProductById] profile:", profileError.message);
  }

  return {
    ...product,
    seller: mapSeller(profileRow),
  };
}

/** Other listings for “Recommended” (newest first, excludes current). */
export async function getRelatedProducts(
  excludeId: string,
  limit = 6,
): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, seller_id, created_at")
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[getRelatedProducts]", error.message);
    return [];
  }

  return mapProducts(data);
}
