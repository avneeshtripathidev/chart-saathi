import React, { useState, useEffect, useRef } from 'react';
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
import { KeyRound, ArrowRight, RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import { validateOtp } from '../src/utils/authValidation';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { pendingEmail, verifyEmailOtp, sendEmailOtp, isProfileComplete } = useAuth();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus input automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVerifyOtp = async () => {
    try {
      setErrorMessage(null);
      if (!pendingEmail) {
        setErrorMessage('Email address missing. Please go back and enter your email again.');
        return;
      }

      const validation = validateOtp(otp);
      if (!validation.isValid) {
        setErrorMessage(validation.error || 'Please enter the 6-digit code.');
        return;
      }

      setIsVerifying(true);
      const { error } = await verifyEmailOtp(pendingEmail, otp);

      if (error) {
        // Distinguish expired / invalid error messages cleanly
        const msg = error.message.toLowerCase();
        if (msg.includes('expired')) {
          setErrorMessage('Verification code has expired. Please request a new code.');
        } else if (msg.includes('invalid') || msg.includes('token')) {
          setErrorMessage('Invalid verification code. Please check and try again.');
        } else {
          setErrorMessage(error.message || 'Verification failed. Please try again.');
        }
        return;
      }

      // Successful verification -> navigation handled by root layout or direct push
      if (isProfileComplete) {
        router.replace('/');
      } else {
        router.replace('/complete-profile');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification could not be completed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending || !pendingEmail) return;
    try {
      setErrorMessage(null);
      setIsResending(true);
      const { error } = await sendEmailOtp(pendingEmail);
      if (error) {
        setErrorMessage(error.message || 'Could not resend code. Please try again later.');
        return;
      }
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    router.replace('/login');
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleChangeEmail}
            accessibilityRole="button"
            accessibilityLabel="Change email address"
          >
            <ArrowLeft size={18} color={colors.text.secondary} />
            <Text style={styles.backText}>Change email</Text>
          </TouchableOpacity>

          {/* Verification Card */}
          <View style={[styles.authCard, shadows.md]}>
            <View style={styles.iconBox}>
              <KeyRound size={28} color={colors.brand.primary} />
            </View>

            <Text style={styles.cardHeading}>Verify Your Email</Text>
            <Text style={styles.cardSubtitle}>
              We sent a 6-digit verification code to
            </Text>
            <View style={styles.emailPill}>
              <Text style={styles.emailText}>{pendingEmail || 'your email address'}</Text>
            </View>

            {/* Error box */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* OTP Input Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
              <TextInput
                ref={inputRef}
                style={styles.otpInput}
                value={otp}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').slice(0, 6);
                  setOtp(cleaned);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="• • • • • •"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!isVerifying}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
              />
            </View>

            {/* Verify CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, otp.length !== 6 && styles.primaryButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isVerifying || otp.length !== 6}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Verify code and continue"
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                  <ArrowRight size={18} color={colors.text.onBrand} />
                </>
              )}
            </TouchableOpacity>

            {/* Resend & Timer */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend code in <Text style={styles.countdownHighlight}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={isResending}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.brand.primary} />
                  ) : (
                    <>
                      <RotateCcw size={16} color={colors.brand.primary} />
                      <Text style={styles.resendText}>Resend Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeading: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emailPill: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emailText: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.secondary,
    fontWeight: '600',
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
    width: '100%',
  },
  errorText: {
    flex: 1,
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputGroup: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpInput: {
    height: 56,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
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
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  countdownHighlight: {
    color: colors.brand.secondary,
    fontWeight: '700',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resendText: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.primary,
    fontWeight: '700',
  },
});
