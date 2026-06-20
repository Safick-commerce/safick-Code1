import { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../stores/userProfileStore";

type Audience = "Public" | "Followers";
type LiveCategory = "Fashion" | "Beauty" | "Electronics" | "Home" | "Lifestyle";
type SetupTab = "setup" | "checks";
type LiveOutcome = "idle" | "started" | "scheduled";

const LIVE_CATEGORIES: LiveCategory[] = ["Fashion", "Beauty", "Electronics", "Home", "Lifestyle"];

export default function GoLiveScreen() {
  const router = useRouter();
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
  const [audience, setAudience] = useState<Audience>("Public");
  const [moderateComments, setModerateComments] = useState(true);
  const [saveReplay, setSaveReplay] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [outcome, setOutcome] = useState<LiveOutcome>("idle");

  const cameraReady = Boolean(cameraPermission?.granted);
  const micReady = Boolean(micPermission?.granted);
  const checksReady = cameraReady && micReady && networkReady;
  const setupValid = title.trim().length >= 6 && Boolean(category);
  const canStartLive = setupOpenedOnce && setupValid && checksReady;
  const canSchedule = setupOpenedOnce && setupValid && Boolean(scheduledAt.trim());

  const validationMessage = useMemo(() => {
    if (!showValidation) return "";
    if (!setupOpenedOnce) return "Open setup first before starting or scheduling.";
    if (!setupValid) return "Title and category are required.";
    if (!checksReady) return "Camera, microphone, and network must all be ready.";
    return "";
  }, [showValidation, setupOpenedOnce, setupValid, checksReady]);

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
      Alert.alert("Permission needed", "Camera and microphone permissions are required.");
      return false;
    }
    return true;
  };

  if (!isReady || !isLoaded) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }
  if (!isAuthenticated) {
    return (
      <GuestSignInPlaceholder
        subtitle="Sign in to start or schedule live sessions."
        redirectTo="/golive"
      />
    );
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
      {cameraReady ? (
        <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} mode="video" mute={micMuted} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.permissionPanel]}>
          <Text style={styles.permissionText}>Camera and microphone access needed</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={ensurePermissions}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={["top", "left", "right"]} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.sideControls}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => setCameraFacing((p) => (p === "back" ? "front" : "back"))}>
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn} onPress={() => setMicMuted((v) => !v)}>
            <Ionicons name={micMuted ? "mic-off-outline" : "mic-outline"} size={22} color={micMuted ? "#FF2800" : "#FFFFFF"} />
            <Text style={styles.sideBtnLabel}>{micMuted ? "Unmute" : "Mute"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>Flash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="timer-outline" size={22} color="#FFFFFF" />
            <Text style={styles.sideBtnLabel}>Timer</Text>
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
              <Text style={styles.setupBtnText}>{isSheetExpanded ? "Hide" : "Setup"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.startBtn, !canStartLive && styles.disabled]}
              disabled={!canStartLive}
              onPress={async () => {
                setShowValidation(true);
                const ok = await ensurePermissions();
                if (!ok || !canStartLive) return;
                setOutcome("started");
                Alert.alert("Live started", "You are now live.");
              }}
            >
              <View style={styles.startDot} />
              <Text style={styles.startBtnText}>Go Live</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleBtn, !canSchedule && styles.disabled]}
              disabled={!canSchedule}
              onPress={() => {
                setShowValidation(true);
                if (!canSchedule) return;
                setOutcome("scheduled");
                Alert.alert("Live scheduled", `Your live has been scheduled for ${scheduledAt}.`);
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
                  <Text style={[styles.tabText, activeTab === "setup" && styles.tabTextActive]}>Setup</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === "checks" && styles.tabActive]} onPress={() => setActiveTab("checks")}>
                  <Text style={[styles.tabText, activeTab === "checks" && styles.tabTextActive]}>Checks</Text>
                </TouchableOpacity>
              </View>

              {activeTab === "setup" ? (
                <View style={styles.panel}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Live Title</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="What's your live about?"
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.chips}>
                      {LIVE_CATEGORIES.map((item) => (
                        <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                          <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Audience</Text>
                    <View style={styles.row}>
                      {(["Public", "Followers"] as Audience[]).map((item) => (
                        <TouchableOpacity key={item} style={[styles.audience, audience === item && styles.audienceActive]} onPress={() => setAudience(item)}>
                          <Text style={[styles.audienceText, audience === item && styles.audienceTextActive]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Moderate comments</Text>
                    <Switch value={moderateComments} onValueChange={setModerateComments} trackColor={{ true: "#FF2800" }} />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Save replay</Text>
                    <Switch value={saveReplay} onValueChange={setSaveReplay} trackColor={{ true: "#FF2800" }} />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Schedule (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={scheduledAt}
                      onChangeText={setScheduledAt}
                      placeholder="e.g. Tomorrow 3:00 PM"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.panel}>
                  <TouchableOpacity style={styles.check} onPress={requestCameraPermission}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="videocam-outline" size={18} color={cameraReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>Camera</Text>
                    </View>
                    <View style={[styles.checkBadge, cameraReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, cameraReady ? styles.checkOkText : styles.checkFailText]}>
                        {cameraReady ? "Ready" : "Fix"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.check} onPress={requestMicPermission}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="mic-outline" size={18} color={micReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>Microphone</Text>
                    </View>
                    <View style={[styles.checkBadge, micReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, micReady ? styles.checkOkText : styles.checkFailText]}>
                        {micReady ? "Ready" : "Fix"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.check} onPress={() => setNetworkReady((v) => !v)}>
                    <View style={styles.checkLeft}>
                      <Ionicons name="wifi-outline" size={18} color={networkReady ? "#15803D" : "#B91C1C"} />
                      <Text style={styles.checkText}>Network</Text>
                    </View>
                    <View style={[styles.checkBadge, networkReady ? styles.checkOk : styles.checkFail]}>
                      <Text style={[styles.checkBadgeText, networkReady ? styles.checkOkText : styles.checkFailText]}>
                        {networkReady ? "Ready" : "Fix"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {outcome !== "idle" ? (
                <View style={styles.outcome}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                  <Text style={styles.outcomeTitle}>{outcome === "started" ? "Live session started" : "Live session scheduled"}</Text>
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
