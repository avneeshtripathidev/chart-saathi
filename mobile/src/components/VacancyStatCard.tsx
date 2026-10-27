import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Info } from 'lucide-react-native';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, borderRadius } from '../utils/theme';

interface VacancyStatCardProps {
  totalVacant: number | null | undefined;
  isLoading?: boolean;
}

export function VacancyStatCard({ totalVacant, isLoading = false }: VacancyStatCardProps) {
  if (isLoading) {
    return (
      <GlassPanel style={styles.card}>
        <View style={styles.skeletonLabel} />
        <View style={styles.skeletonValue} />
      </GlassPanel>
    );
  }

  const hasData = totalVacant !== null && totalVacant !== undefined;
  const count = hasData ? totalVacant : 0;
  const isAvailable = count > 0;

  const badgeBg = isAvailable ? '#152C1E' : '#2D1B22';
  const badgeBorder = isAvailable ? '#255E3A' : '#572935';
  const badgeText = isAvailable ? '#22C55E' : '#E45F60';

  return (
    <GlassPanel style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <View style={styles.labelRow}>
            <ShieldCheck size={16} color={colors.brand.roseStone} />
            <Text style={styles.labelTitle}>Total Vacant Berths</Text>
          </View>
          <Text style={styles.contextualSub}>
            Post-chart unreserved berths across confirmed coaches
          </Text>
        </View>

        {/* Solid Tabular Numeral Display */}
        <View style={[styles.numberPill, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          <Text style={[styles.vacancyValue, { color: badgeText }]}>
            {hasData ? count : '—'}
          </Text>
          <Text style={[styles.unitText, { color: badgeText }]}>
            {count === 1 ? 'BERTH VACANT' : 'BERTHS VACANT'}
          </Text>
        </View>
      </View>

      <View style={styles.footerNoteRow}>
        <Info size={12} color={colors.text.tertiary} />
        <Text style={styles.footerNoteText}>
          {isAvailable
            ? 'Official chart preparation snapshot. Subject to concurrent TTE allotment.'
            : 'No unreserved chart vacancies reported currently.'}
        </Text>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textColumn: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  labelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  contextualSub: {
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  numberPill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
  },
  vacancyValue: {
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 36,
  },
  unitText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#302D36',
    paddingTop: 8,
  },
  footerNoteText: {
    fontSize: 10.5,
    color: colors.text.tertiary,
    flex: 1,
  },
  skeletonLabel: {
    width: 120,
    height: 16,
    backgroundColor: '#302D36',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonValue: {
    width: 60,
    height: 32,
    backgroundColor: '#302D36',
    borderRadius: 6,
  },
});
