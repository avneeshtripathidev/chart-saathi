import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Shield,
  Bell,
  Lock,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  AtSign,
  Edit3,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Sparkles,
  KeyRound,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useAuth } from '../src/context/AuthContext';
import {
  validateFullName,
  validateMobileNumber,
  validateUsername,
  validatePassword,
  AVATAR_PRESETS,
} from '../src/utils/authValidation';

export default function SettingsScreen() {
  const {
    user,
    profile,
    signOut,
    saveProfile,
    updatePassword,
    updatePreferences,
    deleteAccount,
  } = useAuth();

  // Active section tab: 'PROFILE' | 'SECURITY' | 'PREFERENCES' | 'DANGER'
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'PREFERENCES' | 'DANGER'>('PROFILE');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editMobile, setEditMobile] = useState(profile?.mobile_number || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || AVATAR_PRESETS[0].id);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete Account Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Preferences local toggle states
  const [notifications, setNotifications] = useState({
    chart_updates: profile?.notification_preferences?.chart_updates ?? true,
    email_alerts: profile?.notification_preferences?.email_alerts ?? true,
    push_notifications: profile?.notification_preferences?.push_notifications ?? true,
  });

  const [privacy, setPrivacy] = useState({
    show_profile: profile?.privacy_settings?.show_profile ?? false,
    activity_status: profile?.privacy_settings?.activity_status ?? true,
  });

  // Calculate Profile Completion %
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (user?.email) score += 25; // Email verified via auth
    if (profile?.full_name) score += 25; // Full name added
    if (profile?.mobile_number) score += 25; // Mobile added
    if (profile?.username) score += 25; // Custom username picked
    return score;
  }, [user, profile]);

  const activeAvatar = AVATAR_PRESETS.find((a) => a.id === (profile?.avatar_url || 'rajdhani')) || AVATAR_PRESETS[0];

  const handleSaveProfile = async () => {
    setProfileSaveError(null);
    const nameVal = validateFullName(editName);
    const userVal = validateUsername(editUsername);
    const mobileVal = validateMobileNumber(editMobile, profile?.country_code || '+91');

    if (!nameVal.isValid) {
      setProfileSaveError(nameVal.error || 'Invalid name');
      return;
    }
    if (!userVal.isValid) {
      setProfileSaveError(userVal.error || 'Invalid username');
      return;
    }
    if (!mobileVal.isValid) {
      setProfileSaveError(mobileVal.error || 'Invalid mobile number');
      return;
    }

    try {
      setIsSavingProfile(true);
      const { error } = await saveProfile(
        editName,
        editMobile,
        profile?.country_code || '+91',
        editUsername,
        editAvatar
      );

      if (error) {
        setProfileSaveError(error.message || 'Failed to update profile.');
        return;
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      setProfileSaveError(err?.message || 'Error saving changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    const passVal = validatePassword(newPassword);
    if (!passVal.isValid) {
      setPasswordError(passVal.error || 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsSavingPassword(true);
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message || 'Failed to update password.');
        return;
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Password update failed.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleTogglePreference = async (key: keyof typeof notifications, val: boolean) => {
    const updated = { ...notifications, [key]: val };
    setNotifications(updated);
    await updatePreferences(updated, privacy);
  };

  const handleTogglePrivacy = async (key: keyof typeof privacy, val: boolean) => {
    const updated = { ...privacy, [key]: val };
    setPrivacy(updated);
    await updatePreferences(notifications, updated);
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type DELETE to confirm account removal.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount();
      router.replace('/login');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2026';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Identity Card */}
        <View style={[styles.profileHeroCard, shadows.md]}>
          <View style={styles.heroRow}>
            {/* Avatar Badge */}
            <View style={[styles.avatarCircle, { backgroundColor: activeAvatar.bg }]}>
              <Text style={{ fontSize: 32 }}>{activeAvatar.icon}</Text>
            </View>

            {/* Profile Summary */}
            <View style={styles.heroDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroName}>
                  {profile?.full_name || 'Chart Traveler'}
                </Text>
                <CheckCircle2 size={16} color={colors.status.vacant} />
              </View>

              {profile?.username ? (
                <Text style={styles.heroUsername}>@{profile.username}</Text>
              ) : null}

              <View style={styles.heroMetaRow}>
                <Mail size={12} color={colors.text.tertiary} />
                <Text style={styles.heroMetaText}>{user?.email || 'Authenticated'}</Text>
              </View>

              <View style={styles.heroMetaRow}>
                <Phone size={12} color={colors.text.tertiary} />
                <Text style={styles.heroMetaText}>
                  {profile?.country_code || '+91'} {profile?.mobile_number || 'Not added'}
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Completion Meter */}
          <View style={styles.completionBarContainer}>
            <View style={styles.completionBarHeader}>
              <Text style={styles.completionLabel}>Profile Health</Text>
              <Text style={styles.completionPercent}>{completionPercentage}% Complete</Text>
            </View>
            <View style={styles.completionTrack}>
              <View style={[styles.completionProgress, { width: `${completionPercentage}%` }]} />
            </View>
          </View>

          {/* Quick Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              setEditName(profile?.full_name || '');
              setEditUsername(profile?.username || '');
              setEditMobile(profile?.mobile_number || '');
              setEditAvatar(profile?.avatar_url || 'rajdhani');
              setProfileSaveError(null);
              setIsEditModalOpen(true);
            }}
          >
            <Edit3 size={15} color={colors.text.primary} />
            <Text style={styles.editProfileButtonText}>Edit Profile Details</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabs}>
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'PROFILE' && styles.navTabActive]}
            onPress={() => setActiveTab('PROFILE')}
          >
            <User size={16} color={activeTab === 'PROFILE' ? colors.brand.primary : colors.text.secondary} />
            <Text style={[styles.navTabText, activeTab === 'PROFILE' && styles.navTabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'SECURITY' && styles.navTabActive]}
            onPress={() => setActiveTab('SECURITY')}
          >
            <Lock size={16} color={activeTab === 'SECURITY' ? colors.brand.primary : colors.text.secondary} />
            <Text style={[styles.navTabText, activeTab === 'SECURITY' && styles.navTabTextActive]}>
              Security
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'PREFERENCES' && styles.navTabActive]}
            onPress={() => setActiveTab('PREFERENCES')}
          >
            <Bell size={16} color={activeTab === 'PREFERENCES' ? colors.brand.primary : colors.text.secondary} />
            <Text style={[styles.navTabText, activeTab === 'PREFERENCES' && styles.navTabTextActive]}>
              Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeTab === 'DANGER' && styles.navTabActive]}
            onPress={() => setActiveTab('DANGER')}
          >
            <ShieldAlert size={16} color={activeTab === 'DANGER' ? colors.brand.primary : colors.text.secondary} />
            <Text style={[styles.navTabText, activeTab === 'DANGER' && styles.navTabTextActive]}>
              Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: PROFILE OVERVIEW */}
        {activeTab === 'PROFILE' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <AtSign size={16} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{profile?.username || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Mail size={16} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Verified</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Phone size={16} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>
                  {profile?.country_code || '+91'} {profile?.mobile_number || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Calendar size={16} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION: SECURITY */}
        {activeTab === 'SECURITY' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Security & Credentials</Text>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setPasswordError(null);
                setPasswordSuccess(false);
                setIsPasswordModalOpen(true);
              }}
            >
              <View style={styles.actionIconBox}>
                <KeyRound size={18} color={colors.brand.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionDesc}>Update your account login password</Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Shield size={16} color={colors.status.vacant} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Authentication Session</Text>
                <Text style={styles.infoValue}>Active via Supabase Auth</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION: PREFERENCES & PRIVACY */}
        {activeTab === 'PREFERENCES' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Chart Preparation Alerts</Text>
                <Text style={styles.switchDesc}>Push alert when first or final railway chart is prepared</Text>
              </View>
              <TouchableOpacity
                style={[styles.togglePill, notifications.chart_updates && styles.togglePillActive]}
                onPress={() => handleTogglePreference('chart_updates', !notifications.chart_updates)}
              >
                <View style={[styles.toggleKnob, notifications.chart_updates && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Email Digests</Text>
                <Text style={styles.switchDesc}>Weekly vacant berth updates on popular routes</Text>
              </View>
              <TouchableOpacity
                style={[styles.togglePill, notifications.email_alerts && styles.togglePillActive]}
                onPress={() => handleTogglePreference('email_alerts', !notifications.email_alerts)}
              >
                <View style={[styles.toggleKnob, notifications.email_alerts && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Privacy Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Public Traveler Badge</Text>
                <Text style={styles.switchDesc}>Allow passengers on shared train queries to see your traveler badge</Text>
              </View>
              <TouchableOpacity
                style={[styles.togglePill, privacy.show_profile && styles.togglePillActive]}
                onPress={() => handleTogglePrivacy('show_profile', !privacy.show_profile)}
              >
                <View style={[styles.toggleKnob, privacy.show_profile && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION: DANGER ZONE & LOGOUT */}
        {activeTab === 'DANGER' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Actions</Text>

            {/* Logout */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={async () => {
                await signOut();
                router.replace('/login');
              }}
            >
              <View style={styles.actionIconBox}>
                <LogOut size={18} color={colors.text.secondary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Sign Out</Text>
                <Text style={styles.actionDesc}>Safely log out of your ChartSaathi account</Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomWidth: 0, marginTop: spacing.sm }]}
              onPress={() => {
                setDeleteConfirmationText('');
                setIsDeleteModalOpen(true);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(228, 95, 96, 0.12)' }]}>
                <Trash2 size={18} color={colors.brand.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.brand.primary }]}>
                  Delete Account
                </Text>
                <Text style={styles.actionDesc}>Permanently delete all profile and query data</Text>
              </View>
              <ChevronRight size={18} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {profileSaveError && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={colors.brand.primary} />
                <Text style={styles.errorText}>{profileSaveError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Badge Selection */}
              <Text style={styles.inputLabel}>Traveler Badge</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {AVATAR_PRESETS.map((p) => {
                  const isSel = p.id === editAvatar;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.avatarChoice, isSel && styles.avatarChoiceSelected]}
                      onPress={() => setEditAvatar(p.id)}
                    >
                      <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                      <Text style={[styles.avatarChoiceText, isSel && styles.avatarChoiceTextSelected]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username (@)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editUsername}
                  onChangeText={(t) => setEditUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="none"
                />
              </View>

              {/* Mobile */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editMobile}
                  onChangeText={(t) => setEditMobile(t.replace(/\D/g, ''))}
                  placeholder="Mobile number"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSavingProfile && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color={colors.text.onBrand} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {passwordError && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={colors.brand.primary} />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            )}

            {passwordSuccess && (
              <View style={styles.successBox}>
                <CheckCircle2 size={16} color={colors.status.vacant} />
                <Text style={styles.successText}>Password updated successfully!</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isSavingPassword && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={isSavingPassword || passwordSuccess}
            >
              {isSavingPassword ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <Text style={styles.primaryButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DELETE ACCOUNT MODAL */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Trash2 size={20} color={colors.brand.primary} />
                <Text style={[styles.modalTitle, { color: colors.brand.primary }]}>Delete Account</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDeleteModalOpen(false)}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.deleteWarning}>
              This action is permanent and cannot be undone. All your profile information, alerts, and saved train preferences will be permanently wiped.
            </Text>

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
              Type <Text style={{ color: colors.brand.primary, fontWeight: '800' }}>DELETE</Text> to confirm:
            </Text>

            <TextInput
              style={[styles.modalInput, { borderColor: colors.brand.primary }]}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder="DELETE"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.brand.primary, marginTop: spacing.lg },
                isDeleting && styles.buttonDisabled,
              ]}
              onPress={handleConfirmDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <Text style={styles.primaryButtonText}>Permanently Delete My Account</Text>
              )}
            </TouchableOpacity>
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
  container: {
    padding: spacing.md,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
  },
  profileHeroCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  heroDetails: {
    flex: 1,
  },
  heroName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.text.primary,
  },
  heroUsername: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  completionBarContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  completionBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  completionPercent: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.status.vacant,
  },
  completionTrack: {
    height: 6,
    backgroundColor: colors.bg.primary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionProgress: {
    height: '100%',
    backgroundColor: colors.status.vacant,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  editProfileButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  navTabActive: {
    backgroundColor: colors.bg.tertiary,
  },
  navTabText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  navTabTextActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeSuccessText: {
    color: colors.status.vacant,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  switchContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 16,
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalInput: {
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 6,
  },
  avatarChoice: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
    width: 100,
  },
  avatarChoiceSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(228, 95, 96, 0.12)',
  },
  avatarChoiceText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  avatarChoiceTextSelected: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.text.onBrand,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(228, 95, 96, 0.12)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.status.vacant,
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  deleteWarning: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
});
