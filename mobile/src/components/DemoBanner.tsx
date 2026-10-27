import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../utils/theme';
import type { DataFreshness } from '../types';

interface DemoBadgeProps {
  freshness?: DataFreshness;
  isDemo?: boolean;
  style?: ViewStyle;
}

const badgeConfig: Record<DataFreshness, { label: string; bg: string; text: string }> = {
  DEMO: {
    label: '⚠️ DEMO DATA — Not real railway information',
    bg: '#1E3A5F',
    text: '#60A5FA',
  },
  STALE: {
    label: '⏱ Data may be outdated — refresh to get latest',
    bg: '#2D1B4E',
    text: '#A78BFA',
  },
  CACHED: {
    label: '📦 Cached result',
    bg: '#1A2235',
    text: '#94A3B8',
  },
  LIVE: {
    label: '🟢 Live data',
    bg: '#064E3B',
    text: '#34D399',
  },
};

export function DemoBanner({ freshness, isDemo, style }: DemoBadgeProps) {
  const key = isDemo ? 'DEMO' : (freshness ?? 'LIVE');
  const cfg = badgeConfig[key];

  if (key === 'LIVE') return null; // Don't show banner for clean live data

  return (
    <View style={[styles.banner, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
