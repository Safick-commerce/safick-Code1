import { View, Text, Image, StyleSheet, ImageSourcePropType, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LivePost } from "../../types";
import { memo, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface LivePostCardProps {
  post: LivePost;
  cardWidth: number;
}

function LivePostCard({ post, cardWidth }: LivePostCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const onJoin = useCallback(() => {
    try {
      router.push({ pathname: "/watch-live", params: { liveId: post.id } });
    } catch (e) {
      console.error("[LivePostCard] join live", e);
    }
  }, [router, post.id]);

  const imageSource: ImageSourcePropType = typeof post.imageUrl === 'string'
    ? { uri: post.imageUrl }
    : post.imageUrl;

  const avatarSource: ImageSourcePropType = post.sellerAvatar
    ? (typeof post.sellerAvatar === 'string' ? { uri: post.sellerAvatar } : post.sellerAvatar)
    : imageSource;

  const cardHeight = cardWidth * 1.35;
  const viewerCount = post.viewerCount ?? 0;
  const viewerText = viewerCount >= 1000
    ? `${(viewerCount / 1000).toFixed(1)}k`
    : `${viewerCount}`;

  return (
  <View style={[styles.wrapper, { width: cardWidth }]}>
    <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={t("live_card_a11y_post", { seller: post.sellerName })}
      />

      {/* Seller info overlay */}
      <View style={styles.sellerOverlay}>
        <View style={styles.avatarRing}>
          <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
        </View>
        <View>
          <Text style={styles.sellerName}>{post.sellerName}</Text>
          <View style={styles.viewerRow}>
            <View style={styles.liveDot} />
            <Text style={styles.viewerText}>{viewerText}</Text>
          </View>
        </View>
      </View>

      {/* Join button */}
      <TouchableOpacity
        style={styles.joinButton}
        activeOpacity={0.8}
        onPress={onJoin}
        accessibilityRole="button"
        accessibilityLabel={t("live_card_a11y_join", { seller: post.sellerName })}
      >
        <Text style={styles.joinText}>{t("live_card_join")}</Text>
      </TouchableOpacity>
    </View>

    {/* Description below card */}
    <Text style={[styles.description, { width: cardWidth }]} numberOfLines={2}>
      {post.description}
    </Text>
  </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 3,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  sellerOverlay: {
    position: "absolute",
    top: 12,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarRing: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2800",
  },
  viewerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  joinButton: {
    position: "absolute",
    bottom: 12,
    right: 10,
    backgroundColor: "#FF2800",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "400",
    color: "#374151",
    lineHeight: 18,
    paddingHorizontal: 2,
  },
});

export default memo(LivePostCard);
