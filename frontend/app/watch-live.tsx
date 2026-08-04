import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import { LiveConnectionBanner } from "../components/live/LiveConnectionBanner";
import type { LivePost } from "../types";
import { fetchLiveFeed } from "../utils/liveFeed";
import { getLiveViewerToken } from "../lib/liveApi";
import { formatLiveDurationAgo } from "../lib/liveDuration";
import { useElapsedLiveTimer } from "../hooks/useElapsedLiveTimer";
import { useLiveConnection } from "../hooks/useLiveConnection";
import {
  joinLive,
  leaveLive,
  sendLiveLike,
  sendLiveMessage,
  subscribeToLiveLikeCount,
  subscribeToLiveStreamState,
} from "../lib/socket";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { FollowButton } from "../components/shared/FollowButton";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../stores/userProfileStore";
import { useLanguage } from "../context/LanguageContext";

const RED = "#FF2800";
/** Glass chips: light fill + border so the stream stays the hero. */
const GLASS_FILL = "rgba(1, 1, 1, 0.46)";
const GLASS_BORDER = "rgba(255, 255, 255, 0.32)";

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function resolveSources(post: LivePost): { cover: ImageSourcePropType; avatar: ImageSourcePropType } {
  const cover: ImageSourcePropType =
    typeof post.imageUrl === "string" ? { uri: post.imageUrl } : post.imageUrl;
  const avatar: ImageSourcePropType = post.sellerAvatar
    ? typeof post.sellerAvatar === "string"
      ? { uri: post.sellerAvatar }
      : post.sellerAvatar
    : cover;
  return { cover, avatar };
}

function LivePulseDot({ small }: { small?: boolean }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 0.35,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [v]);
  const size = small ? 6 : 8;
  return (
    <Animated.View
      style={[
        styles.livePulseDot,
        { opacity: v, width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

function RemoteLiveVideo({ refreshKey, paused }: { refreshKey: number; paused: boolean }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const remoteTrack = tracks.find((track) => !track.participant.isLocal);

  if (!remoteTrack || paused) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} key={`remote-video-${refreshKey}`}>
      <VideoTrack trackRef={remoteTrack} style={{ flex: 1 }} objectFit="cover" />
    </View>
  );
}

function ViewerLiveMedia({
  liveId,
  url,
  token,
  streamPaused,
  onStreamPausedChange,
}: {
  liveId: string;
  url: string;
  token: string;
  streamPaused: boolean;
  onStreamPausedChange: (paused: boolean) => void;
}) {
  const { t } = useLanguage();
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const { uiState, retryConnection } = useLiveConnection({ serverUrl: url, token });

  useEffect(() => {
    const unsub = subscribeToLiveStreamState((payload) => {
      if (payload.liveId === liveId) {
        onStreamPausedChange(payload.paused);
      }
    });
    return unsub;
  }, [liveId, onStreamPausedChange]);

  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        setVideoRefreshKey((k) => k + 1);
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await retryConnection();
      setVideoRefreshKey((k) => k + 1);
    } finally {
      setRetrying(false);
    }
  }, [retryConnection, retrying]);

  return (
    <>
      <RemoteLiveVideo refreshKey={videoRefreshKey} paused={streamPaused} />
      {streamPaused ? (
        <View style={styles.streamPausedOverlay} pointerEvents="none">
          <Ionicons name="pause-circle-outline" size={48} color="#FFFFFF" />
          <Text style={styles.streamPausedText}>{t("live_stream_paused")}</Text>
        </View>
      ) : null}
      <LiveConnectionBanner state={uiState} onRetry={() => void handleRetry()} retrying={retrying} />
    </>
  );
}

export default function WatchLiveScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { liveId } = useLocalSearchParams<{ liveId?: string | string[] }>();
  const id = typeof liveId === "string" ? liveId : liveId?.[0];

  const { isAuthenticated, isReady } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<LivePost | null>(null);
  const [lkSession, setLkSession] = useState<{
    url: string;
    token: string;
    startedAt?: string;
  } | null>(null);
  const [connectingStream, setConnectingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamPaused, setStreamPaused] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setPost(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await fetchLiveFeed();
        if (cancelled) return;
        setPost(rows.find((p) => p.id === id) ?? null);
      } catch {
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !post?.isLive) {
      setLkSession(null);
      setConnectingStream(false);
      setStreamError(null);
      return;
    }

    let cancelled = false;
    setConnectingStream(true);
    setStreamError(null);

    (async () => {
      try {
        const joined = await joinLive(id);
        if (!joined.ok && joined.error === "followers_only") {
          throw new Error(t("watch_live_followers_only"));
        }
        if (!joined.ok && joined.error !== "ack_timeout") {
          throw new Error(t("watch_live_stream_error"));
        }
        if (typeof joined.likeCount === "number") {
          setLikeCount(joined.likeCount);
        }
        const creds = await getLiveViewerToken(id);
        if (!cancelled) {
          setLkSession({
            url: creds.url,
            token: creds.token,
            startedAt: creds.event?.started_at ?? post?.startedAt,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLkSession(null);
          setStreamError(error instanceof Error ? error.message : t("watch_live_stream_error"));
        }
      } finally {
        if (!cancelled) setConnectingStream(false);
      }
    })();

    return () => {
      cancelled = true;
      leaveLive(id);
      setLkSession(null);
      setConnectingStream(false);
    };
  }, [id, post?.isLive, post?.startedAt, t]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToLiveLikeCount((payload) => {
      if (payload.liveId === id) {
        setLikeCount(payload.likeCount);
      }
    });
    return unsub;
  }, [id]);

  const isLive = post?.isLive === true;
  const streamStartedAt = lkSession?.startedAt ?? post?.startedAt ?? null;
  const elapsedLabel = useElapsedLiveTimer(streamStartedAt);
  const agoLabel = useMemo(() => {
    if (!streamStartedAt) return null;
    const startMs = Date.parse(streamStartedAt);
    if (!Number.isFinite(startMs)) return null;
    const sec = Math.floor((Date.now() - startMs) / 1000);
    return formatLiveDurationAgo(sec);
  }, [streamStartedAt, elapsedLabel]);

  const handleLike = useCallback(async () => {
    if (!id || liking || !isLive || !lkSession) return;
    setLiking(true);
    try {
      const result = await sendLiveLike(id);
      if (!result.ok) {
        Alert.alert(t("watch_live_like_failed"), result.error ?? t("common_try_again"));
        return;
      }
      if (typeof result.likeCount === "number") {
        setLikeCount(result.likeCount);
      }
    } finally {
      setLiking(false);
    }
  }, [id, isLive, liking, lkSession, t]);

  const performLeave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    if (id) leaveLive(id);
    setLkSession(null);
    router.back();
  }, [id, router]);

  const leave = useCallback(() => {
    if (leavingRef.current || leaving) return;
    if (isLive && lkSession) {
      Alert.alert(t("watch_live_leave_title"), t("watch_live_leave_confirm"), [
        { text: t("common_cancel"), style: "cancel" },
        {
          text: t("watch_live_leave_action"),
          style: "destructive",
          onPress: performLeave,
        },
      ]);
      return;
    }
    performLeave();
  }, [isLive, leaving, lkSession, performLeave, t]);

  const handleSendChat = useCallback(async () => {
    const trimmed = chatText.trim();
    if (!trimmed || !id || sendingChat || !isLive || !lkSession) return;
    setSendingChat(true);
    try {
      const result = await sendLiveMessage(id, trimmed);
      if (!result.ok) {
        Alert.alert(t("watch_live_chat_failed"), result.error ?? t("common_try_again"));
        return;
      }
      setChatText("");
    } catch (error) {
      Alert.alert(
        t("watch_live_chat_failed"),
        error instanceof Error ? error.message : t("common_try_again"),
      );
    } finally {
      setSendingChat(false);
    }
  }, [chatText, id, isLive, lkSession, sendingChat, t]);

  const sources = useMemo(() => (post ? resolveSources(post) : null), [post]);
  const viewers = formatViewers(post?.viewerCount ?? 0);
  if (!isReady || !profileLoaded) {
    return (
      <SafeAreaView style={styles.boot} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <ActivityIndicator color={RED} />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <GuestSignInPlaceholder
          subtitle={t("guest_watch_live_subtitle")}
          redirectTo="/watch-live"
        />
      </>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {post && sources && !loading ? (
        <>
          {isLive && lkSession ? (
            <View style={styles.mediaFill}>
              <LiveKitRoom
                serverUrl={lkSession.url}
                token={lkSession.token}
                connect
                audio={false}
                video={false}
              >
                <ViewerLiveMedia
                  liveId={id!}
                  url={lkSession.url}
                  token={lkSession.token}
                  streamPaused={streamPaused}
                  onStreamPausedChange={setStreamPaused}
                />
              </LiveKitRoom>
            </View>
          ) : isLive && streamError ? (
            <View style={[styles.mediaFill, styles.streamConnecting]}>
              <Ionicons name="alert-circle-outline" size={40} color="#FCA5A5" />
              <Text style={styles.streamErrorText}>{streamError}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={leave} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>{t("watch_live_go_back")}</Text>
              </TouchableOpacity>
            </View>
          ) : isLive && connectingStream ? (
            <View style={[styles.mediaFill, styles.streamConnecting]}>
              <ActivityIndicator color={RED} size="large" />
            </View>
          ) : (
            <Image source={sources.cover} style={styles.mediaFill} resizeMode="cover" />
          )}
          <View pointerEvents="none" style={styles.mediaDim} />
          <View
            pointerEvents="none"
            style={[styles.topScrim, { height: insets.top + 100 }]}
          />
          <View pointerEvents="none" style={[styles.bottomScrim, { height: insets.bottom + 150 }]} />
        </>
      ) : null}

      <View style={styles.shell} pointerEvents="box-none">
        <SafeAreaView edges={["top"]} style={styles.safeTransparent}>
          {!loading && post && sources ? (
            <View style={styles.headerRow}>
              <Pressable
                onPress={leave}
                style={styles.iconChip}
                disabled={leaving}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_leave_live")}
                hitSlop={12}
              >
                <Ionicons name="chevron-down" size={24} color="#F8FAFC" />
              </Pressable>

              <View style={styles.sellerCluster}>
                <Image source={sources.avatar} style={styles.headerAvatar} resizeMode="cover" />
                <View style={styles.sellerTextCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.sellerBarName} numberOfLines={1}>
                      {post.sellerName}
                    </Text>
                    {isLive ? (
                      <View style={styles.liveMiniWrap}>
                        <LivePulseDot small />
                        <Text style={styles.liveMiniText}>{t("common_live")}</Text>
                        {streamStartedAt ? (
                          <Text style={styles.liveDurationText}>
                            {t("watch_live_started_ago", { duration: agoLabel ?? elapsedLabel })}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <View style={styles.replayMiniWrap}>
                        <Ionicons name="play-circle" size={12} color="#CBD5E1" />
                        <Text style={styles.replayMiniText}>{t("common_replay")}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.subMetaRow}>
                    {post.category ? (
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{post.category}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.headerActions}>
                <View style={styles.viewerChip} accessibilityRole="text" accessibilityLabel={`${viewers} watching`}>
                  <Ionicons name="eye-outline" size={15} color="#E2E8F0" />
                  <Text style={styles.viewerChipText}>{viewers}</Text>
                </View>
                {post.sellerId ? (
                  <FollowButton sellerId={post.sellerId} variant="glass" />
                ) : (
                  <View style={styles.followBtnHeader}>
                    <Text style={styles.followBtnHeaderText}>{t("common_follow")}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <Pressable
                onPress={leave}
                style={styles.iconChip}
                disabled={leaving}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_leave_live")}
                hitSlop={12}
              >
                <Ionicons name="chevron-down" size={24} color="#F8FAFC" />
              </Pressable>
              <View style={styles.headerPlaceholderCenter} />
              <View style={styles.headerActionsSpacer} />
            </View>
          )}
        </SafeAreaView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={RED} size="large" />
            <Text style={styles.loadingHint}>{t("watch_live_connecting")}</Text>
          </View>
        ) : !post || !sources ? (
          <View style={styles.centered}>
            <Ionicons name="mic-off-outline" size={48} color="#64748B" />
            <Text style={styles.endedTitle}>{t("watch_live_unavailable_title")}</Text>
            <Text style={styles.endedSub}>{t("watch_live_unavailable_sub")}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={leave} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>{t("watch_live_go_back")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.flexSpacer} pointerEvents="none" />
            <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
              <View style={styles.bottomPanel}>
                <View style={styles.likeRow}>
                  <TouchableOpacity
                    style={[styles.likeBtn, (liking || !lkSession) && styles.likeBtnDisabled]}
                    onPress={() => void handleLike()}
                    disabled={liking || !lkSession}
                    accessibilityRole="button"
                    accessibilityLabel={t("watch_live_like")}
                  >
                    {liking ? (
                      <ActivityIndicator size="small" color="#F87171" />
                    ) : (
                      <Ionicons name="heart" size={22} color="#F87171" />
                    )}
                    <Text style={styles.likeCountText}>{likeCount}</Text>
                  </TouchableOpacity>
                  {isLive && streamStartedAt ? (
                    <Text style={styles.liveDurationSub}>
                      {elapsedLabel}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.streamCaption} numberOfLines={2}>
                  {post.description}
                </Text>

                <View style={styles.composer}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder={t("watch_live_chat_placeholder")}
                    placeholderTextColor="rgba(255,255,255,0.42)"
                    value={chatText}
                    onChangeText={setChatText}
                    editable={isLive && Boolean(lkSession) && !sendingChat}
                    onSubmitEditing={() => void handleSendChat()}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!chatText.trim() || sendingChat || !lkSession) && styles.sendBtnDisabled]}
                    activeOpacity={0.7}
                    disabled={!chatText.trim() || sendingChat || !lkSession}
                    onPress={() => void handleSendChat()}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y_send_message")}
                  >
                    {sendingChat ? (
                      <ActivityIndicator size="small" color="#F8FAFC" />
                    ) : (
                      <Ionicons name="send" size={18} color="rgba(248,250,252,0.85)" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.composerHint}>
                  {isLive && lkSession ? t("watch_live_chat_active_hint") : t("watch_live_chat_hint")}
                </Text>
              </View>
            </SafeAreaView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  mediaFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  streamConnecting: {
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  streamErrorText: {
    color: "#FCA5A5",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  streamPausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 8,
  },
  streamPausedText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  mediaDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
    zIndex: 1,
  },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  bottomScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  shell: {
    flex: 1,
    zIndex: 4,
  },
  safeTransparent: {
    backgroundColor: "transparent",
  },
  boot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  bottomSafe: { backgroundColor: "transparent" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headerPlaceholderCenter: { flex: 1 },
  headerActionsSpacer: { width: 44 },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginLeft: 6,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    borderWidth: 2,
    borderColor: RED,
  },
  sellerTextCol: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
  },
  sellerBarName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveMiniWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,75,75,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveMiniText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.65 },
  liveDurationText: { fontSize: 10, fontWeight: "600", color: "#FECACA", marginLeft: 4 },
  replayMiniWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  replayMiniText: { fontSize: 10, fontWeight: "700", color: "#E2E8F0" },
  subMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
    flexWrap: "wrap",
  },
  categoryPill: {
    backgroundColor: "rgba(255,40,0,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(254,202,202,0.45)",
  },
  categoryPillText: { fontSize: 10, fontWeight: "700", color: "#FFE4E6" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginLeft: 6,
    flexShrink: 0,
  },
  viewerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewerChipText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  followBtnHeader: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
  },
  followBtnHeaderText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2 },
  livePulseDot: { backgroundColor: RED },
  flexSpacer: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "transparent",
  },
  loadingHint: { marginTop: 12, fontSize: 15, color: "#94A3B8", fontWeight: "500" },
  endedTitle: { marginTop: 16, fontSize: 18, fontWeight: "700", color: "#F1F5F9", textAlign: "center" },
  endedSub: { marginTop: 8, fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: RED,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  bottomPanel: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 0,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: GLASS_FILL,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
  likeBtnDisabled: { opacity: 0.5 },
  likeCountText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  liveDurationSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  streamCaption: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 14,
    letterSpacing: 0.15,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLASS_FILL,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    paddingVertical: 10,
  },
  sendBtn: { padding: 8, minWidth: 36, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.45 },
  composerHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.58)",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 2,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
