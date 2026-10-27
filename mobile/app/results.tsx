import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react-native';
import { format } from 'date-fns';

import { useChartVacancy } from '../src/hooks/useChartData';
import { DemoBanner } from '../src/components/DemoBanner';
import { SearchResultSkeleton } from '../src/components/Skeleton';
import { GlassPanel } from '../src/components/GlassPanel';
import { JourneySummaryCard } from '../src/components/JourneySummaryCard';
import { VacancyStatCard } from '../src/components/VacancyStatCard';
import { ClassSegmentControl } from '../src/components/ClassSegmentControl';
import { AlternativeRouteExplorer } from '../src/components/AlternativeRouteExplorer';
import { CoachExplorerCard } from '../src/components/CoachExplorerCard';
import { colors, spacing, borderRadius } from '../src/utils/theme';
import type { TrainClass } from '../src/types';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    trainNumber: string;
    trainName: string;
    date: string;
    boardingStation: string;
    destinationStation: string;
    trainClass?: string;
    routeType?: 'DIRECT' | 'INDIRECT';
    viaStation?: string;
  }>();

  const [selectedClass, setSelectedClass] = useState<TrainClass | undefined>(
    params.trainClass ? (params.trainClass as TrainClass) : undefined,
  );

  const queryParams = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    trainClass: selectedClass,
  };

  const { data: response, isLoading, error, refetch, isRefetching } = useChartVacancy(queryParams);
  const vacancy = response?.data;

  const formattedDate = (() => {
    try {
      return format(new Date(params.date), 'dd MMM yyyy');
    } catch {
      return params.date;
    }
  })();

  const formattedFetch = vacancy?.fetchedAt
    ? (() => {
        try {
          return format(new Date(vacancy.fetchedAt), 'dd MMM, hh:mm a');
        } catch {
          return vacancy.fetchedAt;
        }
      })()
    : null;

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SearchResultSkeleton />
          <SearchResultSkeleton />
          <SearchResultSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error || (!isLoading && !response?.success)) {
    const errMsg = response?.error?.message ?? (error as Error)?.message ?? 'Request failed';
    const errCode = response?.error?.code ?? 'NETWORK_ERROR';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <GlassPanel elevated style={styles.errorCard}>
            <AlertCircle size={44} color={colors.brand.primary} />
            <Text style={styles.errorTitle}>
              {errCode === 'CHART_NOT_PREPARED' ? 'Chart Not Prepared Yet' : 'Unable to Fetch Chart Data'}
            </Text>
            <Text style={styles.errorMsg}>{errMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.85}>
              <RefreshCw size={16} color={colors.white} />
              <Text style={styles.retryText}>Retry Inquiry</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      </SafeAreaView>
    );
  }

  const totalVacant = vacancy?.totalVacantBerths;
  const boardingStation = vacancy?.boardingStation ?? {
    code: params.boardingStation,
    name: params.boardingStation,
  };
  const destinationStation = vacancy?.destinationStation ?? {
    code: params.destinationStation,
    name: params.destinationStation,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Freshness / Demo banner */}
        <DemoBanner freshness={vacancy?.freshness} isDemo={vacancy?.isDemo} />

        {/* 1. Redesigned Journey Summary Card */}
        <JourneySummaryCard
          trainNumber={vacancy?.train.trainNumber ?? params.trainNumber}
          trainName={vacancy?.train.trainName ?? params.trainName}
          boardingStation={boardingStation}
          destinationStation={destinationStation}
          formattedDate={formattedDate}
          selectedClass={selectedClass}
          routeType={params.routeType}
          viaStation={params.viaStation}
          chartStatus={vacancy?.chartStatus ?? 'UNKNOWN'}
          formattedFetch={formattedFetch}
        />

        {/* 2. Redesigned Total Vacancy Statistics Card */}
        <VacancyStatCard totalVacant={totalVacant} isLoading={isLoading} />

        {/* 3. Modernized Class Segment Control */}
        <ClassSegmentControl
          availableClasses={vacancy?.availableClasses}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
        />

        {/* 4. Highlight: Alternative Route Explorer (Connecting journeys) */}
        <AlternativeRouteExplorer
          boardingCode={boardingStation.code}
          destinationCode={destinationStation.code}
          journeyDate={params.date}
          preferredClass={selectedClass}
        />

        {/* 5. Coach Explorer & Confirmed Coach Rows */}
        {vacancy && vacancy.coaches && vacancy.coaches.length > 0 && (
          <CoachExplorerCard
            coaches={vacancy.coaches}
            selectedClass={selectedClass}
            onExplorePress={() =>
              router.push({
                pathname: '/coaches',
                params: {
                  ...queryParams,
                  trainName: vacancy?.train.trainName ?? params.trainName,
                  trainClass: selectedClass ?? '',
                },
              })
            }
            onCoachPress={(coachId) =>
              router.push({
                pathname: '/berths',
                params: {
                  ...queryParams,
                  trainName: vacancy?.train.trainName ?? params.trainName,
                  coachId,
                  coachClass: selectedClass ?? '',
                },
              })
            }
          />
        )}

        {/* Disclaimer Note */}
        <View style={styles.disclaimerWrapper}>
          <Text style={styles.disclaimerText}>
            Independent chart vacancy viewer. Information reflects post-chart preparation data and is not an official IRCTC booking confirmation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#19181B', // Deep, clean solid charcoal base
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  scroll: {
    paddingTop: 16,
    paddingBottom: 48,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 12,
    color: colors.brand.roseStone,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    marginTop: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  disclaimerWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(216, 196, 182, 0.06)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(216, 196, 182, 0.12)',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 10.5,
    color: 'rgba(245, 240, 233, 0.55)',
    textAlign: 'center',
    lineHeight: 15,
  },
});
