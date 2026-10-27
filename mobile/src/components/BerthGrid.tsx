import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../utils/theme';
import type { BerthInfo, BerthStatus } from '../types';

const STATUS_CONFIG: Record<BerthStatus, { color: string; bg: string; label: string; symbol: string }> = {
  VACANT: { color: '#FFFFFF', bg: colors.status.vacant, label: 'Vacant', symbol: '●' },
  OCCUPIED: { color: '#FFFFFF', bg: colors.status.occupied, label: 'Occupied', symbol: '●' },
  PARTIAL: { color: '#FFFFFF', bg: colors.status.partial, label: 'Partial', symbol: '◑' },
  UNKNOWN: { color: colors.text.secondary, bg: colors.bg.tertiary, label: 'Unknown', symbol: '?' },
};

const BERTH_TYPE_SHORT: Record<string, string> = {
  LOWER: 'LB', MIDDLE: 'MB', UPPER: 'UB',
  SIDE_LOWER: 'SL', SIDE_UPPER: 'SU',
  CABIN: 'CB', COUPE: 'CP', SEAT: 'S', UNKNOWN: '?',
};

interface BerthCellProps {
  berth: BerthInfo;
  onPress: (berth: BerthInfo) => void;
}

export function BerthCell({ berth, onPress }: BerthCellProps) {
  const cfg = STATUS_CONFIG[berth.status];

  return (
    <TouchableOpacity
      onPress={() => onPress(berth)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Berth ${berth.berthNumber}, ${berth.berthType}, ${cfg.label}`}
      style={[styles.cell, { backgroundColor: cfg.bg }]}
    >
      <Text style={[styles.number, { color: cfg.color }]}>{berth.berthNumber}</Text>
      <Text style={[styles.type, { color: cfg.color }]}>
        {BERTH_TYPE_SHORT[berth.berthType] ?? '?'}
      </Text>
    </TouchableOpacity>
  );
}

export function BerthLegend() {
  return (
    <View style={styles.legend}>
      {(Object.entries(STATUS_CONFIG) as [BerthStatus, typeof STATUS_CONFIG[BerthStatus]][]).map(
        ([status, cfg]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cfg.bg }]} />
            <Text style={styles.legendText}>{cfg.label}</Text>
          </View>
        ),
      )}
    </View>
  );
}

interface BerthGridProps {
  berths: BerthInfo[];
  onBerthPress: (berth: BerthInfo) => void;
}

export function BerthGrid({ berths, onBerthPress }: BerthGridProps) {
  if (berths.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No berth data available for this coach.</Text>
      </View>
    );
  }

  return (
    <View>
      <BerthLegend />
      <View style={styles.grid}>
        {berths.map((berth) => (
          <BerthCell key={berth.berthNumber} berth={berth} onPress={onBerthPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  type: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    opacity: 0.85,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.secondary,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  empty: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
});
