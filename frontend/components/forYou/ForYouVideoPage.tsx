/**
 * This component is used to display a video in the for you feed.
 * It is used in the ForYouTab component.
 * It is also used in the ProfileClipsScreen component.
 * It is also used in the SearchScreen component.
 * It is also used in the ProductDetailsScreen component.
 * It is also used in the ProductDetailsScreen component.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio, ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import ProductCard from "../shared/ProductCard";
import VideoSideIcons from "../shared/VideoSideIcons";
import type { ForYouFeedItem } from "../../utils/forYouFeed";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
/** Stop endless spinner when storage URL is private (browser shows access denied). */
const VIDEO_LOAD_TIMEOUT_MS = 1000;

function sellerDisplayName(item: ForYouFeedItem): string {
  const s = item.seller;
  return (
    s.displayName?.trim() ||
    (s.username ? `@${s.username}` : "Seller")
  );
}

function SellerAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const uri = avatarUrl?.trim();
  if (uri) {
    return <Image source={{ uri }} style={styles.profileCircleImage} resizeMode="cover" />;
  }
  return (
    <View style={styles.avatarPlaceholder}>
      <Ionicons name="person" size={28} color="#6B7280" />
    </View>
  );
}

export type ForYouVideoPageProps = {
  item: ForYouFeedItem;
  /** Height of one feed page (tab content area). */
  pageHeight: number;
  /** When true, video plays; when false, paused. */
  isActive: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onBuyPress: () => void;
  onSellerPress: () => void;
  /** `profile` = seller clips screen (product card pinned to bottom). */
  variant?: "feed" | "profile";
  /** Y offset for seller row when `variant="profile"` (clears screen header). */
  profileSellerTop?: number;
  /** Fired once when this page becomes active (e.g. view analytics). */
  onBecameActive?: () => void;
  /** Fired once when the first video frame is ready to display. */
  onFirstFrameReady?: () => void;
};

export default function ForYouVideoPage({
  item,
  pageHeight,
  isActive,
  isFollowing,
  onToggleFollow,
  onBuyPress,
  onSellerPress,
  variant = "feed",
  profileSellerTop,
  onBecameActive,
  onFirstFrameReady,
}: ForYouVideoPageProps) {
  const videoRef = useRef<Video>(null);
  const becameActiveFired = useRef(false);
  const firstFrameReadyFired = useRef(false);
  const [muted, setMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const insets = useSafeAreaInsets();

  const videoUri = item.videoUrl?.trim() ?? "";
  const hasValidUri =
    videoUri.startsWith("http://") || videoUri.startsWith("https://");
  const shouldPlay = isActive && !userPaused && !playError && hasValidUri;

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  useEffect(() => {
    setPlayError(!hasValidUri);
    setBuffering(hasValidUri);
    setFirstFrameReady(false);
    setUserPaused(false);
    becameActiveFired.current = false;
    firstFrameReadyFired.current = false;
  }, [item.id, videoUri, hasValidUri, reloadNonce]);

  const markFirstFrameReady = useCallback(() => {
    if (firstFrameReadyFired.current) return;
    firstFrameReadyFired.current = true;
    setFirstFrameReady(true);
    onFirstFrameReady?.();
  }, [onFirstFrameReady]);

  useEffect(() => {
    if (!hasValidUri && !firstFrameReadyFired.current) {
      firstFrameReadyFired.current = true;
      onFirstFrameReady?.();
    }
  }, [hasValidUri, onFirstFrameReady]);

  useEffect(() => {
    if (!isActive) {
      setUserPaused(false);
      becameActiveFired.current = false;
      return;
    }
    if (!becameActiveFired.current && hasValidUri && !playError) {
      becameActiveFired.current = true;
      onBecameActive?.();
    }
  }, [isActive, hasValidUri, playError, onBecameActive]);

  useEffect(() => {
    if (!hasValidUri || playError || firstFrameReady) return;
    const timer = setTimeout(() => {
      setBuffering(false);
      markFirstFrameReady();
    }, VIDEO_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hasValidUri, playError, firstFrameReady, item.id, reloadNonce, markFirstFrameReady]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ("error" in status && status.error) {
          setPlayError(false);
          setBuffering(false);
        }
        return;
      }
      setPlayError(false);
      setBuffering(status.isBuffering);
      if ((status.durationMillis ?? 0) > 0 && !status.isBuffering) {
        markFirstFrameReady();
      }
    },
    [markFirstFrameReady],
  );

  const handleVideoError = useCallback(
    (message: string) => {
      if (__DEV__) {
        console.warn("[ForYou] video error:", message, videoUri);
      }
      setPlayError(true);
      setBuffering(false);
      markFirstFrameReady();
    },
    [videoUri, markFirstFrameReady],
  );

  const togglePlayPause = useCallback(() => {
    if (playError || !hasValidUri) return;
    setUserPaused((paused) => {
      const next = !paused;
      void (async () => {
        try {
          if (next) {
            await videoRef.current?.pauseAsync();
          } else if (isActive) {
            await videoRef.current?.playAsync();
          }
        } catch {
          /* shouldPlay prop is the source of truth if native calls fail */
        }
      })();
      return next;
    });
  }, [playError, hasValidUri, isActive]);

  const thumbnailUri = item.thumbnailUrl?.trim() || null;
  const showPoster = playError || !firstFrameReady;
  const showBufferSpinner =
    buffering && !playError && !firstFrameReady && !thumbnailUri;

  const locationLabel = item.seller.city?.trim() || "Cameroon";
  const isProfile = variant === "profile";

  return (
    <View style={[styles.page, { width: SCREEN_WIDTH, height: pageHeight }]}>
      {hasValidUri ? (
        <Video
          ref={videoRef}
          key={`${item.id}-${reloadNonce}`}
          source={{ uri: videoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={shouldPlay}
          isLooping
          isMuted={muted}
          posterSource={thumbnailUri ? { uri: thumbnailUri } : undefined}
          progressUpdateIntervalMillis={500}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={() => handleVideoError("playback failed")}
        />
      ) : null}

      {!playError && hasValidUri ? (
        <Pressable
          style={[
            styles.playPauseTapFeed,
            isProfile ? styles.playPauseTapProfile : styles.playPauseTapFeed,
          ]}
          onPress={togglePlayPause}
          accessibilityLabel={userPaused ? "Play video" : "Pause video"}
          accessibilityRole="button"
        />
      ) : null}

      {userPaused && !playError ? (
        <View style={styles.playIconOverlay} pointerEvents="none">
          <View style={styles.playIconCircle}>
            <Ionicons name="play" size={40} color="#FFFFFF" />
          </View>
        </View>
      ) : null}

      {showPoster && !thumbnailUri ? (
        <View style={[StyleSheet.absoluteFill, styles.posterPlaceholder]} />
      ) : null}

      {showBufferSpinner ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}

      {playError && (
        <View style={styles.centerOverlay}>
          <TouchableOpacity
            onPress={() => {
              setPlayError(false);
              setBuffering(true);
              setFirstFrameReady(false);
              firstFrameReadyFired.current = false;
              setReloadNonce((n) => n + 1);
            }}
          >
            <Ionicons name="refresh-outline" size={70} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <Pressable
        style={[
          styles.muteTap,
          isProfile && { bottom: Math.max(insets.bottom, 12) + 88 },
        ]}
        onPress={() => setMuted((m) => !m)}
        accessibilityLabel="Toggle mute"
      >
        <View style={styles.muteChip}>
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={20} color="#FFFFFF" />
        </View>
      </Pressable>

      <View
        style={[
          styles.profileHeaderContainer,
          isProfile && {
            top: profileSellerTop ?? insets.top + 56,
            right: 16,
          },
        ]}
      >
        <View style={styles.profileCircle}>
          <SellerAvatar avatarUrl={item.seller.avatarUrl} />
        </View>
        <TouchableOpacity style={styles.usernameContainer} onPress={onSellerPress} activeOpacity={0.8}>
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
            {sellerDisplayName(item)}
          </Text>
          <View style={styles.locationRow}>
            <EvilIcons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
              {locationLabel}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followButton} onPress={onToggleFollow}>
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      <ProductCard
        product={{ name: item.title, price: item.price }}
        onPress={onBuyPress}
        containerStyle={
          isProfile
            ? {
                bottom: Math.max(insets.bottom, 12),
                left: 16,
                right: 16,
              }
            : styles.productCardFeed
        }
      />

      <View
        style={[
          styles.userInfoContainer,
          isProfile && { bottom: Math.max(insets.bottom, 12) + 80, right: 80 },
        ]}
      >
        <Text style={styles.productDescription}>
          {item.description?.trim() ||
            "Discover trusted sellers and shop with people you can follow on Safick."}
        </Text>
      </View>

      <VideoSideIcons
        containerStyle={
          isProfile
            ? {
                top: undefined,
                bottom: Math.max(insets.bottom, 20) + 170,
                transform: [{ translateY: 0 }],
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },

  playPauseTapFeed: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 72,
    bottom: 130,
    zIndex: 1,
  },
  playPauseTapProfile: {
    position: "absolute",
    top: 140,
    left: 0,
    right: 16,
    bottom: 120,
    zIndex: 1,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  playIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 0, 0, 0)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  muteTap: {
    position: "absolute",
    bottom: 25,
    right: 16,
    zIndex: 2,
  },
  muteChip: {
    backgroundColor: "rgb(0, 0, 0)",
    padding: 8,
    borderRadius: 20,
  },
  productCardFeed: {
    bottom: 60,
  },
  userInfoContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 80,
    paddingRight: 16,
  },
  profileHeaderContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  usernameContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  username: {
    fontSize: Platform.OS === "android" ? 16 : 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Inter",
    marginBottom: 2,
    includeFontPadding: false,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter",
    marginLeft: 2,
    includeFontPadding: false,
  },
  followButton: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  followButtonTextActive: {
    color: "#000000",
  },
  productDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  avatarPlaceholder: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  posterPlaceholder: {
    backgroundColor: "#1F2937",
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#000000",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileCircleImage: {
    width: "100%",
    height: "100%",
  },
});
