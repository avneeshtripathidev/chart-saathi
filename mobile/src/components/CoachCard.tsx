import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../utils/theme';
import type { CoachInfo } from '../types';

interface CoachCardProps {
  coach: CoachInfo;
  onPress: () => void;
  isSelected?: boolean;
  style?: ViewStyle;
}

function VacancyBar({ vacant, total }: { vacant: number; total: number }) {
  const pct = total > 0 ? Math.round((vacant / total) * 100) : 0;
  const barColor =
    pct === 0 ? colors.status.occupied :
    pct < 20 ? colors.status.partial :
    colors.status.vacant;

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export function CoachCard({ coach, onPress, isSelected }: CoachCardProps) {
  const vacant = coach.vacantCount ?? null;
  const total = coach.totalBerths ?? null;
  const unknown = coach.vacantCount === null;

  const statusColor =
    unknown ? colors.status.unknown :
    vacant === 0 ? colors.status.occupied :
    colors.status.vacant;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Coach ${coach.coachId}, ${vacant ?? 'unknown'} vacant berths`}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        shadows.sm,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.coachId}>{coach.coachId}</Text>
        <View style={[styles.classBadge, { backgroundColor: colors.bg.tertiary }]}>
          <Text style={styles.classText}>{coach.coachClass}</Text>
        </View>
      </View>

      {unknown ? (
        <Text style={styles.unknownText}>No data</Text>
      ) : (
        <>
          <Text style={[styles.vacantCount, { color: statusColor }]}>
            {vacant}
            <Text style={styles.vacantLabel}> vacant</Text>
          </Text>
          {total != null && (
            <>
              <VacancyBar vacant={vacant ?? 0} total={total} />
              <Text style={styles.totalText}>{total} total</Text>
            </>
          )}
        </>
      )}

      {!coach.dataComplete && (
        <Text style={styles.incompleteNote}>⚠ Partial data</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.xs,
    width: 150,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  selectedCard: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.bg.tertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  coachId: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  classBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  classText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.brand.secondary,
  },
  vacantCount: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  vacantLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  barContainer: {
    height: 4,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  totalText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  unknownText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.unknown,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  incompleteNote: {
    fontSize: typography.fontSize.xs,
    color: colors.status.partial,
    marginTop: spacing.sm,
  },
});
