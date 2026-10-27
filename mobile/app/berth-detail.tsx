import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, MapPin, ArrowRight, ShieldCheck, X } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';

const STATUS_ICONS = {
  VACANT: { icon: CheckCircle2, color: colors.status.vacant, label: 'Vacant', desc: 'Available for current booking / TTE allotment' },
  PARTIAL: { icon: AlertCircle, color: colors.status.partial, label: 'Partially Vacant', desc: 'Vacant for a portion of the journey only' },
  OCCUPIED: { icon: XCircle, color: colors.status.occupied, label: 'Occupied', desc: 'Booked and reserved by another passenger' },
  UNKNOWN: { icon: HelpCircle, color: colors.status.unknown, label: 'Unknown', desc: 'Status could not be determined from chart data' },
};

export default function BerthDetailScreen() {
  const params = useLocalSearchParams<{
    berthNumber: string;
    berthType: string;
    status: string;
    coachId: string;
    coachClass?: string;
    trainNumber: string;
    trainName?: string;
    fromStation?: string;
    toStation?: string;
    isFullJourney?: string;
    cabinNumber?: string;
  }>();

  const statusKey = (params.status?.toUpperCase() as keyof typeof STATUS_ICONS) || 'UNKNOWN';
  const statusMeta = STATUS_ICONS[statusKey] ?? STATUS_ICONS.UNKNOWN;
  const StatusIcon = statusMeta.icon;
  const isFull = params.isFullJourney === 'true';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Berth Details</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close berth details"
        >
          <X size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Hero Card */}
        <View style={[styles.heroCard, shadows.md]}>
          <View style={styles.heroTop}>
            <View style={styles.berthBadge}>
              <Text style={styles.berthBadgeNum}>{params.berthNumber}</Text>
              <Text style={styles.berthBadgeType}>{params.berthType}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.coachClassText}>
                Coach {params.coachId} {params.coachClass ? `(${params.coachClass})` : ''}
              </Text>
              <Text style={styles.trainText}>
                Train {params.trainNumber} {params.trainName ? `· ${params.trainName}` : ''}
              </Text>
              {params.cabinNumber ? (
                <Text style={styles.cabinText}>Cabin: {params.cabinNumber}</Text>
              ) : null}
            </View>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBanner, { backgroundColor: `${statusMeta.color}20` }]}>
            <StatusIcon size={20} color={statusMeta.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
              <Text style={styles.statusDesc}>{statusMeta.desc}</Text>
            </View>
          </View>
        </View>

        {/* Vacancy Segment Card */}
        {params.fromStation && params.toStation && (statusKey === 'VACANT' || statusKey === 'PARTIAL') && (
          <View style={[styles.sectionCard, shadows.sm]}>
            <Text style={styles.sectionHeading}>Vacancy Journey Segment</Text>
            <View style={styles.segmentRow}>
              <View style={styles.stationBlock}>
                <MapPin size={16} color={colors.brand.primary} />
                <Text style={styles.stationCode}>{params.fromStation}</Text>
                <Text style={styles.stationLabel}>From Station</Text>
              </View>
              <View style={styles.arrowWrap}>
                <ArrowRight size={20} color={colors.text.tertiary} />
                <Text style={styles.journeyTypeText}>
                  {isFull ? 'Full Journey' : 'Segment Only'}
                </Text>
              </View>
              <View style={styles.stationBlock}>
                <MapPin size={16} color={colors.status.vacant} />
                <Text style={styles.stationCode}>{params.toStation}</Text>
                <Text style={styles.stationLabel}>To Station</Text>
              </View>
            </View>

            {isFull ? (
              <View style={styles.fullJourneyNotice}>
                <ShieldCheck size={16} color={colors.status.vacant} />
                <Text style={styles.fullJourneyText}>
                  This berth is unoccupied for the complete searched route.
                </Text>
              </View>
            ) : (
              <View style={styles.partialJourneyNotice}>
                <AlertCircle size={16} color={colors.status.partial} />
                <Text style={styles.partialJourneyText}>
                  This berth is only vacant between {params.fromStation} and {params.toStation}. It may be occupied on other legs of the train route.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Guidance Information */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <Text style={styles.sectionHeading}>How to secure this vacant berth</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: '700', color: colors.text.primary }}>Current Booking Counters: </Text>
              Visit the Railway Station Current Reservation counter 30–60 minutes before scheduled departure.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: '700', color: colors.text.primary }}>Online IRCTC: </Text>
              Check the official IRCTC app or portal under "Current Booking" window after chart preparation.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: '700', color: colors.text.primary }}>On-board TTE: </Text>
              Approach the Traveling Ticket Examiner (TTE) with a valid waitlisted or RAC ticket for allotment on board.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Done and return"
        >
          <Text style={styles.doneBtnText}>Back to Layout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.tertiary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  berthBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  berthBadgeNum: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  berthBadgeType: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  heroInfo: {
    flex: 1,
  },
  coachClassText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  trainText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cabinText: {
    fontSize: typography.fontSize.xs,
    color: colors.brand.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statusTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  statusDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionHeading: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stationBlock: {
    alignItems: 'center',
    flex: 1,
  },
  stationCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 4,
  },
  stationLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  arrowWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  journeyTypeText: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  fullJourneyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  fullJourneyText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.vacant,
    flex: 1,
    lineHeight: 16,
  },
  partialJourneyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  partialJourneyText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.partial,
    flex: 1,
    lineHeight: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg.tertiary,
    color: colors.brand.primary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  doneBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
});
