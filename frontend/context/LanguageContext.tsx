import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { I18nextProvider } from "react-i18next";
import i18n, { initI18n, LANGUAGE_STORAGE_KEY, type Locale } from "../i18n";
import type { TranslationKey } from "../i18n/types";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initI18n()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProviderInner>{children}</LanguageProviderInner>
    </I18nextProvider>
  );
}

function LanguageProviderInner({ children }: { children: ReactNode }) {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();

  const locale: Locale = i18nInstance.language === "fr" ? "fr" : "en";

  const setLocale = useCallback(async (next: Locale) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    await i18nInstance.changeLanguage(next);
  }, [i18nInstance]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      i18nT(key, params as Record<string, string>) as string,
    [i18nT]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isReady: i18nInstance.isInitialized,
    }),
    [locale, setLocale, t, i18nInstance.isInitialized]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
