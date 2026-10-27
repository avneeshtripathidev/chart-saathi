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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Train,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  type PasswordStrength,
} from '../src/utils/authValidation';

export default function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    sendEmailOtp,
    resetPasswordForEmail,
    setPendingEmail,
  } = useAuth();

  // Mode: 'SIGN_IN' | 'REGISTER' | 'OTP'
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER' | 'OTP'>('SIGN_IN');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Password strength calculation
  const passwordValidation = validatePassword(password);
  const passwordStrength: PasswordStrength = passwordValidation.strength;

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

  const handlePasswordSignIn = async () => {
    setErrorMessage(null);
    setFieldErrors({});

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setFieldErrors((prev) => ({ ...prev, email: emailVal.error }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const { error, session } = await signInWithPassword(email, password);
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          setPendingEmail(email.trim().toLowerCase());
          router.push({
            pathname: '/verify-email',
            params: {
              email: email.trim().toLowerCase(),
              isSignup: 'true',
              unconfirmed: 'true',
            },
          });
          return;
        }
        setErrorMessage(error.message || 'Invalid email or password.');
        return;
      }
      if (session) {
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setFieldErrors({});

    const nameVal = validateFullName(fullName);
    const emailVal = validateEmail(email);
    const passVal = validatePassword(password);

    const errors: typeof fieldErrors = {};
    if (!nameVal.isValid) errors.fullName = nameVal.error;
    if (!emailVal.isValid) errors.email = emailVal.error;
    if (!passVal.isValid) errors.password = passVal.error;
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const { error, user } = await signUpWithPassword(email, password, fullName);
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('error sending confirmation email')) {
          setErrorMessage(
            'Supabase built-in email limit reached (max 3/hr). In your Supabase Dashboard (Authentication > Providers > Email), set up Custom SMTP (e.g. Gmail / Resend) or toggle "Confirm email" OFF for development.'
          );
        } else {
          setErrorMessage(error.message || 'Registration failed. Please check details.');
        }
        return;
      }

      // Check if user already exists (identities array is empty in Supabase user enumeration prevention)
      if (user && user.identities && user.identities.length === 0) {
        setErrorMessage('An account with this email already exists. Please sign in instead.');
        return;
      }

      // Check if email confirmation is required
      if (user && !user.confirmed_at && !user.email_confirmed_at) {
        setPendingEmail(email.trim().toLowerCase());
        router.push({
          pathname: '/verify-email',
          params: {
            email: email.trim().toLowerCase(),
            isSignup: 'true',
          },
        });
      } else {
        router.replace('/complete-profile');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setErrorMessage(null);
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setErrorMessage(emailVal.error || 'Please enter a valid email.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await sendEmailOtp(email);
      if (error) {
        setErrorMessage(error.message || 'Failed to send verification code.');
        return;
      }
      setPendingEmail(email.trim().toLowerCase());
      router.push({
        pathname: '/verify-email',
        params: {
          email: email.trim().toLowerCase(),
          isSignup: 'false',
        },
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const val = validateEmail(forgotEmail);
    if (!val.isValid) {
      setErrorMessage(val.error || 'Please enter your registered email.');
      return;
    }

    try {
      setIsForgotSubmitting(true);
      const { error } = await resetPasswordForEmail(forgotEmail);
      if (error) {
        setErrorMessage(error.message || 'Failed to send recovery link.');
        return;
      }
      setForgotSent(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not process password reset request.');
    } finally {
      setIsForgotSubmitting(false);
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
            {/* Mode Selector Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, authMode === 'SIGN_IN' && styles.tabButtonActive]}
                onPress={() => {
                  setAuthMode('SIGN_IN');
                  setErrorMessage(null);
                  setFieldErrors({});
                }}
              >
                <Text style={[styles.tabText, authMode === 'SIGN_IN' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, authMode === 'REGISTER' && styles.tabButtonActive]}
                onPress={() => {
                  setAuthMode('REGISTER');
                  setErrorMessage(null);
                  setFieldErrors({});
                }}
              >
                <Text style={[styles.tabText, authMode === 'REGISTER' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Success banner */}
            {successMessage && (
              <View style={styles.successBox}>
                <CheckCircle2 size={18} color={colors.status.vacant} style={{ marginTop: 2 }} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <>
                  <View style={styles.googleIconBox}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form Fields: REGISTER mode */}
            {authMode === 'REGISTER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(fieldErrors.fullName) && styles.inputWrapError,
                  ]}
                >
                  <User size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Avneesh Kumar"
                    placeholderTextColor={colors.text.tertiary}
                    value={fullName}
                    onChangeText={(t) => {
                      setFullName(t);
                      if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>
                {fieldErrors.fullName && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>
                )}
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputWrap,
                  Boolean(fieldErrors.email) && styles.inputWrapError,
                ]}
              >
                <Mail size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
              {fieldErrors.email && (
                <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Password Input (Sign in / Register) */}
            {authMode !== 'OTP' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  {authMode === 'SIGN_IN' && (
                    <TouchableOpacity
                      onPress={() => {
                        setForgotEmail(email);
                        setForgotSent(false);
                        setIsForgotModalVisible(true);
                      }}
                    >
                      <Text style={styles.forgotLink}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(fieldErrors.password) && styles.inputWrapError,
                  ]}
                >
                  <Lock size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text.tertiary}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.text.tertiary} />
                    ) : (
                      <Eye size={18} color={colors.text.tertiary} />
                    )}
                  </TouchableOpacity>
                </View>
                {fieldErrors.password && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
                )}

                {/* Password Strength Indicator in REGISTER mode */}
                {authMode === 'REGISTER' && password.length > 0 && (
                  <View style={styles.strengthBox}>
                    <View style={styles.strengthBars}>
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              passwordStrength === 'STRONG'
                                ? colors.status.vacant
                                : passwordStrength === 'MEDIUM'
                                ? colors.status.partial
                                : colors.brand.primary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              passwordStrength === 'STRONG'
                                ? colors.status.vacant
                                : passwordStrength === 'MEDIUM'
                                ? colors.status.partial
                                : colors.border.default,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              passwordStrength === 'STRONG'
                                ? colors.status.vacant
                                : colors.border.default,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.strengthText}>Strength: {passwordStrength}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Confirm Password in REGISTER mode */}
            {authMode === 'REGISTER' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(fieldErrors.confirmPassword) && styles.inputWrapError,
                  ]}
                >
                  <Lock size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={colors.text.tertiary} />
                    ) : (
                      <Eye size={18} color={colors.text.tertiary} />
                    )}
                  </TouchableOpacity>
                </View>
                {fieldErrors.confirmPassword && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
                )}
              </View>
            )}

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => {
                if (authMode === 'SIGN_IN') handlePasswordSignIn();
                else if (authMode === 'REGISTER') handleRegister();
                else handleSendEmailOtp();
              }}
              disabled={isSubmitting || isGoogleLoading}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={styles.primaryButtonText}>
                    {authMode === 'SIGN_IN'
                      ? 'Sign In'
                      : authMode === 'REGISTER'
                      ? 'Create Account'
                      : 'Send Verification Code'}
                  </Text>
                  <ArrowRight size={18} color={colors.text.onBrand} />
                </View>
              )}
            </TouchableOpacity>

            {/* Alternative OTP toggle */}
            <TouchableOpacity
              style={styles.otpToggle}
              onPress={() => {
                setAuthMode(authMode === 'OTP' ? 'SIGN_IN' : 'OTP');
                setErrorMessage(null);
              }}
            >
              <Text style={styles.otpToggleText}>
                {authMode === 'OTP'
                  ? 'Sign in with Password instead'
                  : 'Or sign in with 6-digit Email Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy & Security Footer */}
          <View style={styles.footerNote}>
            <ShieldCheck size={16} color={colors.status.vacant} />
            <Text style={styles.footerText}>
              End-to-end encrypted • Supabase Auth protected
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={isForgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <KeyRound size={20} color={colors.brand.primary} />
                <Text style={styles.modalTitle}>Password Recovery</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsForgotModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {forgotSent ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <CheckCircle2 size={42} color={colors.status.vacant} style={{ marginBottom: spacing.md }} />
                <Text style={styles.modalSuccessHeading}>Recovery Link Dispatched</Text>
                <Text style={styles.modalSuccessText}>
                  If an account exists for {forgotEmail}, you will receive a secure password reset link shortly.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { width: '100%', marginTop: spacing.lg }]}
                  onPress={() => setIsForgotModalVisible(false)}
                >
                  <Text style={styles.primaryButtonText}>Return to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalDesc}>
                  Enter your registered email address and we will send you a secure link to reset your password.
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Registered Email</Text>
                  <View style={styles.inputWrap}>
                    <Mail size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="your.email@example.com"
                      placeholderTextColor={colors.text.tertiary}
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isForgotSubmitting && styles.buttonDisabled]}
                  onPress={handleForgotPassword}
                  disabled={isForgotSubmitting}
                >
                  {isForgotSubmitting ? (
                    <ActivityIndicator color={colors.text.onBrand} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Recovery Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  brandTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.bg.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    flex: 1,
    color: colors.status.vacant,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  forgotLink: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputWrapError: {
    borderColor: colors.brand.primary,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    height: '100%',
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  fieldErrorText: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    fontWeight: '500',
  },
  strengthBox: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    width: 80,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  otpToggle: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  otpToggleText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'underline',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalSuccessHeading: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSuccessText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
