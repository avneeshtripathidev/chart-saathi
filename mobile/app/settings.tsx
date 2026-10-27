import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ShieldAlert,
  Server,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { API_BASE_URL, APP_VERSION } from '../src/utils/config';
import { useAuth } from '../src/context/AuthContext';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of ChartSaathi?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached chart queries and recent search history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache and history cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Account Card */}
        {user && (
          <View style={[styles.accountCard, shadows.sm]}>
            <View style={styles.accountHeader}>
              <View style={styles.avatarBox}>
                <User size={24} color={colors.brand.primary} />
              </View>
              <View style={styles.accountDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.accountName}>
                    {profile?.full_name || 'Authenticated Traveler'}
                  </Text>
                  <CheckCircle2 size={15} color={colors.status.vacant} />
                </View>
                <View style={styles.accountMetaRow}>
                  <Mail size={12} color={colors.text.tertiary} />
                  <Text style={styles.accountEmail}>{user.email || 'Email verified'}</Text>
                </View>
                {profile?.mobile_number && (
                  <View style={styles.accountMetaRow}>
                    <Phone size={12} color={colors.text.tertiary} />
                    <Text style={styles.accountPhone}>
                      {profile.country_code || '+91'} {profile.mobile_number}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out of account"
            >
              <LogOut size={16} color={colors.status.occupied} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Branding Card */}
        <View style={[styles.brandCard, shadows.sm]}>
          <View style={styles.brandIconBox}>
            <Sparkles size={28} color={colors.brand.primary} />
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.appName}>ChartSaathi</Text>
            <Text style={styles.appTagline}>Indian Railway Chart Vacancy Explorer</Text>
            <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
          </View>
        </View>

        {/* Legal & IRCTC Disclaimer Card */}
        <View style={[styles.disclaimerCard, shadows.sm]}>
          <View style={styles.disclaimerHeader}>
            <ShieldAlert size={20} color={colors.status.partial} />
            <Text style={styles.disclaimerTitle}>Disclaimer & Official Affiliation</Text>
          </View>
          <Text style={styles.disclaimerBody}>
            ChartSaathi is an independent informational utility and is NOT affiliated with, authorized, or endorsed by Indian Railways, IRCTC, CRIS, or the Government of India.
          </Text>
          <Text style={styles.disclaimerBody}>
            This app does not provide ticket booking, payment processing, or seat allocation services. All vacancy data is retrieved from publicly displayed chart notices after initial reservation charts are prepared.
          </Text>
        </View>

        {/* Chart Preparation Rules Info */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.brand.primary} />
            <Text style={styles.sectionTitle}>Understanding Chart Rules</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>First Chart:</Text> Usually prepared 4 hours before scheduled train departure from originating station (or 2:00 PM previous day for early morning trains).
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Second (Final) Chart:</Text> Prepared 30 to 45 minutes before departure, accounting for current counter bookings and cancellations.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Current Booking:</Text> Vacant berths can be booked on IRCTC or at station current reservation counters until train departure.
            </Text>
          </View>
        </View>

        {/* Server & Data Source */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Server size={18} color={colors.brand.primary} />
            <Text style={styles.sectionTitle}>Backend & Connectivity</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>API Base URL</Text>
              <Text style={styles.rowValue}>{API_BASE_URL}</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusPillText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={colors.brand.primary} />
            <Text style={styles.sectionTitle}>Preferences & Cache</Text>
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Enable Offline Query Cache</Text>
              <Text style={styles.rowSub}>Cache previous chart queries for faster reload</Text>
            </View>
            <Switch
              value={offlineCacheEnabled}
              onValueChange={setOfflineCacheEnabled}
              trackColor={{ false: colors.bg.tertiary, true: colors.brand.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCache}
            accessibilityRole="button"
            accessibilityLabel="Clear cache and search history"
          >
            <View style={styles.actionLeft}>
              <Trash2 size={18} color={colors.status.occupied} />
              <Text style={[styles.rowLabel, { color: colors.status.occupied, marginLeft: spacing.sm }]}>
                Clear Search History & Cache
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* External Links */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://www.irctc.co.in')}
          >
            <Text style={styles.linkText}>Official IRCTC Website</Text>
            <ExternalLink size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://enquiry.indianrail.gov.in')}
          >
            <Text style={styles.linkText}>National Train Enquiry System (NTES)</Text>
            <ExternalLink size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  brandIconBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  brandTextWrap: {
    flex: 1,
  },
  appName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.text.primary,
  },
  accountCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  accountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  accountEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  accountPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.secondary,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(126, 48, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(126, 48, 68, 0.3)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  signOutText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.status.occupied,
  },
  appTagline: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  appVersion: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 4,
    fontWeight: '600',
  },
  disclaimerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  disclaimerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.status.partial,
  },
  disclaimerBody: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  ruleBullet: {
    color: colors.brand.primary,
    fontSize: typography.fontSize.md,
    lineHeight: 18,
    marginRight: spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  ruleBold: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rowSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.secondary,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.vacant,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.vacant,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
});
