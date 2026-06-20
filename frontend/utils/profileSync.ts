import { supabase } from "../lib/supabase";
import { useUserProfileStore } from "../stores/userProfileStore";
import type { ProfileRow } from "./fetchProfile";

/**
 * Merges the canonical Supabase `profiles` row into the local AsyncStorage-backed
 * user profile store. Keeps seller/buyer mode and onboarding flags aligned
 * across app restarts and devices.
 */
export function mergeRemoteProfileIntoLocal(row: ProfileRow | null): void {
  if (!row) return;

  const updates: Partial<ReturnType<typeof useUserProfileStore.getState>["profile"]> = {};

  if (row.onboarding_completed === true) {
    updates.onboardingCompleted = true;
  }

  // Only sync seller from the DB. `role = "buyer"` is the schema default for every
  // new account — it does not mean the user chose Consumer Mode in the app.
  if (row.role === "seller") {
    updates.readyToShareMode = "seller";
    updates.readyToSharePromptSeen = true;
    updates.readyToShareSellerOnboardingCompleted = true;
  }

  if (row.display_name) {
    updates.displayName = row.display_name;
  } else if (row.full_name) {
    updates.displayName = row.full_name;
  }
  if (row.username) updates.username = row.username;
  if (row.email) updates.email = row.email;
  if (row.gender) updates.gender = row.gender;
  if (row.city) updates.city = row.city;
  if (row.interests.length > 0) updates.interests = row.interests;

  if (Object.keys(updates).length === 0) return;

  void useUserProfileStore.getState().updateProfile(updates);
}

/** Clears seller/buyer choice when switching to a different signed-in account. */
export function resetReadyToShareLocalState(): void {
  void useUserProfileStore.getState().updateProfile({
    readyToShareMode: null,
    readyToSharePromptSeen: false,
    readyToShareSellerOnboardingCompleted: false,
  });
}

/** Persists buyer/seller mode to `public.profiles.role`. */
export async function syncRoleToRemote(
  userId: string,
  role: "buyer" | "seller",
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  return { error: error?.message ?? null };
}
