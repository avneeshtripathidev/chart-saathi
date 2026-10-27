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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound, ArrowRight, RotateCcw, ArrowLeft, AlertCircle, CheckCircle2, Mail } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import { validateOtp } from '../src/utils/authValidation';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    isSignup?: string;
    unconfirmed?: string;
  }>();

  const {
    pendingEmail,
    setPendingEmail,
    verifyEmailOtp,
    resendEmailOtp,
    sendEmailOtp,
    isProfileComplete,
  } = useAuth();

  const activeEmail = (params.email || pendingEmail || '').trim().toLowerCase();
  const isSignupFlow = params.isSignup !== 'false';
  const isUnconfirmedSignIn = params.unconfirmed === 'true';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  // Sync route params email into AuthContext pendingEmail if missing
  useEffect(() => {
    if (params.email && params.email !== pendingEmail) {
      setPendingEmail(params.email);
    }
  }, [params.email, pendingEmail, setPendingEmail]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Automatically focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVerifyOtp = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!activeEmail) {
        setErrorMessage('Email address missing. Please go back to login and re-enter your email.');
        return;
      }

      const validation = validateOtp(otp);
      if (!validation.isValid) {
        setErrorMessage(validation.error || 'Please enter the complete 6-digit verification code.');
        return;
      }

      setIsVerifying(true);

      // Verify OTP with Supabase:
      // When from signup: supabase.auth.verifyOtp({ email, token, type: 'signup' })
      // When from passwordless: supabase.auth.verifyOtp({ email, token, type: 'email' })
      const otpType = isSignupFlow ? 'signup' : 'email';
      const { error } = await verifyEmailOtp(activeEmail, otp, otpType);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('expired')) {
          setErrorMessage('Verification code has expired. Please tap Resend Code below.');
        } else if (
          msg.includes('invalid') ||
          msg.includes('token') ||
          msg.includes('incorrect') ||
          msg.includes('not recognized')
        ) {
          setErrorMessage('Invalid 6-digit verification code. Please check and try again.');
        } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
          setErrorMessage('Too many verification attempts. Please wait a moment before trying again.');
        } else if (
          msg.includes('network') ||
          msg.includes('fetch') ||
          msg.includes('failed to fetch') ||
          msg.includes('connection')
        ) {
          setErrorMessage('Network connection error. Please verify your internet connection and try again.');
        } else {
          setErrorMessage(error.message || 'Verification could not be completed. Please try again.');
        }
        return;
      }

      // Success
      setSuccessMessage('Email verified successfully! Setting up your session...');

      // Redirect after brief visual confirmation
      setTimeout(() => {
        if (isProfileComplete) {
          router.replace('/');
        } else {
          router.replace('/complete-profile');
        }
      }, 400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification could not be completed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending || !activeEmail) return;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsResending(true);

      // Resend signup confirmation or passwordless OTP
      let res: { error: Error | null };
      if (isSignupFlow) {
        res = await resendEmailOtp(activeEmail, 'signup');
      } else {
        res = await sendEmailOtp(activeEmail);
      }

      if (res.error) {
        const msg = (res.error.message || '').toLowerCase();
        if (msg.includes('rate') || msg.includes('limit') || msg.includes('60 seconds')) {
          setErrorMessage('For security, you can only request a new code once every 60 seconds.');
        } else if (msg.includes('network') || msg.includes('fetch')) {
          setErrorMessage('Network error while resending code. Please check your connection.');
        } else {
          setErrorMessage(res.error.message || 'Failed to resend code. Please try again later.');
        }
        return;
      }

      setSuccessMessage('A fresh 6-digit verification code has been dispatched to your email.');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      inputRef.current?.focus();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
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
          {/* Back to Login / Change email button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
          >
            <ArrowLeft size={18} color={colors.text.secondary} />
            <Text style={styles.backText}>Change email / Sign in</Text>
          </TouchableOpacity>

          {/* Verification Card */}
          <View style={[styles.authCard, shadows.md]}>
            <View style={styles.iconBox}>
              <KeyRound size={28} color={colors.brand.primary} />
            </View>

            <Text style={styles.cardHeading}>Verify Your Email</Text>
            <Text style={styles.cardSubtitle}>
              {isUnconfirmedSignIn
                ? 'Your account email requires verification before signing in.'
                : 'Enter the 6-digit verification code sent to:'}
            </Text>

            <View style={styles.emailPill}>
              <Mail size={14} color={colors.brand.secondary} />
              <Text style={styles.emailText} numberOfLines={1}>
                {activeEmail || 'your email address'}
              </Text>
            </View>

            {/* Error message box */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Success message box */}
            {successMessage && (
              <View style={styles.successBox}>
                <CheckCircle2 size={18} color={colors.status.vacant} style={{ marginTop: 2 }} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* 6-Digit OTP Interactive Display */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>

              <View style={styles.otpWrapper}>
                {/* Visual Segmented 6 Boxes */}
                <View style={styles.boxesRow}>
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index] || '';
                    const isCurrent =
                      isInputFocused &&
                      (index === otp.length || (index === 5 && otp.length === 6));
                    return (
                      <View
                        key={index}
                        style={[
                          styles.digitBox,
                          digit ? styles.digitBoxFilled : null,
                          isCurrent ? styles.digitBoxActive : null,
                        ]}
                      >
                        <Text style={styles.digitText}>{digit || ''}</Text>
                        {!digit && isCurrent && <View style={styles.caretLine} />}
                      </View>
                    );
                  })}
                </View>

                {/* Actual Hidden/Overlay TextInput capturing numbers */}
                <TextInput
                  ref={inputRef}
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '').slice(0, 6);
                    setOtp(cleaned);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  autoFocus
                  editable={!isVerifying}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />
              </View>
            </View>

            {/* Verify Email CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (otp.length !== 6 || isVerifying) && styles.primaryButtonDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={isVerifying || otp.length !== 6}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Verify Email"
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify Email</Text>
                  <ArrowRight size={18} color={colors.text.onBrand} />
                </>
              )}
            </TouchableOpacity>

            {/* Resend Code & Cooldown Timer */}
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

            <Text style={styles.emailHint}>
              Didn't receive the code? Check your spam/promotions folder or click Resend Code.
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    maxWidth: '90%',
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  successText: {
    flex: 1,
    color: colors.status.vacant,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputGroup: {
    width: '100%',
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpWrapper: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    width: '100%',
    maxWidth: 360,
  },
  digitBox: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  digitBoxFilled: {
    borderColor: colors.border.roseStone,
    backgroundColor: '#34303A',
  },
  digitBoxActive: {
    borderColor: colors.brand.primary,
    backgroundColor: '#382A2E',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  caretLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.brand.primary,
    position: 'absolute',
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    fontSize: 1,
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
    minHeight: 32,
    justifyContent: 'center',
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
  emailHint: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xs - 1,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
});
