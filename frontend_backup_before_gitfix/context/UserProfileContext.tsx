import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "user_profile";

export interface UserProfile {
  displayName: string;
  username: string;
  email: string;
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
  gender: "",
  city: "",
  interests: [],
  onboardingCompleted: false,
  readyToShareMode: null,
  readyToSharePromptSeen: false,
  readyToShareSellerOnboardingCompleted: false,
};

interface UserProfileContextType {
  profile: UserProfile;
  isLoaded: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
        }
      } catch {
        // Fall back to defaults
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (updated: UserProfile) => {
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    const updated = { ...profile, onboardingCompleted: true };
    await persist(updated);
  }, [profile, persist]);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfile(DEFAULT_PROFILE);
  }, []);

  return (
    <UserProfileContext.Provider
      value={{ profile, isLoaded, updateProfile, completeOnboarding, clearProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
