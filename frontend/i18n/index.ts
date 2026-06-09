import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import fr from "./fr.json";

export const LANGUAGE_STORAGE_KEY = "@safick/locale";

export type Locale = "en" | "fr";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

let initPromise: Promise<typeof i18n> | null = null;

export function initI18n(): Promise<typeof i18n> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const lng: Locale = stored === "fr" ? "fr" : "en";

    await i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      compatibilityJSON: "v4",
      returnNull: false,
    });

    return i18n;
  })();

  return initPromise;
}

export { default } from "i18next";
