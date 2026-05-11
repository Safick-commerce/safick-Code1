import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import React, { useState } from 'react';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type LoginscreensProps = {
  /** Called when user taps "Get Started" or "Continue with Google". */
  onSuccess?: () => void;
  /** Called when user taps "Sign In" (existing account). If not provided, falls back to onSuccess. */
  onSignInPress?: () => void;
  /** Optional image beside the "k" in Safick; defaults to `assets/images/icons.png` (app icon). */
  logoIconSource?: ImageSourcePropType;
};

// Video at project root: safick/assets/images/loginscreen.mp4 (3 levels up from app/screens/loginscreens)
const IMAGE_SOURCE = require('../../../assets/images/LoginSC.jpg');
/** App icon (same as app.json expo.icon / adaptiveIcon) — shown beside the "k" in Safick. */
const APP_ICON = require('../../../assets/images/icons.png');
const VIDEO_SOURCE = require('../../../assets/images/loginscreen.mp4');
// Brand red used for buttons, active language tab, "CART" text, and "Sign In" link
const RED = '#FF2800';

export default function Loginscreens({ onSuccess, onSignInPress, logoIconSource }: LoginscreensProps) {
  const router = useRouter();
  // If the background video fails to load, we hide it and rely on the dark container background
  const [videoError, setVideoError] = useState(false);
  // Selected language for the pill selector; currently UI-only (English / Français)
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7795/ingest/37eacd44-5dc4-4313-8413-ac6c68b6e4f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a40776'},body:JSON.stringify({sessionId:'a40776',location:'Loginscreens.tsx:mount',message:'Loginscreens mounted',data:{videoError},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    // Outer full-screen container; dark background used when video is hidden or as fallback
    <View style={styles.container}>
      {!videoError ? (
        <Image
          source={IMAGE_SOURCE}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            // #region agent log
            fetch('http://127.0.0.1:7795/ingest/37eacd44-5dc4-4313-8413-ac6c68b6e4f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a40776'},body:JSON.stringify({sessionId:'a40776',location:'Loginscreens.tsx:Video onError',message:'Video onError fired',data:{},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            setVideoError(true);
          }}
        />
      ) : null}
      {/* Semi-transparent dark overlay so white/red text and buttons stay readable over the video */}
      <View style={styles.overlay} />
      {/* Main content area: respects safe area (status bar, notch). Space-between puts language at top, hero in middle, buttons at bottom. */}
      <SafeAreaView style={styles.safeContent} edges={['top', 'left', 'right']}>
        {/* ---------- Language selector (top) ---------- */}
        <View style={styles.languageRow}>
          <View style={styles.languagePill}>
            <TouchableOpacity
              style={[styles.languageTab, language === 'en' && styles.languageTabActive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageTab, language === 'fr' && styles.languageTabActive]}
              onPress={() => setLanguage('fr')}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageText, language === 'fr' && styles.languageTextActive]}>Français</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------- Logo + tagline (center) ---------- */}
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <Text style={styles.brandName}>Safic</Text>
            <View style={styles.brandKWithIcon}>
              <Text style={styles.brandName}>k</Text>
              <Image
                source={logoIconSource ?? APP_ICON}
                style={styles.brandAppIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.tagline}> DISCOVER, CONNECT, AND SHOP WITH PEOPLE YOU CAN TRUST TODAY. </Text>
        </View>

        {/* ---------- Bottom: primary actions + sign-in link + community ---------- */}
        <View style={styles.bottom}>
          {/* Main CTA: marks user as logged in and typically navigates to the main app */}
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => onSuccess?.()}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonPrimaryText}>Get Started</Text>
            <FontAwesome6
              name="arrow-right"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* "I already have an account" → uses onSignInPress if provided, otherwise onSuccess */}
          <TouchableOpacity
            style={styles.signInRow}
            onPress={() => {
              if (onSignInPress) {
                onSignInPress();
                return;
              }
              router.push("/screens/loginscreens/signinscreen");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.signInPrompt}>I already have an account </Text>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>

          {/* Terms footer */}
          <View style={styles.termsFooter}>
            <Text style={styles.termsText}>
              By clicking continue, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}


// STYLES
const styles = StyleSheet.create({
  // Full-screen wrapper; dark background when video is hidden or as base
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  // Video fills the screen and is positioned behind everything
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Overlay on top of video so text and buttons stay readable (35% black)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  // Main content: horizontal padding, space-between for top / center / bottom sections
  safeContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Wrapper for the language pill so it stays centered at the top
  languageRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  // Pill container for English | Français (row, rounded, semi-transparent dark)
  languagePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    padding: 4,
  },
  // Each language tab (inactive: transparent; active gets languageTabActive)
  languageTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  // Active tab: brand red background
  languageTabActive: {
    backgroundColor: RED,
  },
  languageText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  languageTextActive: {
    color: '#ffffff',
  },
  // Center block: logo + tagline; flex: 1 so it takes the middle space
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  // Brand name above tagline
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandKWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAppIcon: {
    width: 40,
    height: 40,
    marginLeft: -20,
    transform: [{ rotate: '40deg' }],
  },
  brandName: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 2,
  },
  // "CLIP" text: large, bold, white
  logoClip: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  // Wrapper for logo image + "CART" (row, slight negative margin for overlap)
  logoCartWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -1,
  },
  // Size and position of the custom logo image next to "CART"
  logoCartIcon: {
    width: 100,
    height: 100,
    marginRight: -24,
    marginLeft: -30,
    // Rotate the icon (e.g. -15 = tilt left, 15 = tilt right, 90 = upright). Change this to adjust.
    transform: [{ rotate: '-12deg' }],
  },
  // "CART" text: same size as CLIP, brand red
  logoCart: {
    fontSize: 32,
    fontWeight: '800',
    color: RED,
    letterSpacing: 1,
  },
  // Small "safick" label under the main logo (currently not rendered in JSX but kept for consistency)
  logoSmall: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  // Tagline under the logo: "DISCOVER . CONNECT . SHOP"
  tagline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3, // space between letters
    textAlign: 'center',
    marginTop: 0,
    fontFamily: 'PlayfairDisplay_800ExtraBold',
  },
  // Bottom section: buttons and links; gap between items, padding from bottom
  bottom: {
    paddingBottom: 32,
    gap: 16,
  },
  // Red "Get Started" button: pill shape, shadow
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
  buttonPrimaryArrow: {},
  buttonPrimaryArrowPressed: {
    marginTop: -4,
    transform: [{ translateY: -2 }],
  },
  // Row for "I already have an account" + "Sign In" link
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInPrompt: {
    color: 'rgba(255,255,255,0.9)',
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
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
