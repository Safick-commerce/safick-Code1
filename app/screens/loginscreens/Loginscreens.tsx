import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import React, { useState } from 'react';
import { FontAwesome6, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginscreensProps = {
  /** Called when user taps "Get Started" or "Continue with Google" — usually marks them as logged in and navigates to the app. */
  onSuccess?: () => void;
  /** Called when user taps "Sign In" (existing account). If not provided, falls back to onSuccess. */
  onSignInPress?: () => void;
  /** Optional custom logo image (e.g. require('../assets/images/icons.png')). When provided, shown next to "CART" instead of the default cart icon. */
  logoIconSource?: ImageSourcePropType;
};

// Video at project root: clipCart/assets/images/loginscreen.mp4 (3 levels up from app/screens/loginscreens)
const VIDEO_SOURCE = require('../../../assets/images/loginscreen.mp4');
// Brand red used for buttons, active language tab, "CART" text, and "Sign In" link
const RED = '#FF2800';

export default function Loginscreens({ onSuccess, onSignInPress, logoIconSource }: LoginscreensProps) {
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
        <Video
          source={VIDEO_SOURCE}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
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
            <Text style={styles.logoClip}>CLIP</Text>
            <View style={styles.logoCartWrap}>
              {/* Custom logo image when provided by parent (e.g. from index.tsx); otherwise nothing (or you could show a fallback cart icon) */}
              {logoIconSource && (
                <Image
                  source={logoIconSource}
                  style={styles.logoCartIcon}
                  resizeMode="contain"
                />
              ) 
              }
              <Text style={styles.logoCart}>CART</Text>
            </View>
          </View>
          <Text style={styles.tagline}> DISCOVER . CONNECT . SHOP </Text>
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

          {/* Visual separator between "Get Started" and "Continue with Google" */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google sign-in button; same outcome as Get Started for now (onSuccess) */}
          <TouchableOpacity style={styles.buttonGoogle} onPress={() => onSuccess?.()} activeOpacity={0.9}>
            <Image source={require('../../../assets/images/Google.png')} 
            style={styles.googleIcon} resizeMode="contain" />
            <Text style={styles.buttonGoogleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* "I already have an account" → uses onSignInPress if provided, otherwise onSuccess */}
          <TouchableOpacity style={styles.signInRow} onPress={() => (onSignInPress ?? onSuccess)?.()} activeOpacity={0.8}>
            <Text style={styles.signInPrompt}>I already have an account </Text>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>

          {/* Community callout: overlapping profile icons + text */}
          <View style={styles.communityRow}>
            <View style={styles.communityAvatars}>
              <Ionicons name="person-circle" size={28} color="rgba(255,255,255,0.7)" style={styles.avatarIcon} />
              <Ionicons name="person-circle" size={28} color="rgba(255,255,255,0.7)" style={styles.avatarIcon} />
              <Ionicons name="person-circle" size={28} color="rgba(255,255,255,0.7)" style={styles.avatarIcon} />
            </View>
            <Text style={styles.communityText}>JOIN 50K+ CAMEROONIANS</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  // Full-screen wrapper; dark background when video is hidden or as base
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  // Video fills the screen and is positioned behind everything
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Overlay on top of video so text and buttons stay readable (35% black)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  // "CLIP" + icon + "CART" in a single row
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  // Small "clipCart" label under the main logo (currently not rendered in JSX but kept for consistency)
  logoSmall: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  // Tagline under the logo: "DISCOVER . CONNECT . SHOP"
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: -20,
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
  // Row for "——— OR ———" (two lines + text)
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Thin line on each side of "OR"
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  orText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  // White "Continue with Google" button: same shape as primary, white bg
  buttonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonGoogleText: {
    color: '#1f1f1f',
    fontSize: 17,
    fontWeight: '600',
  },
  googleIcon: {
    width: 22,
    height: 22,
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
  // Row for community avatars + "JOIN 50K+ CAMEROONIANS"
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  communityAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Overlapping circles: negative margin so they stack
  avatarIcon: {
    marginRight: -10,
  },
  communityText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
