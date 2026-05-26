// =============================================================================
// AuthContext — Supabase session + profile for the whole app
// =============================================================================
// Wraps the tree in app/_layout.tsx (inside SafeAreaProvider).
//
// Responsibilities:
//   - Restore and track Supabase auth session (email/password, Google, Apple).
//   - Expose session.user and session.access_token (used by REST + Socket.IO).
//   - Load public.profiles row via fetchProfile() after sign-in.
//   - signIn / signUp / signOut / resetPassword / signInWithOAuth entry points.
//
// Consumers: useAuth() in screens, useAuthGuard, SocketProvider (token on connect).
// isReady: false until the first getSession() finishes — gate UI to avoid flashes.
// =============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { fetchProfile, type ProfileRow } from "../utils/fetchProfile";

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

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  profileLoading: boolean;
  refetchProfile: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signUp: (email: string, password: string, profileData: SignUpProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (identifier: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  // Ensure valid start/end characters to satisfy common DB constraints.
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

type SignUpMetadata = Record<string, unknown>;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const row = await fetchProfile();
      setProfile(row);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (cancelled) return;
      setSession(initial);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, next: Session | null) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    (async () => {
      setProfileLoading(true);
      try {
        const row = await fetchProfile();
        if (!cancelled) {
          setProfile(row);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  /** Sign in with email or username and password */
  const signIn = useCallback(async (identifier: string, password: string) => {
    const email = await resolveLoginEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
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
  }, []);

  const signUp = useCallback(async (email: string, password: string, profileData: SignUpProfileData) => {
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
      // Safest useful metadata (common trigger inputs).
      {
        full_name: normalizedName,
        display_name: normalizedName,
        username: normalizedUsername,
      },
      // Retry with unique username if the first attempt conflicts.
      {
        full_name: normalizedName,
        display_name: normalizedName,
        username: withRandomUsernameSuffix(normalizedUsername),
      },
      // Some projects reject unknown fields; fallback to only full name.
      {
        full_name: normalizedName,
      },
      // Last resort: no metadata.
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
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  /** Reset password for email or username */
  const resetPassword = useCallback(async (identifier: string) => {
    const email = await resolveLoginEmail(identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!session,
      isReady,
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      refetchProfile,
      signIn,
      signInWithOAuth,
      signUp,
      signOut,
      resetPassword,
    }),
    [
      session,
      isReady,
      profile,
      profileLoading,
      refetchProfile,
      signIn,
      signInWithOAuth,
      signUp,
      signOut,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
