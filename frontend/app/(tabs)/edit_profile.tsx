// Edit Profile screen
// Lets a signed-in user edit their public.profiles row: name, username, bio,
// city, and phone. Email is captured at signup and isn't editable here (a
// future Change Email flow will live in its own screen because it needs
// re-verification). Interests are captured at onboarding and currently aren't
// editable on this screen either — add a Preferences screen if/when that's
// needed. Avatar and cover upload to Storage bucket `avatars`; see
// backend/supabase/storage_avatars.sql.

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { CAMEROON_CITIES } from "../../data/cameroonCities";
import { supabase } from "../../lib/supabase";
import { uploadProfileAvatar, uploadProfileCoverImage } from "../../utils/uploadAvatar";

const RED = "#FF2800";
const GREEN = "#16a34a";

const NAME_MAX = 60;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const BIO_MAX = 750;
const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;
const CAMEROON_PHONE_REGEX = /^\+237[6-9]\d{8}$/;

const ROUTES = {
  USER_TAB: "/userTab",
} as const;

type FormState = {
  fullName: string;
  username: string;
  bio: string;
  city: string;
  phone: string;
};

function buildInitialState(p: {
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;
} | null): FormState {
  return {
    fullName: p?.display_name || p?.full_name || "",
    username: p?.username || "",
    bio: p?.bio || "",
    city: p?.city || "",
    phone: p?.phone || "+237",
  };
}

function shallowEqualState(a: FormState, b: FormState) {
  return (
    a.fullName === b.fullName &&
    a.username === b.username &&
    a.bio === b.bio &&
    a.city === b.city &&
    a.phone === b.phone
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user, profile: authProfile, refetchProfile, isReady, profileLoading } = useAuth();

  const handleBackPress = useCallback(() => {
    try {
      router.push(ROUTES.USER_TAB);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const initialRef = useRef<FormState>(buildInitialState(authProfile));
  const [form, setForm] = useState<FormState>(initialRef.current);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // City suggestions
  const [cityFocused, setCityFocused] = useState(false);

  // Username availability state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form whenever a fresh profile lands (e.g. session refresh).
  useEffect(() => {
    if (!authProfile) return;
    const fresh = buildInitialState(authProfile);
    initialRef.current = fresh;
    setForm(fresh);
  }, [authProfile?.id]);

  const isDirty = useMemo(
    () => !shallowEqualState(form, initialRef.current),
    [form]
  );

  // Username availability check — debounced and self-aware so the user's own
  // current username always shows as available.
  useEffect(() => {
    const candidate = form.username.trim().toLowerCase();
    const ownCurrent = (authProfile?.username || "").toLowerCase();
    const ownId = user?.id ?? null;

    if (candidate.length < USERNAME_MIN) {
      setUsernameChecking(false);
      setUsernameAvailable(null);
      return;
    }
    if (!USERNAME_REGEX.test(candidate)) {
      setUsernameChecking(false);
      setUsernameAvailable(false);
      return;
    }
    if (candidate === ownCurrent) {
      setUsernameChecking(false);
      setUsernameAvailable(true);
      return;
    }

    setUsernameChecking(true);
    setUsernameAvailable(null);

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    let cancelled = false;

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        // Build the query and only exclude the current user when we actually
        // have a valid UUID — otherwise Postgres rejects an empty string.
        let query = supabase
          .from("profiles")
          .select("id")
          .eq("username", candidate);
        if (ownId) query = query.neq("id", ownId);

        const { data, error } = await query.maybeSingle();
        if (cancelled) return;
        if (error) {
          console.warn("[edit_profile] username check failed:", error.message);
          setUsernameAvailable(false);
          return;
        }
        setUsernameAvailable(data === null);
      } catch (e) {
        if (cancelled) return;
        console.warn("[edit_profile] username check error:", e);
        setUsernameAvailable(false);
      } finally {
        if (!cancelled) setUsernameChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [form.username, user?.id, authProfile?.username]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener?.("beforeRemove", (e: any) => {
      if (isUploadingAvatar || isUploadingCover) {
        e.preventDefault();
        return;
      }
      if (!isDirty || isSaving) return;
      e.preventDefault();
      Alert.alert(
        t("edit_profile_discard_title"),
        t("edit_profile_discard_body"),
        [
          { text: t("edit_profile_keep_editing"), style: "cancel" },
          {
            text: t("edit_profile_discard"),
            style: "destructive",
            onPress: () => (navigation as any).dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, isSaving, isUploadingAvatar, isUploadingCover, t]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredCities = useMemo(() => {
    const q = form.city.trim().toLowerCase();
    if (!q) return [];
    // Don't show the suggestion list once the user has typed an exact match.
    if (CAMEROON_CITIES.some((c) => c.toLowerCase() === q)) return [];
    return CAMEROON_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [form.city]);

  const usernameFormatValid = USERNAME_REGEX.test(form.username.trim().toLowerCase());

  const validate = useCallback((): string | null => {
    const name = form.fullName.trim();
    const username = form.username.trim().toLowerCase();
    const bio = form.bio.trim();
    const phone = form.phone.trim();

    if (name.length < 2) return t("edit_profile_name_min");
    if (name.length > NAME_MAX) return t("edit_profile_name_max", { max: NAME_MAX });
    if (username.length < USERNAME_MIN)
      return t("edit_profile_username_min", { min: USERNAME_MIN });
    if (!USERNAME_REGEX.test(username))
      return t("edit_profile_username_format");
    if (usernameAvailable === false) return t("edit_profile_username_taken");
    if (bio.length > BIO_MAX) return t("edit_profile_bio_max", { max: BIO_MAX });
    if (phone && phone !== "+237" && !CAMEROON_PHONE_REGEX.test(phone))
      return t("edit_profile_phone_invalid");
    return null;
  }, [form, usernameAvailable, t]);

  const handleChangeAvatar = useCallback(async () => {
    if (!user?.id) {
      Alert.alert(t("edit_profile_sign_in_required"), t("edit_profile_sign_in_photo"));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("common_permission_needed"), t("edit_profile_photo_permission"));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    setIsUploadingAvatar(true);
    try {
      await uploadProfileAvatar(picked.assets[0].uri);
      await refetchProfile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("edit_profile_upload_photo_error");
      Alert.alert(t("edit_profile_upload_failed"), msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user?.id, refetchProfile, t]);

  const handleChangeCover = useCallback(async () => {
    if (!user?.id) {
      Alert.alert(t("edit_profile_sign_in_required"), t("edit_profile_sign_in_cover"));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("common_permission_needed"), t("edit_profile_cover_permission"));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    setIsUploadingCover(true);
    try {
      await uploadProfileCoverImage(picked.assets[0].uri);
      await refetchProfile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("edit_profile_upload_cover_error");
      Alert.alert(t("edit_profile_upload_failed"), msg);
    } finally {
      setIsUploadingCover(false);
    }
  }, [user?.id, refetchProfile, t]);

  const handleSave = useCallback(async () => {
    // Identity comes from the auth session, NOT the loaded profile row. A
    // profile row may briefly be null (still loading, RLS hiccup, or missing
    // for a freshly created account) while the user is still signed in.
    if (!user?.id) {
      Alert.alert(t("edit_profile_sign_in_required"), t("edit_profile_sign_in_edit"));
      return;
    }
    const validationError = validate();
    if (validationError) {
      Alert.alert(t("edit_profile_check_details"), validationError);
      return;
    }

    setIsSaving(true);
    try {
      const trimmedName = form.fullName.trim();
      const cleanedPhone = form.phone.trim() === "+237" ? null : form.phone.trim();
      const cleanedCity = form.city.trim() || null;
      const cleanedBio = form.bio.trim() || null;

      // Upsert so we create the row if the post-signup trigger never ran.
      // Keep media URLs so this save does not wipe an avatar set just before.
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: trimmedName,
            display_name: trimmedName,
            username: form.username.trim().toLowerCase(),
            bio: cleanedBio,
            phone: cleanedPhone,
            city: cleanedCity,
            ...(authProfile?.avatar_url ? { avatar_url: authProfile.avatar_url } : {}),
            ...(authProfile?.cover_image_url ? { cover_image_url: authProfile.cover_image_url } : {}),
          },
          { onConflict: "id" }
        );

      if (error) {
        const msg = /duplicate key|unique/i.test(error.message)
          ? t("edit_profile_username_taken")
          : error.message || t("edit_profile_save_error");
        Alert.alert(t("edit_profile_could_not_save"), msg);
        return;
      }

      await refetchProfile();
      initialRef.current = { ...form };
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : t("edit_profile_save_error");
      Alert.alert(t("edit_profile_could_not_save"), message);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, authProfile?.avatar_url, authProfile?.cover_image_url, form, refetchProfile, router, validate, t]);

  if (!isReady || (user?.id && profileLoading && !authProfile)) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color={RED} />
      </SafeAreaView>
    );
  }

  const canSave = isDirty && !isSaving && !usernameChecking;

  const usernameStatusIcon = (() => {
    if (form.username.trim().length < USERNAME_MIN) return null;
    if (usernameChecking) return <ActivityIndicator size="small" color="#94A3B8" />;
    if (!usernameFormatValid) return <MaterialCommunityIcons name="close-circle" size={20} color={RED} />;
    if (usernameAvailable === true)
      return <MaterialCommunityIcons name="check-circle" size={20} color={GREEN} />;
    if (usernameAvailable === false)
      return <MaterialCommunityIcons name="close-circle" size={20} color={RED} />;
    return null;
  })();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* -------- Header -------- */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common_back")}
          >
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("edit_profile_title")}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common_save")}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={RED} />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>{t("common_save")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* -------- Cover + avatar (same Storage bucket `avatars`, paths under user id) -------- */}
          <View style={styles.coverWrap}>
            {authProfile?.cover_image_url ? (
              <Image source={{ uri: authProfile.cover_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder} />
            )}
            {isUploadingCover ? (
              <View style={styles.coverUploadingOverlay} pointerEvents="none">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.coverCameraButton}
              onPress={handleChangeCover}
              disabled={isUploadingCover || isUploadingAvatar}
              accessibilityRole="button"
              accessibilityLabel={t("a11y_change_cover")}
            >
              <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {authProfile?.avatar_url ? (
                <Image source={{ uri: authProfile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={36} color="#9CA3AF" />
              )}
              {isUploadingAvatar ? (
                <View style={styles.avatarUploadingOverlay} pointerEvents="none">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.avatarCameraButton}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar || isUploadingCover}
              accessibilityRole="button"
              accessibilityLabel={t("a11y_change_profile_picture")}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* -------- Personal Details -------- */}
          <Text style={styles.sectionHeading}>{t("edit_profile_personal")}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("edit_profile_name")}<Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={form.fullName}
              onChangeText={(v) => setField("fullName", v)}
              placeholder={t("edit_profile_name_ph")}
              placeholderTextColor="#828282"
              autoCapitalize="words"
              maxLength={NAME_MAX}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                {t("edit_profile_username")}<Text style={styles.fieldCounter}>({form.username.length}/{USERNAME_MAX})</Text>
                <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <View
              style={[
                styles.usernameRow,
                form.username.length >= USERNAME_MIN && usernameAvailable === false && styles.inputError,
                form.username.length >= USERNAME_MIN &&
                  usernameAvailable === true &&
                  !usernameChecking &&
                  styles.inputSuccess,
              ]}
            >
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                value={form.username}
                onChangeText={(v) =>
                  setField(
                    "username",
                    v.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, USERNAME_MAX)
                  )
                }
                placeholder={t("edit_profile_username_ph")}
                placeholderTextColor="#828282"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.usernameInput}
              />
              {usernameStatusIcon ? <View style={styles.statusIcon}>{usernameStatusIcon}</View> : null}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("edit_profile_bio")}<Text style={styles.fieldCounter}>({form.bio.length}/{BIO_MAX})</Text>
            </Text>
            <TextInput
              value={form.bio}
              onChangeText={(v) => setField("bio", v.slice(0, BIO_MAX))}
              placeholder={t("edit_profile_bio_ph")}
              placeholderTextColor="#828282"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.bioInput]}
              textAlignVertical="top"
            />
          </View>

          {/* -------- Location & Contact -------- */}
          <Text style={styles.sectionHeading}>{t("edit_profile_location_contact")}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("edit_profile_city")}</Text>
            <View style={styles.input}>
              <TextInput
                value={form.city}
                onChangeText={(v) => setField("city", v)}
                onFocus={() => setCityFocused(true)}
                onBlur={() => setCityFocused(false)}
                placeholder={t("edit_profile_city_ph")}
                placeholderTextColor="#828282"
                autoCapitalize="words"
                style={styles.cityTextInput}
              />
            </View>
            {cityFocused && filteredCities.length > 0 ? (
              <View style={styles.suggestions}>
                {filteredCities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.suggestionRow}
                    onPress={() => setField("city", c)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.suggestionText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("edit_profile_phone")}</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={styles.flag}>🇨🇲</Text>
                <Text style={styles.phonePrefixText}>+237</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                value={form.phone.startsWith("+237") ? form.phone.slice(4) : form.phone}
                onChangeText={(v) => {
                  const digits = v.replace(/[^0-9]/g, "").slice(0, 9);
                  setField("phone", "+237" + digits);
                }}
                placeholder={t("edit_profile_phone_ph")}
                placeholderTextColor="#828282"
                keyboardType="phone-pad"
                maxLength={9}
                style={styles.phoneInput}
              />
            </View>
          </View>

          <View style={styles.footerSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff2800",
    fontFamily: "Inter",
  },
  saveTextDisabled: { color: "#94A3B8" },
  scrollContent: {
    paddingBottom: 48,
  },
  // -------- Cover + Avatar
  coverWrap: {
    width: "100%",
    height: 140,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0F172A",
  },
  coverUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCameraButton: {
    position: "absolute",
    alignSelf: "center",
    padding: 8,
  },
  avatarWrap: {
    marginLeft: 24,
    marginTop: -36,
    width: 84,
    height: 84,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F1F5F9",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 42,
  },
  avatarCameraButton: {
    position: "absolute",
    right: -4,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  // -------- Sections
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  fieldGroup: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F545E",
    fontFamily: "Inter",
    marginBottom: 6,
  },
  fieldCounter: {
    fontWeight: "400",
    color: "#9CA3AF",
  },
  required: { color: RED },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  bioInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  inputError: { borderColor: RED },
  inputSuccess: { borderColor: GREEN },
  // -------- Username
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#828282",
    fontFamily: "Inter",
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
  },
  statusIcon: { paddingLeft: 8 },
  // -------- City
  cityTextInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
    paddingVertical: 0,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  suggestionText: {
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter",
  },
  // -------- Phone
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  flag: { fontSize: 18 },
  phonePrefixText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
    paddingVertical: 14,
  },
  footerSpacer: { height: 32 },
});