import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import React, { useState } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';

type LoginscreensProps = {
  /** Called when user taps "Get Started" or "Continue with Google". */
  onSuccess?: () => void;
  /** Called when user taps "Sign In" (existing account). If not provided, falls back to onSuccess. */
  onSignInPress?: () => void;
  /** Optional image beside the "k" in Safick; defaults to `assets/images/icons.png` (app icon). */
  logoIconSource?: ImageSourcePropType;
};

/** App icon (same as app.json expo.icon / adaptiveIcon) — shown beside the "k" in Safick. */
const APP_ICON = require('../../../assets/images/safick-prlogo02.png');
const RED = '#FF2800';
const COPY = {
  english: 'English',
  french: 'Français',
  tagline: 'DISCOVER, CONNECT, AND SHOP WITH PEOPLE YOU CAN TRUST TODAY.',
  getStarted: 'Get Started',
  hasAccount: 'I already have an account',
  signIn: 'Sign In',
  termsPrefix: 'By clicking continue, you agree to our',
  terms: 'Terms of Service',
  and: 'and',
  privacy: 'Privacy Policy',
} as const;

export default function LoginScreen({ onSuccess, onSignInPress, logoIconSource }: LoginscreensProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeContent} edges={['left', 'top', 'right']}>
        <View style={styles.languageRow}>
          <View style={styles.languagePill}>
            <TouchableOpacity
              style={[styles.languageTab, language === 'en' && styles.languageTabActive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Switch language to English"
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>{COPY.english}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageTab, language === 'fr' && styles.languageTabActive]}
              onPress={() => setLanguage('fr')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Switch language to French"
            >
              <Text style={[styles.languageText, language === 'fr' && styles.languageTextActive]}>{COPY.french}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <Image
              source={logoIconSource ?? APP_ICON}
              style={styles.brandAppIcon}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text style={styles.tagline}>{COPY.tagline}</Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => onSuccess?.()}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={styles.buttonPrimaryText}>{COPY.getStarted}</Text>
            <FontAwesome6 name="arrow-right" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* "I already have an account" → uses onSignInPress if provided, otherwise onSuccess */}
          <TouchableOpacity
            style={styles.signInRow}
            onPress={() => {
              if (onSignInPress) {
                onSignInPress();
                return;
              }
              router.push("/auth/signin" as Href);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go to Sign In"
          >
            <Text style={styles.signInPrompt}>{COPY.hasAccount} </Text>
            <Text style={styles.signInLink}>{COPY.signIn}</Text>
          </TouchableOpacity>

          <View style={styles.termsFooter}>
            <Text style={styles.termsText}>
              {COPY.termsPrefix}{' '}
              <Text style={styles.termsLink}>{COPY.terms}</Text>
              {' '}{COPY.and}{' '}
              <Text style={styles.termsLink}>{COPY.privacy}</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  languageRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  languagePill: {
    flexDirection: 'row',
    backgroundColor: '#F1F2F4',
    borderRadius: 24,
    padding: 4,
  },
  languageTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  languageTabActive: {
    backgroundColor: RED,
  },
  languageText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  languageTextActive: {
    color: '#ffffff',
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandAppIcon: {
    width: 130,
    height: 130,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 0,
    lineHeight: 28,
  },
  bottom: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 16,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInPrompt: {
    color: '#111827',
    fontSize: 15,
  },
  signInLink: {
    color: RED,
    fontSize: 15,
    fontWeight: '700',
  },
  termsFooter: {
    marginTop: 18,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '700',
    color: RED,
  },
});
