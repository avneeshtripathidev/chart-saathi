import React, { useState, useEffect } from 'react';
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
import { UserCheck, Phone, User, Globe, Check, AlertCircle, ChevronDown } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import {
  validateFullName,
  validateMobileNumber,
  COUNTRY_CODES,
} from '../src/utils/authValidation';

export default function CompleteProfileScreen() {
  const { session, user, profile, saveProfile, isProfileComplete } = useAuth();
  const [fullName, setFullName] = useState(
    profile?.full_name || (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || ''
  );
  const [mobileNumber, setMobileNumber] = useState(profile?.mobile_number || '');
  const [countryCode, setCountryCode] = useState(profile?.country_code || '+91');
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; mobileNumber?: string }>({});

  // If already complete, redirect to main application dashboard
  useEffect(() => {
    if (isProfileComplete) {
      router.replace('/');
    }
  }, [isProfileComplete]);

  // Selected country details
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const handleSubmit = async () => {
    try {
      setErrorMessage(null);
      setFieldErrors({});

      // Validate session
      if (!session || !user) {
        setErrorMessage('Authentication session expired. Please sign in again.');
        router.replace('/login');
        return;
      }

      // Validate Full Name
      const nameVal = validateFullName(fullName);
      // Validate Mobile Number
      const mobileVal = validateMobileNumber(mobileNumber, countryCode);

      if (!nameVal.isValid || !mobileVal.isValid) {
        setFieldErrors({
          fullName: nameVal.error,
          mobileNumber: mobileVal.error,
        });
        return;
      }

      setIsSubmitting(true);
      const { error } = await saveProfile(fullName, mobileNumber, countryCode);

      if (error) {
        setErrorMessage(error.message || 'Failed to save profile. Please check your network and retry.');
        return;
      }

      // Success -> Route to dashboard
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving your profile.');
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
          {/* Card Container */}
          <View style={[styles.profileCard, shadows.md]}>
            <View style={styles.iconBadge}>
              <UserCheck size={30} color={colors.brand.primary} />
            </View>

            <Text style={styles.heading}>Complete Your Profile</Text>
            <Text style={styles.subheading}>
              Just one last step before you get started with ChartSaathi.
            </Text>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={colors.brand.primary} style={{ marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

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
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.text.tertiary}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={100}
                  editable={!isSubmitting}
                />
              </View>
              {fieldErrors.fullName && (
                <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>
              )}
            </View>

            {/* Mobile Number Input with Country Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Mobile Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.phoneRow}>
                {/* Country Code Trigger */}
                <TouchableOpacity
                  style={styles.countryPickerButton}
                  onPress={() => setIsCountryModalVisible(true)}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Select country code"
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                  <ChevronDown size={14} color={colors.text.secondary} />
                </TouchableOpacity>

                {/* Phone Number Input */}
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
                      const cleaned = text.replace(/\D/g, '');
                      setMobileNumber(cleaned);
                      if (fieldErrors.mobileNumber) {
                        setFieldErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                      }
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                    editable={!isSubmitting}
                  />
                </View>
              </View>
              {fieldErrors.mobileNumber && (
                <Text style={styles.fieldErrorText}>{fieldErrors.mobileNumber}</Text>
              )}
              <Text style={styles.inputHelperText}>
                Used for chart inquiry notifications and critical updates.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!fullName.trim() || !mobileNumber.trim()) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !fullName.trim() || !mobileNumber.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Complete Registration"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <Text style={styles.primaryButtonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => setIsCountryModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  profileCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  requiredStar: {
    color: colors.brand.primary,
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
  inputWrapError: {
    borderColor: colors.brand.primary,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  phoneInputWrap: {
    flex: 1,
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
  fieldErrorText: {
    color: colors.brand.primary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  inputHelperText: {
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    width: '100%',
    maxWidth: 380,
    maxHeight: 460,
    padding: spacing.lg,
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
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.primary,
    fontWeight: '700',
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
    borderRadius: borderRadius.sm,
  },
  itemFlag: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  itemCode: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.secondary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
});
