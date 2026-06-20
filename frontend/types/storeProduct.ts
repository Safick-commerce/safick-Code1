/** Row from Supabase `public.products` (align with your table). */
export type StoreProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  seller_id: string;
  created_at: string;
  video_url?: string | null;
  thumbnail_url?: string | null;
  media_status?: string | null;
};
