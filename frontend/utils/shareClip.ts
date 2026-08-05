import { Alert, Linking, Platform, Share } from "react-native";

export type ShareClipInput = {
  /** Pre-translated body (include watch + shop URLs). */
  message: string;
  shareFailedMessage?: string;
};

/**
 * Opens WhatsApp with pre-filled text when available; otherwise the OS share sheet.
 */
export async function shareProductClip(input: ShareClipInput): Promise<void> {
  const { message, shareFailedMessage = "Could not open share options. Try again." } = input;

  if (Platform.OS === "web") {
    await Share.share({ message });
    return;
  }

  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  try {
    const canWhatsApp = await Linking.canOpenURL(whatsappUrl);
    if (canWhatsApp) {
      await Linking.openURL(whatsappUrl);
      return;
    }
  } catch {
    /* fall through to share sheet */
  }

  try {
    await Share.share({ message });
  } catch {
    Alert.alert("Share", shareFailedMessage);
  }
}
