import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Info } from 'lucide-react-native';
import { useBerths } from '../src/hooks/useChartData';
import { BerthGrid } from '../src/components/BerthGrid';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import type { BerthInfo } from '../src/types';

export default function BerthsScreen() {
  const params = useLocalSearchParams<{
    trainNumber: string;
    date: string;
    boardingStation: string;
    destinationStation: string;
    coachId: string;
    coachClass?: string;
    trainName?: string;
  }>();

  const queryParams = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    coachId: params.coachId,
  };

  const { data: berths = [], isLoading, error, refetch, isRefetching } = useBerths(queryParams);

  const handleBerthPress = (berth: BerthInfo) => {
    const fromCode = berth.vacancySegment?.fromStation.code ?? params.boardingStation;
    const toCode = berth.vacancySegment?.toStation.code ?? params.destinationStation;
    const isFullJourney =
      Boolean(berth.vacancySegment) &&
      fromCode === params.boardingStation &&
      toCode === params.destinationStation;

    router.push({
      pathname: '/berth-detail',
      params: {
        berthNumber: String(berth.berthNumber),
        berthType: berth.berthType,
        status: berth.status,
        coachId: params.coachId,
        coachClass: params.coachClass ?? '',
        trainNumber: params.trainNumber,
        trainName: params.trainName ?? '',
        fromStation: fromCode,
        toStation: toCode,
        isFullJourney: String(isFullJourney),
      },
    });
  };

  const vacantCount = berths.filter((b: BerthInfo) => b.status === 'VACANT').length;
  const partialCount = berths.filter((b: BerthInfo) => b.status === 'PARTIAL').length;
  const occupiedCount = berths.filter((b: BerthInfo) => b.status === 'OCCUPIED').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.coachBadge}>
          <Text style={styles.coachBadgeText}>{params.coachId}</Text>
          {params.coachClass ? (
            <Text style={styles.coachBadgeSub}>{params.coachClass}</Text>
          ) : null}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.trainTitle}>
            {params.trainNumber} {params.trainName ? `· ${params.trainName}` : ''}
          </Text>
          <Text style={styles.routeSubtitle}>
            {params.boardingStation} → {params.destinationStation} · {params.date}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh berths"
        >
          <RefreshCw size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Quick stats strip */}
      {berths.length > 0 && (
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.status.vacant }]}>{vacantCount}</Text>
            <Text style={styles.statLabel}>Vacant</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.status.partial }]}>{partialCount}</Text>
            <Text style={styles.statLabel}>Partial</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.status.occupied }]}>{occupiedCount}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{berths.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Fetching berth vacancy layout...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Failed to load berths</Text>
            <Text style={styles.errorSub}>Could not load berth layout for coach {params.coachId}.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.instructionBanner}>
              <Info size={16} color={colors.brand.primary} />
              <Text style={styles.instructionText}>
                Tap any berth number to view booking segments and full vacancy details.
              </Text>
            </View>
            <BerthGrid berths={berths} onBerthPress={handleBerthPress} />
          </View>
        )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  coachBadge: {
    backgroundColor: colors.brand.wine,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.roseStone,
  },
  coachBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.fontSize.lg,
  },
  coachBadgeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  trainTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  routeSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    marginLeft: spacing.sm,
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  content: {
    paddingVertical: spacing.md,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.secondary,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  instructionText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  centerContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  errorContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.status.occupied,
    marginBottom: spacing.xs,
  },
  errorSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
