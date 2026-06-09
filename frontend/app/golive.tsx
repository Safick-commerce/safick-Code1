import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { LiveKitRoom, VideoTrack, useTracks } from "@livekit/react-native";
import { Track } from "livekit-client";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/UserProfileContext";
import { useLanguage } from "../context/LanguageContext";
import { startLiveSession, endLiveSession } from "../lib/liveApi";
import type { TranslationKey } from "../i18n/types";

type Audience = "public" | "followers";

const AUDIENCE_LABEL_KEYS: Record<Audience, TranslationKey> = {
  public: "golive_audience_public",
  followers: "golive_audience_followers",
};
type LiveCategory = "Fashion" | "Beauty" | "Electronics" | "Home" | "Lifestyle";
type SetupTab = "setup" | "checks";
type LiveOutcome = "idle" | "started" | "scheduled";

const LIVE_CATEGORIES: LiveCategory[] = ["Fashion", "Beauty", "Electronics", "Home", "Lifestyle"];

const LIVE_CATEGORY_LABEL_KEYS: Record<LiveCategory, TranslationKey> = {
  Fashion: "cat_fashion",
  Beauty: "cat_beauty",
  Electronics: "cat_electronics",
  Home: "cat_home",
  Lifestyle: "cat_lifestyle",
};

function PublisherVideo() {
  const tracks = useTracks([Track.Source.Camera]);
  const videoTrack = tracks.find((track) => track.source === Track.Source.Camera);

  if (!videoTrack) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <VideoTrack trackRef={videoTrack} style={{ flex: 1 }} objectFit="cover" />
    </View>
  );
}

export default function GoLiveScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string | string[] }>();
  const resolvedProductId = typeof productId === "string" ? productId : productId?.[0];
  const { isAuthenticated, isReady } = useAuth();
  const { profile, isLoaded } = useUserProfile();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [micMuted, setMicMuted] = useState(false);
  const [networkReady, setNetworkReady] = useState(true);

  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [setupOpenedOnce, setSetupOpenedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState<SetupTab>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LiveCategory | "">("");
  const [audience, setAudience] = useState<Audience>("public");
  const [moderateComments, setModerateComments] = useState(true);
  const [saveReplay, setSaveReplay] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [outcome, setOutcome] = useState<LiveOutcome>("idle");
  const [liveSession, setLiveSession] = useState<{
    url: string;
    token: string;
    liveId: string;
  } | null>(null);
  const [starting, setStarting] = useState(false);

  const cameraReady = Boolean(cameraPermission?.granted);
  const micReady = Boolean(micPermission?.granted);
  const checksReady = cameraReady && micReady && networkReady;
  const setupValid = title.trim().length >= 6 && Boolean(category);
  const canStartLive = setupOpenedOnce && setupValid && checksReady;
  const canSchedule = setupOpenedOnce && setupValid && Boolean(scheduledAt.trim());

  const validationMessage = useMemo(() => {
    if (!showValidation) return "";
    if (!setupOpenedOnce) return t("golive_validation_title");
    if (!setupValid) return t("golive_validation_category");
    if (!checksReady) return t("common_camera_mic_required");
    return "";
  }, [showValidation, setupOpenedOnce, setupValid, checksReady, t]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isLoaded) return;
    if (profile.isGuestUser) return;
    if (!profile.readyToSharePromptSeen || !profile.readyToShareMode) {
      router.replace("/screens/readytoshare/sellersonboardingscreen");
    }
  }, [
    isAuthenticated,
    isLoaded,
    isReady,
    profile.isGuestUser,
    profile.readyToShareMode,
    profile.readyToSharePromptSeen,
    router,
  ]);

  const ensurePermissions = async () => {
    const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    const mic = micPermission?.granted ? micPermission : await requestMicPermission();
    if (!cam.granted || !mic.granted) {
      Alert.alert(t("common_permission_needed"), t("common_camera_mic_required"));
      return false;
    }
    return true;
  };

  const handleEndLive = useCallback(async () => {
    if (liveSession?.liveId) {
      try {
        await endLiveSession(liveSession.liveId);
      } catch {
        // Session may already be ended if the user disconnected abruptly.
      }
    }
    setLiveSession(null);
    setOutcome("idle");
  }, [liveSession?.liveId]);

  const handleGoLive = useCallback(async () => {
    setShowValidation(true);
    const ok = await ensurePermissions();
    if (!ok || !canStartLive) return;

    setStarting(true);
    try {
      const res = await startLiveSession({
        title: title.trim(),
        category: category || undefined,
        audience,
        productId: resolvedProductId,
      });
      setLiveSession({ url: res.url, token: res.token, liveId: res.liveId });
      setOutcome("started");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common_try_again");
      Alert.alert(t("golive_go_live"), message || t("common_try_again"));
    } finally {
      setStarting(false);
    }
  }, [
    audience,
    canStartLive,
    category,
    resolvedProductId,
    t,
    title,
  ]);

  if (!isReady || !isLoaded) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }
  if (!isAuthenticated) {
    return <GuestSignInPlaceholder subtitle={t("guest_golive_subtitle")} />;
  }
  if (!profile.readyToSharePromptSeen || !profile.readyToShareMode) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {liveSession ? (
        <View style={StyleSheet.absoluteFillObject}>
          <LiveKitRoom
            serverUrl={liveSession.url}
            token={liveSession.token}
            connect
            audio
            video
            onDisconnected={() => {
              void handleEndLive();
            }}
          >
            <PublisherVideo />
          </LiveKitRoom>
        </View>
      ) : cameraReady ? (
        <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} mode="video" mute={micMuted} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.permissionPanel]}>
          <Text style={styles.permissionText}>{t("common_camera_mic_required")}</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={ensurePermissions}>
            <Text style={styles.permissionBtnText}>{t("common_grant_permission")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={["top", "left", "right"]} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (liveSession) {
                void handleEndLive().then(() => router.back());
              } else {
                router.back();
              }
            }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>{t("common_live")}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.sideControls}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => setCameraFacing((p) => (p === "back" ? "front" : "back"))}>
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>{t("golive_flip")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => setMicMuted((v) => !v)}>
            <Ionicons name={micMuted ? "mic-off-outline" : "mic-outline"} size={22} color={micMuted ? "#FF2800" : "#FFFFFF"} />
            <Text style={styles.sideBtnLabel}>{micMuted ? t("golive_unmute") : t("golive_mute")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>{t("golive_flash")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="timer-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>{t("golive_timer")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sheet, isSheetExpanded && styles.sheetExpanded]}>
          <TouchableOpacity
            style={styles.handleWrap}
            activeOpacity={0.8}
            onPress={() => {
              const next = !isSheetExpanded;
              setIsSheetExpanded(next);
              if (next) setSetupOpenedOnce(true);
            }}
          >
            <View style={styles.handle} />
          </TouchableOpacity>

          <View style={styles.sheetTopRow}>
            <TouchableOpacity
              style={styles.setupBtn}
              onPress={() => {
                const next = !isSheetExpanded;
                setIsSheetExpanded(next);
                if (next) setSetupOpenedOnce(true);
              }}
            >
              <Ionicons name={isSheetExpanded ? "chevron-down" : "settings-outline"} size={18} color="#FFFFFF" />
              <Text style={styles.setupBtnText}>{isSheetExpanded ? t("golive_hide") : t("golive_setup")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.startBtn, (!canStartLive || starting) && styles.disabled]}
              disabled={!canStartLive || starting}
              onPress={() => {
                void handleGoLive();
              }}
            >
              {starting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.startDot} />
              )}
              <Text style={styles.startBtnText}>{t("golive_go_live")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleBtn, !canSchedule && styles.disabled]}
              disabled={!canSchedule}
              onPress={() => {
                setShowValidation(true);
                if (!canSchedule) return;
                setOutcome("scheduled");
                Alert.alert(t("golive_alert_scheduled"), scheduledAt);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

          {isSheetExpanded ? (
            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, activeTab === "setup" && styles.tabActive]} onPress={() => setActiveTab("setup")}>
                  <Text style={[styles.tabText, activeTab === "setup" && styles.tabTextActive]}>{t("golive_setup")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === "checks" && styles.tabActive]} onPress={() => setActiveTab("checks")}>
                  <Text style={[styles.tabText, activeTab === "checks" && styles.tabTextActive]}>{t("golive_check_camera")}</Text>
                </TouchableOpacity>
              </View>

              {activeTab === "setup" ? (
                <View style={styles.panel}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t("golive_live_title")}</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder={t("golive_placeholder_title")}
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t("golive_category")}</Text>
                    <View style={styles.chips}>
                      {LIVE_CATEGORIES.map((item) => (
                        <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                          <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                            {t(LIVE_CATEGORY_LABEL_KEYS[item])}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t("golive_audience")}</Text>
                    <View style={styles.row}>
                      {(["public", "followers"] as Audience[]).map((item) => (
                        <TouchableOpacity key={item} style={[styles.audience, audience === item && styles.audienceActive]} onPress={() => setAudience(item)}>
                          <Text style={[styles.audienceText, audience === item && styles.audienceTextActive]}>{t(AUDIENCE_LABEL_KEYS[item])}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>{t("golive_moderate_comments")}</Text>
                    <Switch value={moderateComments} onValueChange={setModerateComments} trackColor={{ true: "#FF2800" }} />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>{t("golive_save_replay")}</Text>
                    <Switch value={saveReplay} onValueChange={setSaveReplay} trackColor={{ true: "#FF2800" }} />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t("golive_schedule_optional")}</Text>
                    <TextInput
                      style={styles.input}
                      value={scheduledAt}
                      onChangeText={setScheduledAt}
                      placeholder={t("golive_schedule_ph")}
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.panel}>
                  <TouchableOpacity style={styles.check} onPress={requestCameraPermission}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="videocam-outline" size={18} color={cameraReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>{t("golive_check_camera")}</Text>
                    </View>
                    <View style={[styles.checkBadge, cameraReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, cameraReady ? styles.checkOkText : styles.checkFailText]}>
                        {cameraReady ? t("golive_ready") : t("golive_fix")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.check} onPress={requestMicPermission}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="mic-outline" size={18} color={micReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>{t("golive_check_microphone")}</Text>
                    </View>
                    <View style={[styles.checkBadge, micReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, micReady ? styles.checkOkText : styles.checkFailText]}>
                        {micReady ? t("golive_ready") : t("golive_fix")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.check} onPress={() => setNetworkReady((v) => !v)}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="wifi-outline" size={18} color={networkReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>{t("golive_check_network")}</Text>
                    </View>
                    <View style={[styles.checkBadge, networkReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, networkReady ? styles.checkOkText : styles.checkFailText]}>
                        {networkReady ? t("golive_ready") : t("golive_fix")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {outcome !== "idle" ? (
                <View style={styles.outcome}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                  <Text style={styles.outcomeTitle}>
                    {outcome === "started" ? t("golive_alert_started") : t("golive_outcome_scheduled")}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  centered: { justifyContent: "center", alignItems: "center" },

  permissionPanel: { backgroundColor: "#111827", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  permissionText: { color: "#FFFFFF", textAlign: "center", fontWeight: "600", fontSize: 16 },
  permissionBtn: { backgroundColor: "#FF2800", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  permissionBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF2800" },
  liveBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  sideControls: { position: "absolute", right: 12, top: "28%", gap: 22, alignItems: "center" },
  sideBtn: { alignItems: "center", gap: 4 },
  sideBtnLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },

  sheet: { backgroundColor: "#000000", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 38, minHeight: 120, maxHeight: 90 },
  sheetExpanded: { maxHeight: "65%" },
  handleWrap: { alignItems: "center", paddingTop: 6, paddingBottom: 4 },
  handle: { width: 42, height: 4, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.3)" },

  sheetTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  setupBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  setupBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  startBtn: { flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: "#FF2800", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  startDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  startBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  scheduleBtn: { minHeight: 42, width: 42, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  validationText: { marginTop: 8, fontSize: 12, color: "#FCA5A5" },

  sheetContent: { marginTop: 12 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: { flex: 1, minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  tabActive: { borderColor: "#FF2800", backgroundColor: "#FF2800" },
  tabText: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#FFFFFF" },

  panel: { gap: 12, backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 14, padding: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#ffffff" },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#111827", backgroundColor: "#FAFAFA", fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: "#ff2800", backgroundColor: "#ff2800" },
  chipText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  row: { flexDirection: "row", gap: 8 },
  audience: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  audienceActive: { borderColor: "#ff2800", backgroundColor: "#ff2800" },
  audienceText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  audienceTextActive: { color: "#ffffff" },
  toggleRow: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { color: "#ffffff", fontWeight: "600", fontSize: 13 },

  check: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  checkBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  checkBadgeText: { fontSize: 12, fontWeight: "700" },
  checkOk: { backgroundColor: "#F0FDF4" },
  checkOkText: { color: "#15803D" },
  checkFail: { backgroundColor: "#FEF2F2" },
  checkFailText: { color: "#B91C1C" },

  outcome: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#BBF7D0", backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, marginHorizontal: 2 },
  outcomeTitle: { color: "#166534", fontWeight: "700", fontSize: 13 },
});
