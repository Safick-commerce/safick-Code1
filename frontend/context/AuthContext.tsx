// =============================================================================
// AuthContext — thin compatibility shim around the Zustand authStore.
// =============================================================================
// Phase 6, Zustand Wave 3: the actual state + actions now live in
// `frontend/stores/authStore.ts`. This file remains so the rest of the app
// can keep importing `useAuth()` and `AuthProvider` from `context/AuthContext`
// without touching every callsite at once.
//
// `AuthProvider` boots the Supabase listener via `bootAuth()`; consumers of
// `useAuth()` read live state from the store. No React Context is involved
// anymore — that's the migration's whole point — but the export shape is
// kept identical so the consumer API is stable.
// =============================================================================

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { bootAuth } from "../stores/authStoreEffects";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const teardown = bootAuth();
    return teardown;
  }, []);
  return <>{children}</>;
}

export function useAuth() {
  // Subscribing to the whole store keeps the public hook contract identical
  // to the previous Context implementation. Selectors are introduced
  // opportunistically at performance-sensitive callsites if needed later.
  return useAuthStore();
}
