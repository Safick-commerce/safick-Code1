import { Image } from "expo-image";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { StoreProduct } from "../../types/storeProduct";

type Props = {
  product: StoreProduct;
  onPress?: () => void;
};

function formatPrice(price: number) {
  if (!Number.isFinite(price)) return "—";
  return `$${price.toFixed(2)}`;
}

export default function FeedProductCard({ product, onPress }: Props) {
  const title = product?.title?.trim() || "Untitled";
  const uri = product?.image_url?.trim();

  const inner = (
    <>
      <View style={styles.imageWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.price}>{formatPrice(product?.price ?? 0)}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.wrap} onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.wrap}>{inner}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    maxWidth: "100%",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF2800",
  },
});
