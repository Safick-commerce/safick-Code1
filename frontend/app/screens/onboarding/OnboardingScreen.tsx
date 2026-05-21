import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { useUserProfile } from "../../../context/UserProfileContext";
import { supabase } from "../../../lib/supabase";
import WalkthroughSlides from "./WalkthroughSlides";
import GenderStep from "./steps/GenderStep";
import InterestsStep from "./steps/InterestsStep";
import LocationStep from "./steps/LocationStep";
import NameUsernameStep from "./steps/NameUsernameStep";

const RED = "#FF2800";
const TOTAL_STEPS = 4;
const MIN_INTERESTS = 2;
const MIN_SUBMIT_LOADING_MS = 300;

type Phase = "walkthrough" | "steps";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function OnboardingScreen() {
  const router = useRouter();
  const { skipWalkthrough } = useLocalSearchParams<{ skipWalkthrough?: string }>();
  const { updateProfile, completeOnboarding } = useUserProfile();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const [phase, setPhase] = useState<Phase>(skipWalkthrough === "1" ? "steps" : "walkthrough");
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Username availability — updated by NameUsernameStep via onUsernameAvailable
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  // Loading state for the Sign Up button
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWalkthroughComplete = useCallback(() => {
    setPhase("steps");
  }, []);

  const toggleInterest = useCallback((label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const isStepValid = () => {
    switch (step) {
      case 0:
        return (
          name.trim().length >= 2 &&
          username.trim().length >= 3 &&
          EMAIL_REGEX.test(email.trim()) &&
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[^A-Za-z0-9]/.test(password) &&
          agreedToTerms &&
          usernameAvailable === true
        );
      case 1:
        return gender.length > 0;
      case 2:
        return city.length > 0;
      case 3:
        return interests.length >= MIN_INTERESTS;
      default:
        return false;
    }
  };

  const handleContinue = useCallback(async () => {
    setIsSubmitting(true);
    try {
      switch (step) {
        case 0:
          await Promise.all([
            updateProfile({
              displayName: name.trim(),
              username: username.trim(),
              email: email.trim(),
            }),
            sleep(MIN_SUBMIT_LOADING_MS),
          ]);
          setStep(1);
          break;
        case 1:
          await updateProfile({ gender });
          setStep(2);
          break;
        case 2:
          await updateProfile({ city });
          setStep(3);
          break;
        case 3:
          await updateProfile({ interests });
          if (!isAuthenticated) {
            await signUp(email.trim(), password, {
              fullName: name.trim(),
              username: username.trim(),
              gender,
              city,
              interests,
            });
            try {
              await signIn(email.trim(), password);
            } catch (signInError) {
              // If "Confirm email" is enabled in Supabase, signUp creates the
              // user but does not start a session — signIn then fails with
              // "Email not confirmed". Persist onboarding locally and route
              // the user to sign in after they tap the confirmation link.
              const signInMessage =
                signInError instanceof Error ? signInError.message : "";
              if (/email not confirmed/i.test(signInMessage)) {
                await completeOnboarding();
                Alert.alert(
                  "Check your email",
                  "We sent a confirmation link to your email. Tap the link, then sign in to finish setting up your account."
                );
                router.replace("/auth/signin");
                return;
              }
              throw signInError;
            }
          }

          // Sync onboarding fields to the user's profiles row. The handle_new_user
          // trigger only fills in name/username/email — gender, city, interests,
          // and onboarding_completed have to be written by the client once a
          // session exists. Non-fatal on failure: local state already has the
          // values and the user can retry from the profile screen later.
          try {
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();
            if (currentUser) {
              const { error: profileError } = await supabase
                .from("profiles")
                .update({
                  gender: gender || null,
                  city: city || null,
                  interests,
                  onboarding_completed: true,
                })
                .eq("id", currentUser.id);
              if (profileError) {
                console.warn(
                  "[onboarding] failed to sync profile fields:",
                  profileError.message
                );
              }
            }
          } catch (syncError) {
            console.warn("[onboarding] profile sync error:", syncError);
          }

          await completeOnboarding();
          router.replace("/(tabs)");
          break;
      }
    } catch (error) {
      console.error("Failed to continue onboarding:", error);
      const rawMessage = error instanceof Error ? error.message : "";
      // Supabase masks any failure in the auth.users → public.profiles trigger
      // as this generic string. Show a friendlier message and point developers
      // at the schema bootstrap script.
      const isTriggerFailure = /database error saving new user/i.test(rawMessage);
      if (isTriggerFailure) {
        console.error(
          "[onboarding] Supabase auth trigger failed. Run backend/supabase/schema.sql " +
            "in the Supabase SQL Editor, then check Dashboard → Logs → Auth Logs."
        );
      }
      const message = isTriggerFailure
        ? "We couldn't create your account right now. Please try again in a moment."
        : rawMessage || "Please try again.";
      Alert.alert("Could not finish onboarding", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [step, name, username, email, password, gender, city, interests, updateProfile, completeOnboarding, isAuthenticated, signIn, signUp, router]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleSkip = useCallback(async () => {
    try {
      await completeOnboarding({ asGuest: !isAuthenticated });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  }, [completeOnboarding, isAuthenticated, router]);

  if (phase === "walkthrough") {
    return <WalkthroughSlides onComplete={handleWalkthroughComplete} />;
  }

  const valid = isStepValid();
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back-ios-new" size={20} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>

        <View style={styles.content}>
          {step === 0 && (
            <NameUsernameStep
              name={name}
              username={username}
              email={email}
              password={password}
              agreedToTerms={agreedToTerms}
              onNameChange={setName}
              onUsernameChange={setUsername}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onAgreeChange={setAgreedToTerms}
              onUsernameAvailable={setUsernameAvailable}
            />
          )}
          {step === 1 && (
            <GenderStep gender={gender} onGenderChange={setGender} />
          )}
          {step === 2 && (
            <LocationStep city={city} onCityChange={setCity} />
          )}
          {step === 3 && (
            <InterestsStep interests={interests} onToggle={toggleInterest} />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, (!valid || isSubmitting) && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!valid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueText}>
                {step === 0 ? "Sign Up" : isLast ? "Finish" : "Continue"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backPlaceholder: {
    width: 36,
  },
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: RED,
    fontFamily: "Inter",
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    fontFamily: "Inter",
  },
  progressBar: {
    height: 3,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: RED,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: RED,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
  },
});
