import { BlurView } from "expo-blur";
import { Platform, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLanguage } from "../../context/LanguageContext";

export interface ProductCardData {
  name: string;
  price: string;
  originalPrice?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  onPress: () => void;
  containerStyle?: object;
}

export default function ProductCard({ product, onPress, containerStyle }: ProductCardProps) {
  const isIos = Platform.OS === "ios";
  const { t } = useLanguage();

  return (
    <View
      style={[styles.container, !isIos && styles.containerAndroid, containerStyle]}
      collapsable={false}
    >
      {isIos ? (
        <>
          <BlurView intensity={50} tint="dark" style={styles.blur} />
          <View style={styles.blurTint} pointerEvents="none" />
        </>
      ) : null}
      <View style={styles.productInfoRow}>
        <View style={styles.productTextContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}> {product.originalPrice}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={onPress}>
          <Text style={styles.buyButtonText}>{t("common_buy")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 200,
    overflow: 'hidden',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
    minHeight: 70,
    minWidth: 280,
  },
  containerAndroid: {
    backgroundColor: "rgb(18, 18, 18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  blurTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0,
    zIndex: 1,
  },
  productTextContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF2800',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  originalPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#CCCCCC',
    fontFamily: 'Inter',
    textDecorationLine: 'line-through',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buyButton: {
    backgroundColor: '#FF2800',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
