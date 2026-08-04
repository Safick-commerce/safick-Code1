import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  LiveKitRoom,
  VideoTrack,
  useIsMuted,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/react-native";
import { LocalVideoTrack, Track } from "livekit-client";
import { LiveConnectionBanner } from "./LiveConnectionBanner";
import { useLanguage } from "../../context/LanguageContext";
import { useElapsedLiveTimer } from "../../hooks/useElapsedLiveTimer";
import { useLiveConnection } from "../../hooks/useLiveConnection";
import { useSellerHeartbeat } from "../../hooks/useSellerHeartbeat";
import { endLiveSession } from "../../lib/liveApi";
import { setLiveVideoTorch } from "../../lib/liveTorch";
import { emitLiveStreamState, joinLive, leaveLive, subscribeToLiveLikeCount } from "../../lib/socket";

type CameraFacing = "front" | "back";

type LivePublisherRoomProps = {
  url: string;
  token: string;
  liveId: string;
  startedAt: string;
  onEnded: () => void;
  onRequestClose: () => void;
};

function PublisherVideo({ paused }: { paused: boolean }) {
  const tracks = useTracks([Track.Source.Camera]);
  const videoTrack = tracks.find((track) => track.source === Track.Source.Camera);

  if (!videoTrack || paused) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <VideoTrack trackRef={videoTrack} style={{ flex: 1 }} objectFit="cover" />
    </View>
  );
}

function LivePublisherControls({
  liveId,
  startedAt,
  url,
  token,
  endInFlightRef,
  onEnded,
  onRequestClose,
}: {
  liveId: string;
  startedAt: string;
  url: string;
  token: string;
  endInFlightRef: MutableRefObject<boolean>;
  onEnded: () => void;
  onRequestClose: () => void;
}) {
  const { t } = useLanguage();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const isMicMuted = useIsMuted({ source: Track.Source.Microphone, participant: localParticipant });
  const elapsed = useElapsedLiveTimer(startedAt);

  const {
    uiState,
    markIntentionalDisconnect,
    setDesiredMicEnabled,
    retryConnection,
  } = useLiveConnection({
    serverUrl: url,
    token,
    onIntentionalDisconnect: onEnded,
  });

  useSellerHeartbeat(liveId, true);

  const [ending, setEnding] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [micBusy, setMicBusy] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("front");
  const [torchOn, setTorchOn] = useState(false);
  const [streamPaused, setStreamPaused] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const cameraWasEnabledRef = useRef(true);

  useEffect(() => {
    void joinLive(liveId).then((res) => {
      if (typeof res.likeCount === "number") setLikeCount(res.likeCount);
    });
    const unsub = subscribeToLiveLikeCount((payload) => {
      if (payload.liveId === liveId) setLikeCount(payload.likeCount);
    });
    return () => {
      unsub();
      leaveLive(liveId);
    };
  }, [liveId]);

  const torchAvailable = cameraFacing === "back";

  useEffect(() => {
    setDesiredMicEnabled(!isMicMuted);
  }, [isMicMuted, setDesiredMicEnabled]);

  useEffect(() => {
    if (!torchAvailable && torchOn) {
      setTorchOn(false);
      const publication = localParticipant.getTrackPublication(Track.Source.Camera);
      const track = publication?.track;
      if (track instanceof LocalVideoTrack) {
        void setLiveVideoTorch(track, false);
      }
    }
  }, [localParticipant, torchAvailable, torchOn]);

  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        setStreamPaused(false);
        emitLiveStreamState(liveId, false);
        if (cameraWasEnabledRef.current) {
          void localParticipant.setCameraEnabled(true);
        }
        return;
      }
      if (next === "background" || next === "inactive") {
        const publication = localParticipant.getTrackPublication(Track.Source.Camera);
        cameraWasEnabledRef.current = publication ? !publication.isMuted : true;
        setStreamPaused(true);
        emitLiveStreamState(liveId, true);
        void localParticipant.setCameraEnabled(false);
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [liveId, localParticipant]);

  const handleEndStream = useCallback(async () => {
    if (endInFlightRef.current || ending) return;
    setEnding(true);
    markIntentionalDisconnect();
    try {
      await endLiveSession(liveId);
    } catch {
      // Session may already be ended server-side.
    }
    try {
      await room?.disconnect(true);
    } catch {
      // Room may already be disconnected.
    }
    setEnding(false);
    onEnded();
  }, [endInFlightRef, ending, liveId, markIntentionalDisconnect, onEnded, room]);

  const confirmEndStream = useCallback(() => {
    if (ending) return;
    Alert.alert(t("golive_end_stream"), t("golive_end_stream_confirm"), [
      { text: t("common_cancel"), style: "cancel" },
      {
        text: t("golive_end_stream"),
        style: "destructive",
        onPress: () => {
          void handleEndStream();
        },
      },
    ]);
  }, [ending, handleEndStream, t]);

  const confirmClose = useCallback(() => {
    if (ending) return;
    Alert.alert(t("golive_leave_title"), t("golive_leave_confirm"), [
      { text: t("common_cancel"), style: "cancel" },
      {
        text: t("golive_end_stream"),
        style: "destructive",
        onPress: () => {
          void handleEndStream().then(onRequestClose);
        },
      },
    ]);
  }, [ending, handleEndStream, onRequestClose, t]);

  const toggleMic = useCallback(async () => {
    if (micBusy || ending) return;
    setMicBusy(true);
    const nextEnabled = isMicMuted;
    try {
      await localParticipant.setMicrophoneEnabled(nextEnabled);
      setDesiredMicEnabled(nextEnabled);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common_try_again");
      Alert.alert(t("golive_mute"), message);
    } finally {
      setMicBusy(false);
    }
  }, [ending, isMicMuted, localParticipant, micBusy, setDesiredMicEnabled, t]);

  const flipCamera = useCallback(async () => {
    if (cameraBusy || ending) return;
    const nextFacing: CameraFacing = cameraFacing === "front" ? "back" : "front";
    setCameraBusy(true);
    try {
      const publication = localParticipant.getTrackPublication(Track.Source.Camera);
      const track = publication?.track;
      if (!track || !(track instanceof LocalVideoTrack)) {
        throw new Error(t("golive_camera_unavailable"));
      }
      if (nextFacing === "front" && torchOn) {
        setTorchOn(false);
        await setLiveVideoTorch(track, false);
      }
      await track.restartTrack({
        facingMode: nextFacing === "front" ? "user" : "environment",
      });
      setCameraFacing(nextFacing);
      if (nextFacing === "back" && torchOn) {
        await setLiveVideoTorch(track, true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common_try_again");
      Alert.alert(t("golive_flip"), message);
    } finally {
      setCameraBusy(false);
    }
  }, [cameraBusy, cameraFacing, ending, localParticipant, t, torchOn]);

  const toggleTorch = useCallback(async () => {
    if (ending || !torchAvailable) return;
    const publication = localParticipant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track;
    if (!track || !(track instanceof LocalVideoTrack)) {
      Alert.alert(t("golive_flash"), t("golive_camera_unavailable"));
      return;
    }
    const next = !torchOn;
    const ok = await setLiveVideoTorch(track, next);
    if (!ok) {
      Alert.alert(t("golive_flash"), t("golive_flash_unavailable"));
      return;
    }
    setTorchOn(next);
  }, [ending, localParticipant, t, torchAvailable, torchOn]);

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await retryConnection();
    } finally {
      setRetrying(false);
    }
  }, [retryConnection, retrying]);

  return (
    <>
      <PublisherVideo paused={streamPaused} />

      {streamPaused ? (
        <View style={styles.pausedOverlay} pointerEvents="none">
          <Ionicons name="pause-circle-outline" size={48} color="#FFFFFF" />
          <Text style={styles.pausedText}>{t("live_stream_paused")}</Text>
        </View>
      ) : null}

      <LiveConnectionBanner state={uiState} onRetry={() => void handleRetry()} retrying={retrying} />

      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity
          onPress={confirmClose}
          style={styles.closeBtn}
          disabled={ending}
          accessibilityRole="button"
          accessibilityLabel={t("common_close")}
          hitSlop={8}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>{t("common_live")}</Text>
          <Text style={styles.timerText}>{elapsed}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.likeBadge} pointerEvents="none">
        <Ionicons name="heart" size={14} color="#F87171" />
        <Text style={styles.likeBadgeText}>{likeCount}</Text>
      </View>

      <View style={styles.sideControls} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.sideBtn, (cameraBusy || ending) && styles.sideBtnDisabled]}
          onPress={() => void flipCamera()}
          disabled={cameraBusy || ending}
          accessibilityRole="button"
          accessibilityLabel={t("golive_flip")}
          hitSlop={6}
        >
          {cameraBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          )}
          <Text style={styles.sideBtnLabel}>{t("golive_flip")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sideBtn, (micBusy || ending) && styles.sideBtnDisabled]}
          onPress={() => void toggleMic()}
          disabled={micBusy || ending}
          accessibilityRole="button"
          accessibilityLabel={isMicMuted ? t("golive_unmute") : t("golive_mute")}
          hitSlop={6}
        >
          {micBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isMicMuted ? "mic-off-outline" : "mic-outline"}
              size={22}
              color={isMicMuted ? "#FF2800" : "#FFFFFF"}
            />
          )}
          <Text style={styles.sideBtnLabel}>{isMicMuted ? t("golive_unmute") : t("golive_mute")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sideBtn,
            (ending || !torchAvailable) && styles.sideBtnDisabled,
          ]}
          onPress={() => void toggleTorch()}
          disabled={ending || !torchAvailable}
          accessibilityRole="button"
          accessibilityLabel={t("golive_flash")}
          hitSlop={6}
        >
          <Ionicons
            name={torchOn ? "flash" : "flash-outline"}
            size={22}
            color={torchAvailable ? (torchOn ? "#FBBF24" : "#FFFFFF") : "rgba(255,255,255,0.35)"}
          />
          <Text
            style={[
              styles.sideBtnLabel,
              !torchAvailable && styles.sideBtnLabelMuted,
            ]}
          >
            {t("golive_flash")}
          </Text>
        </TouchableOpacity>

        <View style={styles.sideBtn}>
          <Ionicons name="timer-outline" size={22} color="#FFFFFF" />
          <Text style={styles.sideBtnLabel}>{elapsed}</Text>
        </View>
      </View>

      <View style={styles.endBar} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.endBtn, ending && styles.endBtnDisabled]}
          onPress={confirmEndStream}
          disabled={ending}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t("golive_end_stream")}
        >
          {ending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.endBtnText}>{t("golive_end_stream")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

export function LivePublisherRoom({
  url,
  token,
  liveId,
  startedAt,
  onEnded,
  onRequestClose,
}: LivePublisherRoomProps) {
  const endInFlightRef = useRef(false);

  const finishEnded = useCallback(() => {
    if (endInFlightRef.current) return;
    endInFlightRef.current = true;
    onEnded();
  }, [onEnded]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LiveKitRoom serverUrl={url} token={token} connect audio video>
        <LivePublisherControls
          liveId={liveId}
          startedAt={startedAt}
          url={url}
          token={token}
          endInFlightRef={endInFlightRef}
          onEnded={finishEnded}
          onRequestClose={onRequestClose}
        />
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF2800" },
  liveBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  timerText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", marginLeft: 2 },
  likeBadge: {
    position: "absolute",
    top: 100,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  likeBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  sideControls: {
    position: "absolute",
    right: 12,
    top: "28%",
    gap: 22,
    alignItems: "center",
  },
  sideBtn: { alignItems: "center", gap: 4, minWidth: 48, minHeight: 48, justifyContent: "center" },
  sideBtnDisabled: { opacity: 0.55 },
  sideBtnLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  sideBtnLabelMuted: { color: "rgba(255,255,255,0.55)" },
  endBar: {
    position: "absolute",
    bottom: 140,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#B91C1C",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 160,
    minHeight: 44,
  },
  endBtnDisabled: { opacity: 0.7 },
  endBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 10,
  },
  pausedText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
