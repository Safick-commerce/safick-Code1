import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLanguage } from "../../../context/LanguageContext";
import { createProduct } from "../../../utils/productApi";

const RED = "#FF2800";

export default function CreateProductScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("product_create_alert_photos_title"), t("product_create_alert_photos_body"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }, [t]);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    const price = parseFloat(priceText.replace(/,/g, "."));
    if (trimmedTitle.length < 2) {
      Alert.alert(t("product_create_alert_title_required"), t("product_create_alert_title_body"));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert(t("product_create_alert_price_required"), t("product_create_alert_price_body"));
      return;
    }
    if (!imageUri) {
      Alert.alert(t("product_create_alert_failed"), t("product_create_pick_image"));
      return;
    }

    setSubmitting(true);
    try {
      await createProduct({
        title: trimmedTitle,
        description: description.trim() || null,
        price,
        imageUri,
      });
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("product_create_alert_failed");
      Alert.alert(t("product_create_alert_failed"), msg);
    } finally {
      setSubmitting(false);
    }
  }, [title, priceText, description, imageUri, router, t]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t("product_create_title")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("product_create_name_ph")}
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
          />

          <Text style={styles.label}>{t("product_create_price")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("product_create_price_ph")}
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={setPriceText}
            editable={!submitting}
          />

          <Text style={styles.label}>{t("product_create_description")}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder={t("product_create_desc_ph")}
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!submitting}
          />

          <Text style={styles.label}>{t("product_create_image")}</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                <Text style={styles.previewHint}>{t("product_create_pick_image")}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>{t("product_create_submit")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  preview: {
    width: "100%",
    height: 200,
    backgroundColor: "#F9FAFB",
  },
  previewPlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  previewHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  submit: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
