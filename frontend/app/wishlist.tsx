import { Text, View, TouchableOpacity, StyleSheet, ScrollView, Image, ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useWishlist } from "../stores/wishlistStore";
import { useMessage } from "../stores/messageStore";
import { useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

function avatarUrlFromImage(image: ImageSourcePropType): string | null {
  if (typeof image === "object" && image !== null && "uri" in image) {
    const uri = (image as { uri?: string }).uri;
    return typeof uri === "string" && uri.trim() ? uri.trim() : null;
  }
  return null;
}

export default function WishlistScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { wishlistItems, removeFromWishlist, clearWishlist, getWishlistCount } = useWishlist();
  const { addToMessage } = useMessage();

  const handleMessageSeller = useCallback((item: { id: string; sellerName?: string; image: ImageSourcePropType }) => {
    try {
      addToMessage({
        id: `seller-${item.id}`,
        seller: {
          name: item.sellerName ?? t("common_seller"),
          message: t("wishlist_chat_prefill"),
          avatarUrl: avatarUrlFromImage(item.image),
          status: "online",
        },
      });
      router.push("/usermessage");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router, addToMessage, t]);

  const handleProductPress = useCallback((id: string) => {
    try {
      router.push({ pathname: "/productDetails", params: { id } });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("wishlist_title", { count: getWishlistCount() })}</Text>
        <View style={styles.rightAction}>
          {wishlistItems.length > 0 && (
            <TouchableOpacity onPress={clearWishlist}>
              <Text style={styles.clearText}>{t("wishlist_clear")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("wishlist_empty_title")}</Text>
          <Text style={styles.emptySubtitle}>
            {t("wishlist_empty_body")}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.back()}
          >
            <Text style={styles.browseButtonText}>{t("wishlist_browse")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {wishlistItems.map((item) => (
            <View key={item.id} style={styles.wishlistItem}>
              {/* Product Image — tap to view details */}
              <TouchableOpacity onPress={() => handleProductPress(item.id)}>
                <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
              </TouchableOpacity>

              {/* Product Info */}
              <View style={styles.itemInfo}>
                <TouchableOpacity onPress={() => handleProductPress(item.id)}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
                <Text style={styles.itemPrice}>{item.price}</Text>
                {item.originalPrice && (
                  <Text style={styles.itemOriginalPrice}>{item.originalPrice}</Text>
                )}
                {item.sellerName && (
                  <Text style={styles.sellerName}>{t("wishlist_by_seller", { name: item.sellerName })}</Text>
                )}

                {/* Action: Message Seller */}
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleMessageSeller(item)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.messageButtonText}>{t("wishlist_message_seller")}</Text>
                </TouchableOpacity>
              </View>

              {/* Remove (unsave) */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Ionicons name="heart" size={22} color="#FF2800" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter",
  },
  rightAction: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    fontFamily: "Inter",
  },

  /* Empty state */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: "#FF2800",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
  },

  /* Wishlist items */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  wishlistItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter",
  },
  itemOriginalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  sellerName: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FF2800",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  removeButton: {
    padding: 4,
    alignSelf: "flex-start",
  },
});
