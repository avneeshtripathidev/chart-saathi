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
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useCoaches } from '../src/hooks/useChartData';
import { CoachCard } from '../src/components/CoachCard';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import type { TrainClass, CoachInfo } from '../src/types';

const CLASS_OPTIONS: Array<TrainClass | 'ALL'> = ['ALL', '1A', '2A', '3A', 'SL', 'CC', '2S'];

export default function CoachesScreen() {
  const params = useLocalSearchParams<{
    trainNumber: string;
    date: string;
    boardingStation: string;
    destinationStation: string;
    trainName?: string;
    trainClass?: string;
  }>();

  const [selectedClass, setSelectedClass] = useState<TrainClass | 'ALL'>(
    (params.trainClass as TrainClass) || 'ALL',
  );

  const queryParams = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    trainClass: selectedClass === 'ALL' ? undefined : selectedClass,
  };

  const { data: coaches = [], isLoading, error, refetch, isRefetching } = useCoaches(queryParams);

  const filteredCoaches = selectedClass === 'ALL'
    ? coaches
    : coaches.filter((c: CoachInfo) => c.coachClass === selectedClass);

  const handleCoachPress = (coach: CoachInfo) => {
    router.push({
      pathname: '/berths',
      params: {
        trainNumber: params.trainNumber,
        date: params.date,
        boardingStation: params.boardingStation,
        destinationStation: params.destinationStation,
        trainName: params.trainName ?? '',
        coachId: coach.coachId,
        coachClass: coach.coachClass,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Train Header Info */}
      <View style={styles.headerBar}>
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
          accessibilityLabel="Refresh coaches"
        >
          <RefreshCw size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Class filter chips */}
      <View style={styles.classFilterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classScroll}
        >
          {CLASS_OPTIONS.map((cls) => {
            const active = selectedClass === cls;
            return (
              <TouchableOpacity
                key={cls}
                onPress={() => setSelectedClass(cls)}
                style={[styles.classChip, active && styles.classChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by class ${cls}`}
              >
                <Text style={[styles.classChipText, active && styles.classChipTextActive]}>
                  {cls === 'ALL' ? 'All Classes' : cls}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
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
            <Text style={styles.loadingText}>Loading coach vacancy data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Failed to load coaches</Text>
            <Text style={styles.errorSub}>Please check network connectivity and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCoaches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No coaches found</Text>
            <Text style={styles.emptySub}>
              No coaches available for {selectedClass === 'ALL' ? 'this train' : `class ${selectedClass}`}.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>
              Coaches ({filteredCoaches.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap any coach to view berth availability and layout
            </Text>
            <View style={styles.coachesGrid}>
              {filteredCoaches.map((coach: CoachInfo) => (
                <CoachCard
                  key={coach.coachId}
                  coach={coach}
                  onPress={() => handleCoachPress(coach)}
                />
              ))}
            </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerInfo: {
    flex: 1,
  },
  trainTitle: {
    fontSize: typography.fontSize.md,
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
    marginLeft: spacing.md,
  },
  classFilterWrap: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  classScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  classChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  classChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  classChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  coachesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
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
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
