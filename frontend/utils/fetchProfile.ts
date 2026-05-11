import { supabase } from "../lib/supabase";

/** Fields selected from `public.profiles` (keep in sync with `.select()`). */
export type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  onboarding_completed: boolean | null;
};

function parseProfileRow(raw: unknown): ProfileRow | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string") return null;

  return {
    id: d.id,
    full_name: typeof d.full_name === "string" ? d.full_name : null,
    username: typeof d.username === "string" ? d.username : null,
    role: typeof d.role === "string" ? d.role : null,
    onboarding_completed: typeof d.onboarding_completed === "boolean" ? d.onboarding_completed : null,
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
      .select("id, full_name, username, role, onboarding_completed")
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
