import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserCheck,
  Phone,
  User,
  AtSign,
  Globe,
  Check,
  AlertCircle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Shield,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import {
  validateFullName,
  validateMobileNumber,
  validateUsername,
  COUNTRY_CODES,
  AVATAR_PRESETS,
} from '../src/utils/authValidation';

export default function CompleteProfileScreen() {
  const { session, user, profile, saveProfile, checkUsernameAvailable, isProfileComplete } = useAuth();

  // Wizard Step: 1 = Basic Info, 2 = Preferences
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [fullName, setFullName] = useState(
    profile?.full_name || (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || ''
  );
  const [username, setUsername] = useState(profile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || AVATAR_PRESETS[0].id);
  const [mobileNumber, setMobileNumber] = useState(profile?.mobile_number || '');
  const [countryCode, setCountryCode] = useState(profile?.country_code || '+91');

  // Username live check states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);

  // Preferences (Step 2)
  const [chartAlerts, setChartAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  // Modals & UI states
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    username?: string;
    mobileNumber?: string;
  }>({});

  // Auto-redirect if already complete
  useEffect(() => {
    if (isProfileComplete) {
      router.replace('/');
    }
  }, [isProfileComplete]);

  // Live debounced check for username
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      setUsernameStatus(null);
      return;
    }

    const val = validateUsername(trimmed);
    if (!val.isValid) {
      setUsernameStatus({ available: false, message: val.error || 'Invalid username' });
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await checkUsernameAvailable(trimmed);
        setUsernameStatus(res);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable]);

  // Selected country details
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
  const activeAvatar = AVATAR_PRESETS.find((a) => a.id === selectedAvatar) || AVATAR_PRESETS[0];

  const handleNextStep = () => {
    setErrorMessage(null);
    setFieldErrors({});

    const nameVal = validateFullName(fullName);
    const userVal = validateUsername(username);
    const mobileVal = validateMobileNumber(mobileNumber, countryCode);

    const errors: typeof fieldErrors = {};
    if (!nameVal.isValid) errors.fullName = nameVal.error;
    if (!userVal.isValid) errors.username = userVal.error;
    if (usernameStatus && !usernameStatus.available) errors.username = usernameStatus.message;
    if (!mobileVal.isValid) errors.mobileNumber = mobileVal.error;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!session || !user) {
      setErrorMessage('Authentication session expired. Please sign in again.');
      router.replace('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const { error } = await saveProfile(
        fullName,
        mobileNumber,
        countryCode,
        username.trim().toLowerCase(),
        selectedAvatar
      );

      if (error) {
        setErrorMessage(error.message || 'Failed to complete profile. Please try again.');
        return;
      }

      // Success -> Redirect to main dashboard
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
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
          {/* Progress Indicator */}
          <View style={styles.progressHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {step} of 2</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
          </View>

          {/* Card Container */}
          <View style={[styles.profileCard, shadows.md]}>
            {/* Header Icon */}
            <View style={styles.iconBadge}>
              <Text style={{ fontSize: 28 }}>{activeAvatar.icon}</Text>
            </View>

            <Text style={styles.heading}>
              {step === 1 ? 'Complete Your Profile' : 'Traveler Preferences'}
            </Text>
            <Text style={styles.subheading}>
              {step === 1
                ? 'Personalize your identity for real-time chart vacancy notifications'
                : 'Configure notification alerts and privacy settings'}
            </Text>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* STEP 1: Basic Profile Details */}
            {step === 1 && (
              <>
                {/* Avatar Preset Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Choose Traveler Badge</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarRow}
                  >
                    {AVATAR_PRESETS.map((item) => {
                      const isSelected = item.id === selectedAvatar;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.avatarChip,
                            isSelected && styles.avatarChipSelected,
                          ]}
                          onPress={() => setSelectedAvatar(item.id)}
                        >
                          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                          <Text style={[styles.avatarChipLabel, isSelected && styles.avatarChipLabelSelected]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Full Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrap,
                      Boolean(fieldErrors.fullName) && styles.inputWrapError,
                    ]}
                  >
                    <User size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Avneesh Kumar"
                      placeholderTextColor={colors.text.tertiary}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                      }}
                      autoCapitalize="words"
                      maxLength={100}
                    />
                  </View>
                  {fieldErrors.fullName && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>
                  )}
                </View>

                {/* Unique Username Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>
                      Username <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    {isCheckingUsername && (
                      <ActivityIndicator size="small" color={colors.text.tertiary} />
                    )}
                  </View>
                  <View
                    style={[
                      styles.inputWrap,
                      Boolean(fieldErrors.username) && styles.inputWrapError,
                    ]}
                  >
                    <AtSign size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. avneesh_travels"
                      placeholderTextColor={colors.text.tertiary}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={30}
                    />
                    {usernameStatus && !isCheckingUsername && (
                      usernameStatus.available ? (
                        <CheckCircle2 size={18} color={colors.status.vacant} />
                      ) : (
                        <XCircle size={18} color={colors.brand.primary} />
                      )
                    )}
                  </View>
                  {fieldErrors.username ? (
                    <Text style={styles.fieldErrorText}>{fieldErrors.username}</Text>
                  ) : usernameStatus ? (
                    <Text
                      style={[
                        styles.helperFeedback,
                        { color: usernameStatus.available ? colors.status.vacant : colors.brand.primary },
                      ]}
                    >
                      {usernameStatus.message}
                    </Text>
                  ) : (
                    <Text style={styles.inputHelperText}>
                      Lowercase letters, numbers, and underscores (3-30 characters)
                    </Text>
                  )}
                </View>

                {/* Mobile Number with Country Code */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Mobile Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.phoneRow}>
                    <TouchableOpacity
                      style={styles.countryPickerButton}
                      onPress={() => setIsCountryModalVisible(true)}
                    >
                      <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                      <ChevronDown size={14} color={colors.text.secondary} />
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.phoneInputWrap,
                        Boolean(fieldErrors.mobileNumber) && styles.inputWrapError,
                      ]}
                    >
                      <Phone size={18} color={colors.text.tertiary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={countryCode === '+91' ? '9876543210' : 'Mobile number'}
                        placeholderTextColor={colors.text.tertiary}
                        value={mobileNumber}
                        onChangeText={(text) => {
                          setMobileNumber(text.replace(/\D/g, ''));
                          if (fieldErrors.mobileNumber) {
                            setFieldErrors((p) => ({ ...p, mobileNumber: undefined }));
                          }
                        }}
                        keyboardType="phone-pad"
                        maxLength={15}
                      />
                    </View>
                  </View>
                  {fieldErrors.mobileNumber && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.mobileNumber}</Text>
                  )}
                </View>

                {/* Next Step Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextStep}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Continue to Preferences</Text>
                  <ArrowRight size={18} color={colors.text.onBrand} />
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: Preferences */}
            {step === 2 && (
              <>
                <View style={styles.prefCard}>
                  <View style={styles.prefRow}>
                    <View style={styles.prefInfo}>
                      <Bell size={20} color={colors.brand.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prefTitle}>Live Chart Notifications</Text>
                        <Text style={styles.prefDesc}>
                          Receive push alerts when your train chart is prepared or updated.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.togglePill, chartAlerts && styles.togglePillActive]}
                      onPress={() => setChartAlerts(!chartAlerts)}
                    >
                      <View style={[styles.toggleKnob, chartAlerts && styles.toggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.prefDivider} />

                  <View style={styles.prefRow}>
                    <View style={styles.prefInfo}>
                      <Shield size={20} color={colors.status.vacant} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prefTitle}>Email Summary Reports</Text>
                        <Text style={styles.prefDesc}>
                          Receive weekly berth availability digests and itinerary summaries.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.togglePill, emailAlerts && styles.togglePillActive]}
                      onPress={() => setEmailAlerts(!emailAlerts)}
                    >
                      <View style={[styles.toggleKnob, emailAlerts && styles.toggleKnobActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.prefDivider} />

                  <View style={styles.prefRow}>
                    <View style={styles.prefInfo}>
                      <Globe size={20} color={colors.text.tertiary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prefTitle}>Public Traveler Profile</Text>
                        <Text style={styles.prefDesc}>
                          Allow fellow passengers on shared PNRs to view your traveler badge.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.togglePill, publicProfile && styles.togglePillActive]}
                      onPress={() => setPublicProfile(!publicProfile)}
                    >
                      <View style={[styles.toggleKnob, publicProfile && styles.toggleKnobActive]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Button Row */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={handleFinishOnboarding}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.text.onBrand} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Finish & Go to Dashboard</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Selector Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, shadows.md]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Globe size={18} color={colors.brand.primary} />
                <Text style={styles.modalTitle}>Select Country Code</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === countryCode;
                return (
                  <TouchableOpacity
                    style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                    onPress={() => {
                      setCountryCode(item.code);
                      setIsCountryModalVisible(false);
                      if (fieldErrors.mobileNumber) {
                        setFieldErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                      }
                    }}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    {isSelected && <Check size={16} color={colors.brand.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  progressHeader: {
    marginBottom: spacing.lg,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepBadgeText: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  profileCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignSelf: 'center',
  },
  heading: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheading: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 18,
  },
  avatarRow: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  avatarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatarChipSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(228, 95, 96, 0.1)',
  },
  avatarChipLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  avatarChipLabelSelected: {
    color: colors.text.primary,
    fontWeight: '700',
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
  requiredStar: {
    color: colors.brand.primary,
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
  fieldErrorText: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    fontWeight: '500',
  },
  helperFeedback: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  inputHelperText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCodeText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  phoneInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  prefCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  prefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  prefTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  prefDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  prefDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    padding: 2,
  },
  togglePillActive: {
    backgroundColor: colors.status.vacant,
    borderColor: colors.status.vacant,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text.tertiary,
  },
  toggleKnobActive: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalClose: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(228, 95, 96, 0.08)',
    borderRadius: borderRadius.md,
  },
  itemFlag: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  itemName: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  itemCode: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginRight: spacing.md,
  },
});
