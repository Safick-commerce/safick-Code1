import { supabase } from "../lib/supabase";

/** Fields selected from `public.profiles` (keep in sync with `.select()` below). */
export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  gender: string | null;
  city: string | null;
  interests: string[];
  role: string | null;
  onboarding_completed: boolean | null;
  /** Account / profile row creation time from DB (`timestamptz` ISO string). */
  created_at: string | null;
};

const PROFILE_COLUMNS =
  "id, email, full_name, display_name, username, bio, phone, avatar_url, cover_image_url, gender, city, interests, role, onboarding_completed, created_at";

function parseProfileRow(raw: unknown): ProfileRow | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string") return null;

  const interests = Array.isArray(d.interests)
    ? (d.interests.filter((v): v is string => typeof v === "string") as string[])
    : [];

  return {
    id: d.id,
    email: typeof d.email === "string" ? d.email : null,
    full_name: typeof d.full_name === "string" ? d.full_name : null,
    display_name: typeof d.display_name === "string" ? d.display_name : null,
    username: typeof d.username === "string" ? d.username : null,
    bio: typeof d.bio === "string" ? d.bio : null,
    phone: typeof d.phone === "string" ? d.phone : null,
    avatar_url: typeof d.avatar_url === "string" ? d.avatar_url : null,
    cover_image_url: typeof d.cover_image_url === "string" ? d.cover_image_url : null,
    gender: typeof d.gender === "string" ? d.gender : null,
    city: typeof d.city === "string" ? d.city : null,
    interests,
    role: typeof d.role === "string" ? d.role : null,
    onboarding_completed:
      typeof d.onboarding_completed === "boolean" ? d.onboarding_completed : null,
    created_at: typeof d.created_at === "string" ? d.created_at : null,
  };
}

/**
 * Loads the current user's row from `profiles` using `auth.getUser()` + select by `id`.
 */
export async function fetchProfile(): Promise<ProfileRow | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn("[fetchProfile] getUser:", userError.message);
      return null;
    }
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[fetchProfile] profiles:", error.message);
      return null;
    }

    return parseProfileRow(data);
  } catch (e) {
    console.warn("[fetchProfile]", e);
    return null;
  }
}

/** Public profile row by id (RLS allows select). */
export async function fetchProfileById(profileId: string): Promise<ProfileRow | null> {
  const id = profileId.trim();
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn("[fetchProfileById]", error.message);
      return null;
    }

    return parseProfileRow(data);
  } catch (e) {
    console.warn("[fetchProfileById]", e);
    return null;
  }
}
