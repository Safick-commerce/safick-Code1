// =============================================================================
// authStore — Zustand store for Supabase auth state + actions.
// =============================================================================
// Pure state + actions only. Side-effects (Supabase listener subscription,
// initial getSession()) live in `authStoreEffects.ts` and are started once
// from `frontend/app/_layout.tsx`. This separation keeps the store easy to
// unit test and prevents double-subscription on hot reload.
//
// Public API matches the previous AuthContext exactly so consumer callsites
// can continue to use `useAuth()` (re-exported from `context/AuthContext.tsx`)
// without any further changes.
// =============================================================================

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { fetchProfile, type ProfileRow } from "../utils/fetchProfile";
import { mergeRemoteProfileIntoLocal } from "../utils/profileSync";

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = "google" | "apple";
const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

type SignUpProfileData = {
  fullName: string;
  username?: string;
  gender?: string;
  city?: string;
  interests?: string[];
};

type SignUpMetadata = Record<string, unknown>;

interface AuthStoreState {
  // ----- State -----
  session: Session | null;
  isReady: boolean;
  profile: ProfileRow | null;
  profileLoading: boolean;
  // Derived helpers — kept on the store so selectors stay terse at callsites.
  isAuthenticated: boolean;
  user: User | null;

  // ----- Internal setters (used by authStoreEffects) -----
  setSession: (session: Session | null) => void;
  setIsReady: (ready: boolean) => void;
  setProfile: (profile: ProfileRow | null) => void;
  setProfileLoading: (loading: boolean) => void;

  // ----- Actions -----
  refetchProfile: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    profileData: SignUpProfileData,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (identifier: string) => Promise<void>;
}

function sanitizeUsername(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9._]/g, "");
}

/** Supabase password sign-in requires email — resolve username via public.profiles. */
async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error("Please enter your email or username.");
  }
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  const normalizedUsername = sanitizeUsername(trimmed);
  if (normalizedUsername.length < 3) {
    throw new Error("Invalid login credentials.");
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", normalizedUsername)
    .maybeSingle();
  if (error) {
    throw error;
  }
  const email = data?.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Invalid login credentials.");
  }
  return email;
}

function ensureValidUsername(preferred: string, email: string) {
  const fromInput = sanitizeUsername(preferred.trim());
  const emailLocal = sanitizeUsername(email.split("@")[0] ?? "");
  const base = (fromInput || emailLocal || `user${Date.now()}`).slice(0, 30);
  let candidate = base.replace(/^[^a-z0-9]+/, "").replace(/[^a-z0-9]+$/, "");
  if (candidate.length < 3) {
    candidate = `${candidate}usr`.slice(0, 30);
  }
  if (!USERNAME_REGEX.test(candidate)) {
    candidate = `u${candidate}`.slice(0, 30).replace(/[^a-z0-9]+$/, "0");
  }
  return USERNAME_REGEX.test(candidate) ? candidate : `user${Date.now().toString().slice(-6)}`;
}

function withRandomUsernameSuffix(username: string) {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  const trimmedBase = username.slice(0, Math.max(3, 30 - suffix.length));
  const candidate = `${trimmedBase}${suffix}`.replace(/[^a-z0-9._]/g, "");
  return ensureValidUsername(candidate, "user@example.com");
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  session: null,
  isReady: false,
  profile: null,
  profileLoading: false,
  isAuthenticated: false,
  user: null,

  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
      user: session?.user ?? null,
    }),
  setIsReady: (ready) => set({ isReady: ready }),
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (profileLoading) => set({ profileLoading }),

  refetchProfile: async () => {
    set({ profileLoading: true });
    try {
      const row = await fetchProfile();
      set({ profile: row });
      mergeRemoteProfileIntoLocal(row);
    } catch {
      set({ profile: null });
    } finally {
      set({ profileLoading: false });
    }
  },

  signIn: async (identifier, password) => {
    const email = await resolveLoginEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session) {
      get().setSession(data.session);
    }
  },

  signInWithOAuth: async (provider) => {
    const redirectTo = Linking.createURL("auth/callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) {
      throw new Error("Could not start OAuth sign in.");
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Sign in was cancelled.");
    }
    if (result.type !== "success") {
      throw new Error("Could not complete OAuth sign in.");
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (exchangeError) throw exchangeError;
  },

  signUp: async (email, password, profileData) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = profileData.fullName.trim();
    const normalizedUsername = ensureValidUsername(profileData.username ?? "", normalizedEmail);

    const buildPayload = (metadata: SignUpMetadata) => ({
      email: normalizedEmail,
      password,
      options: {
        data: metadata,
      },
    });

    const attempts: SignUpMetadata[] = [
      {
        full_name: normalizedName,
        display_name: normalizedName,
        username: normalizedUsername,
      },
      {
        full_name: normalizedName,
        display_name: normalizedName,
        username: withRandomUsernameSuffix(normalizedUsername),
      },
      {
        full_name: normalizedName,
      },
      {},
    ];

    let lastError: Error | null = null;
    for (const metadata of attempts) {
      const { error } = await supabase.auth.signUp(buildPayload(metadata));
      if (!error) {
        return;
      }
      lastError = error;
      const isGenericDbError = /database error saving new user/i.test(error.message);
      if (!isGenericDbError) {
        throw error;
      }
    }

    if (lastError) {
      throw lastError;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ profile: null });
  },

  resetPassword: async (identifier) => {
    const email = await resolveLoginEmail(identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
}));
