import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Train, ArrowRight } from 'lucide-react-native';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, borderRadius } from '../utils/theme';
import type { Station, TrainClass, ChartStatus } from '../types';

interface JourneySummaryCardProps {
  trainNumber: string;
  trainName: string;
  boardingStation: Station;
  destinationStation: Station;
  formattedDate: string;
  selectedClass?: TrainClass;
  routeType?: 'DIRECT' | 'INDIRECT';
  viaStation?: string;
  chartStatus: ChartStatus;
  formattedFetch?: string | null;
}

const CHART_STATUS_CONFIG: Record<ChartStatus, { label: string; color: string; bg: string; border: string }> = {
  FINAL_CHART: {
    label: 'Final Chart Prepared',
    color: '#22C55E',
    bg: '#172B20',
    border: '#265438',
  },
  FIRST_CHART: {
    label: 'First Chart Prepared',
    color: '#E8B943',
    bg: '#2F2615',
    border: '#5C481A',
  },
  NOT_PREPARED: {
    label: 'Chart Not Prepared Yet',
    color: '#948D96',
    bg: '#232126',
    border: '#38343F',
  },
  UNKNOWN: {
    label: 'Status Unknown',
    color: '#948D96',
    bg: '#232126',
    border: '#38343F',
  },
};

export function JourneySummaryCard({
  trainNumber,
  trainName,
  boardingStation,
  destinationStation,
  formattedDate,
  selectedClass,
  routeType = 'DIRECT',
  viaStation,
  chartStatus,
  formattedFetch,
}: JourneySummaryCardProps) {
  const chartCfg = CHART_STATUS_CONFIG[chartStatus] ?? CHART_STATUS_CONFIG.UNKNOWN;

  return (
    <GlassPanel elevated style={styles.card}>
      {/* Top Train Name & Number */}
      <View style={styles.headerRow}>
        <View style={styles.trainBadge}>
          <Train size={13} color={colors.white} />
          <Text style={styles.trainNumberText}>#{trainNumber}</Text>
        </View>
        <Text style={styles.trainNameText} numberOfLines={1}>
          {trainName}
        </Text>
      </View>

      {/* Origin ━━━ Track ━━━ Destination */}
      <View style={styles.routeContainer}>
        {/* Origin */}
        <View style={styles.stationBlock}>
          <Text style={styles.stationCode}>{boardingStation.code}</Text>
          <Text style={styles.stationName} numberOfLines={1}>
            {boardingStation.name || boardingStation.code}
          </Text>
        </View>

        {/* Custom Route Connector */}
        <View style={styles.connectorContainer}>
          <View style={styles.nodeOrigin} />
          <View style={styles.trackLine}>
            <View style={styles.locoBubble}>
              <Train size={11} color={colors.white} />
            </View>
          </View>
          <View style={styles.nodeDest} />
        </View>

        {/* Destination */}
        <View style={[styles.stationBlock, { alignItems: 'flex-end' }]}>
          <Text style={[styles.stationCode, { color: colors.brand.primary }]}>
            {destinationStation.code}
          </Text>
          <Text style={[styles.stationName, { textAlign: 'right' }]} numberOfLines={1}>
            {destinationStation.name || destinationStation.code}
          </Text>
        </View>
      </View>

      {/* Meta Chips Row */}
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>📅 {formattedDate}</Text>
        </View>

        {selectedClass && (
          <View style={[styles.metaChip, styles.classChipHighlight]}>
            <Text style={styles.classChipText}>{selectedClass}</Text>
          </View>
        )}

        {/* Direct / Indirect Badge */}
        {routeType === 'INDIRECT' ? (
          <View style={styles.indirectBadge}>
            <Text style={styles.indirectBadgeText}>
              ⚡ Indirect {viaStation ? `(Via ${viaStation})` : 'Route'}
            </Text>
          </View>
        ) : (
          <View style={styles.directBadge}>
            <View style={styles.directDot} />
            <Text style={styles.directBadgeText}>Direct Route</Text>
          </View>
        )}
      </View>

      {/* Chart Status Banner */}
      <View style={[styles.chartStatusBox, { backgroundColor: chartCfg.bg, borderColor: chartCfg.border }]}>
        <View style={[styles.statusDot, { backgroundColor: chartCfg.color }]} />
        <Text style={[styles.chartStatusLabel, { color: chartCfg.color }]}>
          {chartCfg.label}
        </Text>
      </View>

      {/* Timestamp Row */}
      {formattedFetch && (
        <View style={styles.timestampRow}>
          <Clock size={11} color={colors.text.tertiary} />
          <Text style={styles.timestampText}>
            Updated {formattedFetch}
          </Text>
        </View>
      )}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  trainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand.wine,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#983D54',
  },
  trainNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  trainNameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1D22',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#302D37',
  },
  stationBlock: {
    minWidth: 72,
  },
  stationCode: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.brand.secondary, // Marigold
    letterSpacing: 0.5,
  },
  stationName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
    maxWidth: 95,
  },
  connectorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  nodeOrigin: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.secondary,
  },
  nodeDest: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  trackLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3E3A46',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  locoBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaChip: {
    backgroundColor: '#2E2B33',
    borderRadius: borderRadius.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#3D3945',
  },
  metaChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text.primary,
  },
  classChipHighlight: {
    backgroundColor: '#382226',
    borderColor: colors.brand.primary,
  },
  classChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#172C20',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#265438',
  },
  directDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  directBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
  },
  indirectBadge: {
    backgroundColor: '#2E2616',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#574519',
  },
  indirectBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.secondary,
  },
  chartStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  chartStatusLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  timestampText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});
