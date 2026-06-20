// =============================================================================
// User Profile Store (Zustand — Wave 2 of Context → Zustand migration)
// =============================================================================
// Replaces UserProfileContext. Uses zustand/persist with AsyncStorage so the
// profile survives app restarts exactly as before. The public hook
// `useUserProfile()` keeps the same shape (`profile`, `isLoaded`,
// `updateProfile`, `completeOnboarding`, `clearProfile`) so caller sites
// don't have to change anything other than the import path.
//
// Why persist here but NOT in WishlistStore/MessageStore?
//   - The Context version was already persisted; we are matching prior behavior.
//   - Profile state has to survive cold starts so the bootstrap gate can
//     decide between onboarding, signin, and the main app.
// =============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "user_profile";

export interface UserProfile {
  displayName: string;
  username: string;
  email: string;
  isGuestUser: boolean;
  gender: string;
  city: string;
  interests: string[];
  onboardingCompleted: boolean;
  readyToShareMode: "buyer" | "seller" | null;
  readyToSharePromptSeen: boolean;
  readyToShareSellerOnboardingCompleted: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  username: "",
  email: "",
  isGuestUser: false,
  gender: "",
  city: "",
  interests: [],
  onboardingCompleted: false,
  readyToShareMode: null,
  readyToSharePromptSeen: false,
  readyToShareSellerOnboardingCompleted: false,
};

interface UserProfileState {
  profile: UserProfile;
  isLoaded: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (options?: { asGuest?: boolean }) => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      isLoaded: false,

      updateProfile: async (updates) => {
        set({ profile: { ...get().profile, ...updates } });
      },

      completeOnboarding: async (options) => {
        set({
          profile: {
            ...get().profile,
            onboardingCompleted: true,
            isGuestUser: options?.asGuest === true,
          },
        });
      },

      clearProfile: async () => {
        set({ profile: DEFAULT_PROFILE });
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Only the `profile` field is persisted; isLoaded is derived.
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[userProfileStore] hydration failed:", error);
        }
        // Flip isLoaded once hydration completes (success or failure — both
        // should unblock the bootstrap gate; the old Context worked this way too).
        useUserProfileStore.setState({ isLoaded: true });
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { profile?: Partial<UserProfile> } | undefined;
        return {
          ...currentState,
          profile: { ...DEFAULT_PROFILE, ...(persisted?.profile ?? {}) },
        };
      },
    },
  ),
);

/**
 * Identical hook shape to the legacy Context version.
 */
export function useUserProfile(): UserProfileState {
  return useUserProfileStore();
}
