import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FontAwesome6, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../../../context/AuthContext'

const RED = '#FF2800'

export default function Signinscreen() {
  const router = useRouter()
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>()
  const { signIn } = useAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleSignInSuccess = async () => {
    await signIn()
    if (redirectTo) {
      router.replace(redirectTo as any)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeContent} edges={['top', 'left', 'right']}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#000000" />
        </TouchableOpacity>

        {/* Title Container */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter email"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.formInputPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                  style={styles.passwordIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  activeOpacity={0.7}
                >
                  <FontAwesome6
                    name={passwordVisible ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Log In Button */}
          <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleSignInSuccess}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          {/* OR separator */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Social Login */}
          <TouchableOpacity style={styles.socialButton} 
          activeOpacity={0.8}
          onPress={() => console.log('Google')}>
            <Image source={require('../../../assets/images/Google.png')} 
            style={styles.googleIcon} 
            resizeMode="contain" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} 
          activeOpacity={0.8}
          onPress={() => console.log('Apple')}>
            <MaterialCommunityIcons name="apple" size={22} color="#000000" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
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

          {/* Sign up prompt */}
          <TouchableOpacity
            style={styles.signUpRow}
            onPress={() =>
              router.replace({
                pathname: "/screens/onboarding/OnboardingScreen" as any,
                params: { skipWalkthrough: "1" },
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.signUpPrompt}>Don't have an account? </Text>
            <Text style={styles.signUpLink}>Sign up now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginTop: 20,
    marginLeft: -10,
  },
  safeContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    alignSelf: 'stretch',
  },
  titleContainer: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    fontFamily: 'PlayfairDisplay_800ExtraBold',
  },
  subtitle: {
    fontSize: 30,
    fontWeight: '800',
    alignSelf: 'flex-start',
    color: '#0f172a',
    fontFamily: 'PlayfairDisplay_800ExtraBold',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  formSection: {
    width: '100%',
    marginTop: 24,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  formInput: {
    width: '100%',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 17,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  formInputPassword: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    paddingVertical: 16,
    paddingHorizontal: 5,
    borderWidth: 0,
  },
  passwordIcon: {
    padding: 8,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotPassword: {
    padding: 8,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#64748b',
  },
  button: {
    width: '100%',
    marginTop: 28,
    backgroundColor: RED,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#ffffff',
    textAlign: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  orText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#94a3b8',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#0f172a',
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  termsFooter: {
    marginTop: 28,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '700',
    color: '#0f172a',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  signUpPrompt: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#64748b',
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: RED,
  },
});