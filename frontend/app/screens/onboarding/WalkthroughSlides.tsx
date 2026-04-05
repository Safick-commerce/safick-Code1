import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ImageSourcePropType, ScrollView } from "react-native";
import { useRef, useState, useCallback } from "react";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const RED = "#FF2800";
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.50);

interface SlideData {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    image: require("../../../assets/images/walkthroughframe1.png"),
    title: "Discover Products",
    subtitle: "Scroll through the latest fashion, beauty,\nelectronics, and more from sellers near you",
  },
  {
    image: require("../../../assets/images/seller3.jpeg"),
    title: "Connect with Sellers",
    subtitle: "Chat directly, negotiate deals,\nand build trust before you buy",

  },
  {
    image: require("../../../assets/images/shopper-looking-clothing-indoors-store.jpg"),
    title: "Shop Your Way",
    subtitle: "Pay with Mobile Money, cash on delivery,\nor however works best for you",
  },
];




interface WalkthroughSlidesProps {
  onComplete: () => void;
}

export default function WalkthroughSlides({ onComplete }: WalkthroughSlidesProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      onComplete();
    }
  }, [activeIndex, onComplete]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
      >
        {SLIDES.map((slide, slideIndex) => (
          <View key={slideIndex} style={styles.slide}>
            <Text style={styles.sectionTitle}>How does it work?</Text>
            <View style={styles.imageContainer}>
              <Image source={slide.image} style={styles.image} resizeMode="cover" />
              <View style={styles.imageOverlay} />
            </View>

            <View style={styles.textArea}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>
            {activeIndex === SLIDES.length - 1 ? "Let's go" : "Next"}
          </Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingTop: 56,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "PlayfairDisplay_800ExtraBold",
    textAlign: "center",
    marginBottom: 58,
    marginTop: 20,
  },
  imageContainer: {
    marginHorizontal: 24,
    height: IMAGE_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  textArea: {
    paddingHorizontal: 32,
    paddingTop: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "PlayfairDisplay_800ExtraBold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 23,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: "center",
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: RED,
    width: 24,
  },
  button: {
    backgroundColor: RED,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#9CA3AF",
    fontFamily: "Inter",
  },
});
