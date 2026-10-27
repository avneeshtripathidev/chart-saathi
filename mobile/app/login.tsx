import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Train, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import { validateEmail } from '../src/utils/authValidation';

export default function LoginScreen() {
  const { signInWithGoogle, sendEmailOtp, setPendingEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || 'Google sign-in could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error during Google sign-in.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      setErrorMessage(null);
      const validation = validateEmail(email);
      if (!validation.isValid) {
        setErrorMessage(validation.error || 'Please enter a valid email.');
        return;
      }

      setIsEmailLoading(true);
      const { error } = await sendEmailOtp(email);
      if (error) {
        setErrorMessage(error.message || 'Failed to send verification code. Please try again.');
        return;
      }

      setPendingEmail(email.trim().toLowerCase());
      router.push('/verify-email');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send verification code.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoBadge, shadows.md]}>
              <Train size={32} color={colors.brand.primary} />
            </View>
            <Text style={styles.brandTitle}>ChartSaathi</Text>
            <Text style={styles.brandTagline}>Indian Railway Chart Vacancy Explorer</Text>
          </View>

          {/* Card Container */}
          <View style={[styles.authCard, shadows.md]}>
            <Text style={styles.cardHeading}>Sign in or Create Account</Text>
            <Text style={styles.cardSubtitle}>
              Check real-time vacant berths and chart preparation status
            </Text>

            {/* Error banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Google OAuth Option */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <>
                  <View style={styles.googleIconBox}>
                    <Text style={styles.googleLetter}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Or Divider */}
            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email OTP Flow */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isEmailLoading && !isGoogleLoading}
                  returnKeyType="send"
                  onSubmitEditing={handleSendEmailOtp}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, !email.trim() && styles.primaryButtonDisabled]}
              onPress={handleSendEmailOtp}
              disabled={isEmailLoading || isGoogleLoading || !email.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send 6-digit OTP"
            >
              {isEmailLoading ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send 6-Digit Code</Text>
                  <ArrowRight size={18} color={colors.text.onBrand} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Trust Footer */}
          <View style={styles.trustFooter}>
            <ShieldCheck size={16} color={colors.brand.secondary} />
            <Text style={styles.trustText}>
              Official chart notices • Secure passwordless authentication
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 4,
  },
  authCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeading: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(228, 95, 96, 0.12)',
    borderColor: 'rgba(228, 95, 96, 0.3)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 50,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  googleLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  trustText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});
