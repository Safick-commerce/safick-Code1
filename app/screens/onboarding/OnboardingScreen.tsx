import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useUserProfile } from "../../../context/UserProfileContext";
import WalkthroughSlides from "./WalkthroughSlides";
import NameUsernameStep from "./steps/NameUsernameStep";
import GenderStep from "./steps/GenderStep";
import LocationStep from "./steps/LocationStep";
import InterestsStep from "./steps/InterestsStep";

const RED = "#FF2800";
const TOTAL_STEPS = 4;
const MIN_INTERESTS = 2;

type Phase = "walkthrough" | "steps";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile, completeOnboarding } = useUserProfile();
  const [phase, setPhase] = useState<Phase>("walkthrough");
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

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
          password.length >= 6 &&
          agreedToTerms
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
    switch (step) {
      case 0:
        await updateProfile({
          displayName: name.trim(),
          username: username.trim(),
          email: email.trim(),
        });
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
        await completeOnboarding();
        router.replace("/(tabs)");
        break;
    }
  }, [step, name, username, email, gender, city, interests, updateProfile, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

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
            style={[styles.continueButton, !valid && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!valid}
          >
            <Text style={styles.continueText}>
              {step === 0 ? "Sign Up" : isLast ? "Finish" : "Continue"}
            </Text>
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
