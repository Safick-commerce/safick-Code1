// =============================================================================
// authStoreEffects — Supabase listener wiring for the Zustand auth store.
// =============================================================================
// Long-lived side effects do not belong in a state container, so we keep the
// `supabase.auth.onAuthStateChange` subscription and the initial `getSession`
// call out here. `bootAuth()` is called once from `frontend/app/_layout.tsx`
// inside a top-level `useEffect` and returns the teardown function.
//
// Why a module-level guard: hot reload in Expo Dev Client can re-run effects
// without remounting the root component, which would otherwise leave the
// previous Supabase subscription dangling and double-fire state updates.
// =============================================================================

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchProfile } from "../utils/fetchProfile";
import { mergeRemoteProfileIntoLocal, resetReadyToShareLocalState } from "../utils/profileSync";
import { useAuthStore } from "./authStore";

let booted = false;
let cleanup: (() => void) | null = null;

export function bootAuth(): () => void {
  if (booted && cleanup) {
    return cleanup;
  }
  booted = true;

  const store = useAuthStore.getState();
  let cancelled = false;

  supabase.auth.getSession().then(({ data: { session: initial } }) => {
    if (cancelled) return;
    store.setSession(initial);
    store.setIsReady(true);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, next: Session | null) => {
    useAuthStore.getState().setSession(next);
  });

  // Whenever the user id changes, refresh the profile row.
  const unsubProfileSync = useAuthStore.subscribe((state, prev) => {
    if (state.session?.user?.id === prev.session?.user?.id) return;
    if (!state.session?.user) {
      state.setProfile(null);
      state.setProfileLoading(false);
      return;
    }
    // Avoid showing the previous account's seller/buyer choice on a new login.
    resetReadyToShareLocalState();
    state.setProfileLoading(true);
    fetchProfile()
      .then((row) => {
        useAuthStore.getState().setProfile(row);
        mergeRemoteProfileIntoLocal(row);
      })
      .catch(() => useAuthStore.getState().setProfile(null))
      .finally(() => useAuthStore.getState().setProfileLoading(false));
  });

  cleanup = () => {
    cancelled = true;
    subscription.unsubscribe();
    unsubProfileSync();
    booted = false;
    cleanup = null;
  };
  return cleanup;
}
