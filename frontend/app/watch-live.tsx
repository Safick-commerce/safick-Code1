import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import type { LivePost } from "../types";
import { fetchLiveFeed } from "../utils/liveFeed";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/UserProfileContext";

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

export default function WatchLiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { liveId } = useLocalSearchParams<{ liveId?: string | string[] }>();
  const id = typeof liveId === "string" ? liveId : liveId?.[0];

  const { isAuthenticated, isReady } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<LivePost | null>(null);

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

  const leave = useCallback(() => {
    router.back();
  }, [router]);

  const sources = useMemo(() => (post ? resolveSources(post) : null), [post]);
  const isLive = post?.isLive === true;
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
        <GuestSignInPlaceholder subtitle="Sign in to watch lives and chat with sellers." />
      </>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {post && sources && !loading ? (
        <>
          <Image source={sources.cover} style={styles.mediaFill} resizeMode="cover" />
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
                accessibilityRole="button"
                accessibilityLabel="Leave live"
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
                        <Text style={styles.liveMiniText}>LIVE</Text>
                      </View>
                    ) : (
                      <View style={styles.replayMiniWrap}>
                        <Ionicons name="play-circle" size={12} color="#CBD5E1" />
                        <Text style={styles.replayMiniText}>Replay</Text>
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
                <TouchableOpacity
                  style={styles.followBtnHeader}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${post.sellerName}`}
                >
                  <Text style={styles.followBtnHeaderText}>Follow</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <Pressable
                onPress={leave}
                style={styles.iconChip}
                accessibilityRole="button"
                accessibilityLabel="Leave live"
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
            <Text style={styles.loadingHint}>Connecting to the stream…</Text>
          </View>
        ) : !post || !sources ? (
          <View style={styles.centered}>
            <Ionicons name="mic-off-outline" size={48} color="#64748B" />
            <Text style={styles.endedTitle}>This live isn't available</Text>
            <Text style={styles.endedSub}>
              It may have ended or the link could be wrong. Head back and pick another stream.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={leave} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.flexSpacer} pointerEvents="none" />
            <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
              <View style={styles.bottomPanel}>
                <Text style={styles.streamCaption} numberOfLines={2}>
                  {post.description}
                </Text>

                <View style={styles.composer}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="Say hi to the room…"
                    placeholderTextColor="rgba(255,255,255,0.42)"
                    editable={false}
                  />
                  <TouchableOpacity style={styles.sendBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Send message">
                    <Ionicons name="send" size={18} color="rgba(248,250,252,0.85)" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.composerHint}>
                  Live chat and in-stream checkout are on the way.
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
  sendBtn: { padding: 8 },
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
