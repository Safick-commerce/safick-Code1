import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ResizeMode, Video } from "expo-av";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/UserProfileContext";
import { createProduct } from "../utils/productApi";

/** Wizard: record/select video → trim/edit → listing fields → photos → review/post. */
type CreateStep = "capture" | "playback" | "edit" | "details" | "photos" | "review";
type ProductCategory = "Fashion" | "Beauty" | "Electronics" | "Home" | "Accessories";
type ProductCondition = "New" | "Like New" | "Used";

const CATEGORY_OPTIONS: ProductCategory[] = ["Fashion", "Beauty", "Electronics", "Home", "Accessories"];
const CONDITION_OPTIONS: ProductCondition[] = ["New", "Like New", "Used"];

export default function CreateNewScreen() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { profile, isLoaded } = useUserProfile();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // Current step + captured or picked video
  const [step, setStep] = useState<CreateStep>("capture");
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [isRecording, setIsRecording] = useState(false);

  // Edit step: mute, trim range (0–1), cover timestamp, optional sound overlay
  const [videoMuted, setVideoMuted] = useState(false);
  const [trimStartPct, setTrimStartPct] = useState(0);
  const [trimEndPct, setTrimEndPct] = useState(1);
  const videoDurationSec = 60;
  const trimStartSec = Math.round(trimStartPct * videoDurationSec);
  const trimEndSec = Math.round(trimEndPct * videoDurationSec);
  const [coverFrameSecond, setCoverFrameSecond] = useState("00:02");
  const [addedSound, setAddedSound] = useState<{ name: string; uri: string } | null>(null);
  const trimTrackWidth = useRef(0);
  const trimTrackX = useRef(0);

  // Listing form (details + gallery)
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [condition, setCondition] = useState<ProductCondition>("New");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [postState, setPostState] = useState<"idle" | "posting">("idle");

  // Header stepper (capture is full-screen, not shown in bars)
  const stepOrder: CreateStep[] = ["capture", "playback", "edit", "details", "photos", "review"];
  const stepLabels: Record<CreateStep, string> = {
    capture: "Capture",
    playback: "Playback",
    edit: "Edit",
    details: "Details",
    photos: "Photos",
    review: "Review",
  };

  // Inline validation for details step (shown after Next with showValidation)
  const detailsErrors = useMemo(() => {
    const parsedPrice = Number(price.replace(/,/g, ""));
    const parsedStock = Number(stock);
    return {
      title: title.trim().length >= 4 ? "" : "Title must be at least 4 characters.",
      category: category ? "" : "Select a category.",
      price: parsedPrice > 0 ? "" : "Add a valid price.",
      stock: Number.isInteger(parsedStock) && parsedStock > 0 ? "" : "Add valid stock.",
      description: description.trim().length >= 12 ? "" : "Description must be at least 12 characters.",
    };
  }, [title, category, price, stock, description]);

  const detailsValid = useMemo(() => Object.values(detailsErrors).every((err) => !err), [detailsErrors]);
  const canPost = Boolean(recordedVideoUri) && detailsValid && photos.length > 0;

  const handlePost = useCallback(async () => {
    if (!canPost || postState === "posting") return;

    const parsedPrice = Number(price.replace(/,/g, ""));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Product", "Please enter a valid price.");
      return;
    }

    setPostState("posting");
    try {
      await createProduct({
        title: title.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        imageUri: photos[0],
      });
      Alert.alert("Posted successfully", "Your listing is live.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not post your listing.";
      Alert.alert("Post failed", message);
    } finally {
      setPostState("idle");
    }
  }, [canPost, postState, price, title, description, photos, router]);

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

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec) % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Finger X on trim track → 0–1 (uses measureInWindow for screen coords)
  const pctFromPageX = useCallback((pageX: number) => {
    const w = trimTrackWidth.current;
    if (w <= 0) return 0;
    return Math.max(0, Math.min(1, (pageX - trimTrackX.current) / w));
  }, []);

  // Draggable trim handles (keep min gap between start/end)
  const startHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_: GestureResponderEvent, gestureState) => {
        const pct = pctFromPageX(gestureState.moveX);
        setTrimStartPct((prev) => Math.min(pct, trimEndPct - 0.02));
      },
    }),
  ).current;

  const endHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_: GestureResponderEvent, gestureState) => {
        const pct = pctFromPageX(gestureState.moveX);
        setTrimEndPct((prev) => Math.max(pct, trimStartPct + 0.02));
      },
    }),
  ).current;

  const onTrimTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    trimTrackWidth.current = width;
    (e.target as any)?.measureInWindow?.((x: number) => {
      trimTrackX.current = x;
    });
  }, []);

  // Record flow needs camera + microphone
  const ensureCapturePermissions = async () => {
    const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    const mic = micPermission?.granted ? micPermission : await requestMicPermission();
    if (!cam.granted || !mic.granted) {
      Alert.alert("Permission needed", "Camera and microphone permissions are required.");
      return false;
    }
    return true;
  };

  const handleRecordVideo = async () => {
    const ok = await ensureCapturePermissions();
    if (!ok || !cameraRef.current) return;
    if (isRecording) {
      (cameraRef.current as any).stopRecording?.();
      setIsRecording(false);
      return;
    }
    try {
      setIsRecording(true);
      const result = await (cameraRef.current as any).recordAsync?.({ maxDuration: 60, quality: "720p" });
      setIsRecording(false);
      if (result?.uri) {
        setRecordedVideoUri(result.uri);
        setStep("playback");
      }
    } catch {
      setIsRecording(false);
      Alert.alert("Recording failed", "Could not record video. Try again.");
    }
  };

  const handleUseGalleryClip = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Media library permission is required.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      setRecordedVideoUri(picked.assets[0].uri);
      setStep("playback");
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert("Photo limit reached", "You can add up to 5 photos.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Media library permission is required.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - photos.length),
      quality: 0.9,
    });
    if (!picked.canceled) {
      setPhotos((prev) => [...prev, ...picked.assets.map((asset) => asset.uri)].slice(0, 5));
    }
  };

  const handleAddSound = () => {
    Alert.alert(
      "Add Sound",
      "Sound library integration coming soon. For now, a placeholder track will be added.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Placeholder",
          onPress: () => setAddedSound({ name: "Upbeat Vibe", uri: "placeholder://sound" }),
        },
      ],
    );
  };

  // Back: leave screen from capture, else previous wizard step
  const goBackInFlow = () => {
    if (step === "capture") return router.back();
    if (step === "playback") setStep("capture");
    if (step === "edit") setStep("playback");
    if (step === "details") setStep("playback");
    if (step === "photos") setStep("details");
    if (step === "review") setStep("photos");
  };

  // Auth gate for create new screen
  if (!isReady || !isLoaded) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || profile.isGuestUser) {
    return <GuestSignInPlaceholder subtitle="Sign in to create product videos and post items." />;
  }

  if (!profile.readyToSharePromptSeen || !profile.readyToShareMode) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  // Step 1: full-screen camera (not in scroll stepper)
  if (step === "capture") {
    return (
      <View style={styles.captureScreen}>
        {cameraPermission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={cameraFacing} mode="video" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.permissionPanel]}>
            <Text style={styles.permissionText}>Camera and microphone access needed</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={ensureCapturePermissions}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        <SafeAreaView style={styles.captureOverlay} edges={["top", "bottom", "left", "right"]} pointerEvents="box-none">
          <View style={styles.captureTopBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addSoundPill} onPress={handleAddSound}>
              <Ionicons name="musical-note" size={14} color="#FFFFFF" />
              <Text style={styles.addSoundPillText}>{addedSound ? addedSound.name : "Add Sound"}</Text>
            </TouchableOpacity>
            {isRecording ? (
              <View style={styles.recIndicator}><View style={styles.recDot} /><Text style={styles.recText}>REC</Text></View>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <View style={styles.captureSideControls}>
            <TouchableOpacity style={styles.sideBtn} onPress={() => setCameraFacing((p) => (p === "back" ? "front" : "back"))}>
              <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
              <Text style={styles.sideBtnLabel}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn}>
              <Text style={styles.sideBtnIcon}>1x</Text>
              <Text style={styles.sideBtnLabel}>Speed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn}>
              <MaterialCommunityIcons name="auto-fix" size={22} color="#FFFFFF" />
              <Text style={styles.sideBtnLabel}>Beauty</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn}>
              <Ionicons name="timer-outline" size={22} color="#FFFFFF" />
              <Text style={styles.sideBtnLabel}>Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn}>
              <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
              <Text style={styles.sideBtnLabel}>Flash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.captureBottomBar}>
            <TouchableOpacity style={styles.galleryBtn} onPress={handleUseGalleryClip}>
              <View style={styles.galleryThumb}>
                <Ionicons name="images-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.galleryLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordBtn} onPress={handleRecordVideo} activeOpacity={0.7}>
              <View style={[styles.recordOuter, isRecording && styles.recordOuterActive]}>
                <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
              </View>
            </TouchableOpacity>

            <View style={styles.galleryBtn}>
              <View style={styles.galleryThumb}>
                <Ionicons name="color-wand-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.galleryLabel}>Effects</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Steps 2–6: stepper header + scroll panels
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={goBackInFlow} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.stepper}>
          {stepOrder.filter((s) => s !== "capture").map((item, idx) => (
            <View key={item} style={styles.stepCell}>
              <View style={[styles.stepDot, stepOrder.indexOf(step) >= stepOrder.indexOf(item) && styles.stepDotActive]}>
                <Text style={[styles.stepNum, stepOrder.indexOf(step) >= stepOrder.indexOf(item) && styles.stepNumActive]}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepTxt}>{stepLabels[item]}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Preview clip; jump to edit or skip to details */}
        {step === "playback" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 2: Playback</Text>
            {recordedVideoUri ? (
              <Video
                source={{ uri: recordedVideoUri }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={videoMuted}
                useNativeControls
              />
            ) : null}
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("capture")}>
                <Text style={styles.secondaryBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("edit")}>
                <Text style={styles.secondaryBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("details")}>
                <Text style={styles.primaryBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trim UI (visual only), mute, sound placeholder, cover timestamp */}
        {step === "edit" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Video</Text>

            {recordedVideoUri ? (
              <Video
                source={{ uri: recordedVideoUri }}
                style={styles.editVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={videoMuted}
                useNativeControls
              />
            ) : null}

            <View style={styles.editSection}>
              <View style={styles.editSectionHeader}>
                <Ionicons name="cut-outline" size={18} color="#111827" />
                <Text style={styles.editSectionTitle}>Trim Video</Text>
              </View>

              <View style={styles.trimTimestamps}>
                <Text style={styles.trimTime}>{formatTime(trimStartSec)}</Text>
                <Text style={styles.trimDuration}>{formatTime(trimEndSec - trimStartSec)}</Text>
                <Text style={styles.trimTime}>{formatTime(trimEndSec)}</Text>
              </View>

              <View style={styles.trimScrubber} onLayout={onTrimTrackLayout}>
                <View style={styles.trimFrameStrip}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <View key={i} style={[styles.trimFrameBlock, { backgroundColor: i % 2 === 0 ? "#374151" : "#4B5563" }]} />
                  ))}
                </View>

                <View
                  style={[
                    styles.trimDimOverlay,
                    { left: 0, width: `${trimStartPct * 100}%` },
                  ]}
                />
                <View
                  style={[
                    styles.trimDimOverlay,
                    { right: 0, width: `${(1 - trimEndPct) * 100}%` },
                  ]}
                />

                <View
                  style={[
                    styles.trimSelectedBorder,
                    {
                      left: `${trimStartPct * 100}%`,
                      right: `${(1 - trimEndPct) * 100}%`,
                    },
                  ]}
                />

                <View
                  style={[styles.trimHandle, styles.trimHandleLeft, { left: `${trimStartPct * 100}%` }]}
                  {...startHandleResponder.panHandlers}
                >
                  <View style={styles.trimHandleBar} />
                </View>

                <View
                  style={[styles.trimHandle, styles.trimHandleRight, { left: `${trimEndPct * 100}%` }]}
                  {...endHandleResponder.panHandlers}
                >
                  <View style={styles.trimHandleBar} />
                </View>
              </View>
            </View>

            <View style={styles.editSection}>
              <View style={styles.editSectionHeader}>
                <Ionicons name="musical-notes-outline" size={18} color="#111827" />
                <Text style={styles.editSectionTitle}>Sound</Text>
              </View>

              <TouchableOpacity style={styles.toggleRow} onPress={() => setVideoMuted((v) => !v)}>
                <View style={styles.toggleLeft}>
                  <Ionicons name={videoMuted ? "volume-mute" : "volume-high"} size={18} color={videoMuted ? "#DC2626" : "#111827"} />
                  <Text style={styles.toggleText}>Original audio</Text>
                </View>
                <View style={[styles.muteChip, videoMuted && styles.muteChipActive]}>
                  <Text style={[styles.muteChipText, videoMuted && styles.muteChipTextActive]}>
                    {videoMuted ? "Muted" : "On"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addSoundBtn} onPress={handleAddSound}>
                <View style={styles.addSoundLeft}>
                  <View style={styles.soundIcon}>
                    <Ionicons name="musical-note" size={18} color="#FF2800" />
                  </View>
                  <View>
                    <Text style={styles.addSoundTitle}>
                      {addedSound ? addedSound.name : "Add Sound"}
                    </Text>
                    <Text style={styles.addSoundSub}>
                      {addedSound ? "Tap to change" : "Browse music and effects"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {addedSound && (
                <TouchableOpacity
                  style={styles.removeSoundBtn}
                  onPress={() => setAddedSound(null)}
                >
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                  <Text style={styles.removeSoundText}>Remove sound</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.editSection}>
              <View style={styles.editSectionHeader}>
                <Ionicons name="image-outline" size={18} color="#111827" />
                <Text style={styles.editSectionTitle}>Cover Frame</Text>
              </View>
              <TextInput
                style={styles.detailInput}
                value={coverFrameSecond}
                onChangeText={setCoverFrameSecond}
                placeholder="Timestamp (e.g. 00:02)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("playback")}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("playback")}>
                <Text style={styles.primaryBtnText}>Save Edits</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Title, category, condition, price/stock, description */}
        {step === "details" && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Product Details</Text>
            <Text style={styles.detailsSubtitle}>Tell buyers about your product</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <Text style={styles.fieldLabel}>Title</Text>
              </View>
              <TextInput
                style={[styles.detailInput, showValidation && detailsErrors.title ? styles.detailInputError : null]}
                value={title}
                onChangeText={setTitle}
                placeholder="What are you selling?"
                placeholderTextColor="#9CA3AF"
              />
              {showValidation && detailsErrors.title ? <Text style={styles.error}>{detailsErrors.title}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="grid-outline" size={16} color="#6B7280" />
                <Text style={styles.fieldLabel}>Category</Text>
              </View>
              <View style={styles.chips}>
                {CATEGORY_OPTIONS.map((item) => (
                  <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                    <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {showValidation && detailsErrors.category ? <Text style={styles.error}>{detailsErrors.category}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="sparkles-outline" size={16} color="#6B7280" />
                <Text style={styles.fieldLabel}>Condition</Text>
              </View>
              <View style={styles.conditionRow}>
                {CONDITION_OPTIONS.map((item) => (
                  <TouchableOpacity key={item} style={[styles.conditionPill, condition === item && styles.conditionPillActive]} onPress={() => setCondition(item)}>
                    <Text style={[styles.conditionPillText, condition === item && styles.conditionPillTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.priceStockRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="cash-outline" size={16} color="#6B7280" />
                  <Text style={styles.fieldLabel}>Price</Text>
                </View>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.currencyTag}>XAF</Text>
                  <TextInput
                    style={[styles.detailInput, styles.priceInput, showValidation && detailsErrors.price ? styles.detailInputError : null]}
                    value={price}
                    onChangeText={(t) => setPrice(t.replace(/[^\d,]/g, ""))}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                {showValidation && detailsErrors.price ? <Text style={styles.error}>{detailsErrors.price}</Text> : null}
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="cube-outline" size={16} color="#6B7280" />
                  <Text style={styles.fieldLabel}>Stock</Text>
                </View>
                <TextInput
                  style={[styles.detailInput, showValidation && detailsErrors.stock ? styles.detailInputError : null]}
                  value={stock}
                  onChangeText={(t) => setStock(t.replace(/[^\d]/g, ""))}
                  placeholder="Qty"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
                {showValidation && detailsErrors.stock ? <Text style={styles.error}>{detailsErrors.stock}</Text> : null}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <Text style={styles.fieldLabel}>Description</Text>
              </View>
              <TextInput
                style={[styles.detailInput, styles.textArea, showValidation && detailsErrors.description ? styles.detailInputError : null]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product — material, size, features..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
              {showValidation && detailsErrors.description ? <Text style={styles.error}>{detailsErrors.description}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setShowValidation(true);
                if (detailsValid) setStep("photos");
              }}
            >
              <Text style={styles.primaryBtnText}>Next: Add Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Up to 5 gallery images for the listing */}
        {step === "photos" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 5: Add Product Photos</Text>
            <Text style={styles.photoSubtitle}>Add up to 5 photos of your product ({photos.length}/5)</Text>

            <View style={styles.photos}>
              {photos.map((photo, idx) => (
                <View key={`${photo}-${idx}`} style={styles.photoCard}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoIndex}>{idx + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Ionicons name="close-circle" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 ? (
                <TouchableOpacity style={styles.addPhoto} onPress={handleAddPhoto}>
                  <View style={styles.addPhotoIconWrap}>
                    <Ionicons name="add" size={28} color="#FF2800" />
                  </View>
                  <Text style={styles.addPhotoTxt}>Add Photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !photos.length && styles.disabled]}
              disabled={!photos.length}
              onPress={() => {
                if (!photos.length) return Alert.alert("Add photos", "Please add at least one product photo.");
                setStep("review");
              }}
            >
              <Text style={styles.primaryBtnText}>Next: Review</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary + post to Supabase (video upload: Phase 2 — first photo is listing image) */}
        {step === "review" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.reviewHeading}>Review and Post</Text>

            {recordedVideoUri ? (
              <Video
                source={{ uri: recordedVideoUri }}
                style={styles.reviewVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={videoMuted}
                useNativeControls
              />
            ) : null}

            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewPhotosScroll}>
                {photos.map((photo, idx) => (
                  <Image key={`${photo}-${idx}`} source={{ uri: photo }} style={styles.reviewPhotoThumb} />
                ))}
              </ScrollView>
            )}

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardHeader}>Product Info</Text>

              <TouchableOpacity style={styles.rvRow} onPress={() => setStep("details")} activeOpacity={0.6}>
                <View style={styles.rvIconWrap}>
                  <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                </View>
                <View style={styles.rvContent}>
                  <Text style={styles.rvLabel}>Title</Text>
                  <Text style={styles.rvValue} numberOfLines={1}>{title || "Not set"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>

              <View style={styles.rvDivider} />

              <TouchableOpacity style={styles.rvRow} onPress={() => setStep("details")} activeOpacity={0.6}>
                <View style={styles.rvIconWrap}>
                  <Ionicons name="grid-outline" size={16} color="#6B7280" />
                </View>
                <View style={styles.rvContent}>
                  <Text style={styles.rvLabel}>Category</Text>
                  {category ? (
                    <View style={styles.rvChip}><Text style={styles.rvChipText}>{category}</Text></View>
                  ) : (
                    <Text style={styles.rvValueMissing}>Not set</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>

              <View style={styles.rvDivider} />

              <TouchableOpacity style={styles.rvRow} onPress={() => setStep("details")} activeOpacity={0.6}>
                <View style={styles.rvIconWrap}>
                  <Ionicons name="sparkles-outline" size={16} color="#6B7280" />
                </View>
                <View style={styles.rvContent}>
                  <Text style={styles.rvLabel}>Condition</Text>
                  <View style={styles.rvConditionChip}>
                    <Text style={styles.rvConditionText}>{condition}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardHeader}>Pricing & Stock</Text>

              <View style={styles.rvPriceRow}>
                <View style={styles.rvPriceBlock}>
                  <Text style={styles.rvPriceLabel}>Price</Text>
                  <Text style={styles.rvPriceAmount}>{price ? `${price}` : "—"}</Text>
                  <Text style={styles.rvPriceCurrency}>XAF</Text>
                </View>
                <View style={styles.rvPriceDivider} />
                <View style={styles.rvPriceBlock}>
                  <Text style={styles.rvPriceLabel}>Stock</Text>
                  <Text style={styles.rvStockAmount}>{stock || "—"}</Text>
                  <Text style={styles.rvPriceCurrency}>units</Text>
                </View>
              </View>
            </View>

            {description ? (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewCardHeader}>Description</Text>
                <Text style={styles.rvDescription} numberOfLines={4}>{description}</Text>
              </View>
            ) : null}

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardHeader}>Media</Text>

              <View style={styles.rvRow}>
                <View style={styles.rvIconWrap}>
                  <Ionicons name="musical-note" size={16} color={addedSound ? "#FF2800" : "#6B7280"} />
                </View>
                <View style={styles.rvContent}>
                  <Text style={styles.rvLabel}>Sound</Text>
                  <Text style={[styles.rvValue, addedSound && { color: "#FF2800" }]}>{addedSound ? addedSound.name : "None"}</Text>
                </View>
              </View>

              <View style={styles.rvDivider} />

              <View style={styles.rvRow}>
                <View style={styles.rvIconWrap}>
                  <Ionicons name="images-outline" size={16} color="#6B7280" />
                </View>
                <View style={styles.rvContent}>
                  <Text style={styles.rvLabel}>Photos</Text>
                  <Text style={styles.rvValue}>{photos.length} added</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep("photos")}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, !canPost && styles.disabled]}
                disabled={!canPost || postState === "posting"}
                onPress={handlePost}
              >
                <Text style={styles.primaryBtnText}>{postState === "posting" ? "Posting..." : "Post"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width: SCREEN_W } = Dimensions.get("window");

// Layout constants reused for photo grid cell size
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { justifyContent: "center", alignItems: "center" },

  captureScreen: { flex: 1, backgroundColor: "#000000" },
  captureOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },

  captureTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  addSoundPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  addSoundPillText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  recIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(220,38,38,0.85)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  recText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },

  captureSideControls: { position: "absolute", right: 12, top: "30%", gap: 22, alignItems: "center" },
  sideBtn: { alignItems: "center", gap: 4 },
  sideBtnIcon: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  sideBtnLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },

  captureBottomBar: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-evenly", paddingBottom: 18 },
  galleryBtn: { alignItems: "center", gap: 4, width: 64 },
  galleryThumb: { width: 48, height: 48, borderRadius: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  galleryLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },

  recordBtn: { alignItems: "center", justifyContent: "center", marginBottom: 4 },
  recordOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  recordOuterActive: { borderColor: "rgba(255,255,255,0.9)" },
  recordInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FF2800" },
  recordInnerActive: { width: 28, height: 28, borderRadius: 6 },

  permissionPanel: { backgroundColor: "#111827", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  permissionText: { color: "#FFFFFF", textAlign: "center", fontWeight: "600", fontSize: 16 },
  permissionBtn: { backgroundColor: "#FF2800", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  permissionBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: -10 },
  iconBtn: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  content: { padding: 14, gap: 12, paddingBottom: 28 },
  stepper: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  stepCell: { alignItems: "center", flex: 1, gap: 2 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: "#FF2800" },
  stepNum: { fontSize: 11, color: "#4B5563", fontWeight: "700" },
  stepNumActive: { color: "#FFFFFF" },
  stepTxt: { fontSize: 10, color: "#9CA3AF" },
  card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  video: { width: "100%", height: 650, borderRadius: 12, backgroundColor: "#111827" },
  editVideo: { width: "100%", height: 280, borderRadius: 12, backgroundColor: "#111827" },
  row: { flexDirection: "row", gap: 8 },

  editSection: { gap: 10, paddingTop: 6 },
  editSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  editSectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },

  trimTimestamps: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trimTime: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  trimDuration: { fontSize: 12, color: "#FF2800", fontWeight: "700" },

  trimScrubber: { height: 56, borderRadius: 8, overflow: "visible", position: "relative" },
  trimFrameStrip: { flexDirection: "row", height: 48, borderRadius: 6, overflow: "hidden", marginTop: 4 },
  trimFrameBlock: { flex: 1 },

  trimDimOverlay: { position: "absolute", top: 4, height: 48, backgroundColor: "rgba(0,0,0,0.55)" },

  trimSelectedBorder: { position: "absolute", top: 2, height: 52, borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 6 },

  trimHandle: { position: "absolute", top: 0, width: 20, height: 56, alignItems: "center", justifyContent: "center", zIndex: 10 },
  trimHandleLeft: { marginLeft: -10 },
  trimHandleRight: { marginLeft: -10 },
  trimHandleBar: { width: 4, height: 28, borderRadius: 2, backgroundColor: "#FFFFFF" },

  toggleRow: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleText: { color: "#111827", fontWeight: "600" },
  muteChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#F3F4F6" },
  muteChipActive: { backgroundColor: "#FEE2E2" },
  muteChipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  muteChipTextActive: { color: "#DC2626" },

  addSoundBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12 },
  addSoundLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  soundIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF1EE", alignItems: "center", justifyContent: "center" },
  addSoundTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  addSoundSub: { fontSize: 11, color: "#9CA3AF" },
  removeSoundBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  removeSoundText: { fontSize: 12, color: "#DC2626", fontWeight: "600" },

  detailsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 18, borderWidth: 1, borderColor: "#F3F4F6", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  detailsTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  detailsSubtitle: { fontSize: 13, color: "#9CA3AF", marginTop: -12 },
  fieldGroup: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  detailInput: { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", backgroundColor: "#FAFAFA" },
  detailInputError: { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" },
  priceStockRow: { flexDirection: "row", gap: 12 },
  priceInputWrap: { flexDirection: "row", alignItems: "center" },
  currencyTag: { position: "absolute", left: 14, zIndex: 2, fontSize: 13, fontWeight: "700", color: "#9CA3AF" },
  priceInput: { paddingLeft: 48 },
  conditionRow: { flexDirection: "row", gap: 8 },
  conditionPill: { flex: 1, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAFA" },
  conditionPillActive: { borderColor: "#FF2800", backgroundColor: "#FFF1EE" },
  conditionPillText: { color: "#6B7280", fontWeight: "700", fontSize: 13 },
  conditionPillTextActive: { color: "#FF2800" },

  primaryBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: "#FF2800", alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#111827", alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { color: "#111827", fontWeight: "600", fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: "top", paddingTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#FAFAFA" },
  chipActive: { borderColor: "#111827", backgroundColor: "#111827" },
  chipText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  error: { color: "#DC2626", fontSize: 12, marginTop: -2 },
  photoSubtitle: { fontSize: 13, color: "#6B7280" },
  photos: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  photoCard: { width: "48.5%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: "#F3F4F6" },
  photoImage: { width: "100%", height: "100%", borderRadius: 12 },
  photoOverlay: { position: "absolute", bottom: 8, left: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  photoIndex: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  photoRemoveBtn: { position: "absolute", top: 6, right: 6 },
  addPhoto: { width: "48.5%", aspectRatio: 1, borderWidth: 2, borderStyle: "dashed", borderColor: "#D1D5DB", borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FAFAFA" },
  addPhotoIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF1EE", alignItems: "center", justifyContent: "center" },
  addPhotoTxt: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  reviewHeading: { fontSize: 20, fontWeight: "800", color: "#111827" },
  reviewVideo: { width: "100%", height: 400, borderRadius: 14, backgroundColor: "#111827" },
  reviewPhotosScroll: { gap: 8, paddingVertical: 2 },
  reviewPhotoThumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#F3F4F6" },

  reviewCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F3F4F6", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  reviewCardHeader: { fontSize: 13, fontWeight: "800", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  rvRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  rvIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rvContent: { flex: 1, gap: 2 },
  rvLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  rvValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
  rvValueMissing: { fontSize: 14, color: "#D1D5DB", fontWeight: "600" },
  rvDivider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 44 },

  rvChip: { backgroundColor: "#111827", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  rvChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  rvConditionChip: { backgroundColor: "#FFF1EE", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  rvConditionText: { color: "#FF2800", fontSize: 12, fontWeight: "700" },

  rvPriceRow: { flexDirection: "row", alignItems: "center" },
  rvPriceBlock: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 8 },
  rvPriceLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  rvPriceAmount: { fontSize: 28, color: "#111827", fontWeight: "800" },
  rvStockAmount: { fontSize: 28, color: "#111827", fontWeight: "800" },
  rvPriceCurrency: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  rvPriceDivider: { width: 1, height: 48, backgroundColor: "#F3F4F6" },

  rvDescription: { fontSize: 14, color: "#374151", lineHeight: 20 },
  disabled: { opacity: 0.5 },
});
