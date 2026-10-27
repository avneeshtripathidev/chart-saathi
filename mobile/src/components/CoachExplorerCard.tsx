import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, Train, Armchair } from 'lucide-react-native';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, borderRadius } from '../utils/theme';
import type { CoachInfo, TrainClass } from '../types';

interface CoachExplorerCardProps {
  coaches: CoachInfo[];
  selectedClass?: TrainClass;
  onExplorePress: () => void;
  onCoachPress?: (coachId: string) => void;
}

export function CoachExplorerCard({
  coaches,
  selectedClass,
  onExplorePress,
  onCoachPress,
}: CoachExplorerCardProps) {
  const displayedCoaches = coaches.slice(0, 5);
  const remainingCount = coaches.length - displayedCoaches.length;

  return (
    <View style={styles.container}>
      {/* Hero Coach Explorer Banner */}
      <GlassPanel elevated style={styles.bannerCard}>
        <TouchableOpacity
          style={styles.bannerPressable}
          onPress={onExplorePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="View Coach Explorer"
        >
          <View style={styles.bannerIconBox}>
            <Train size={22} color={colors.white} />
          </View>
          <View style={styles.bannerTextBox}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle}>Interactive Coach Explorer</Text>
              <View style={styles.coachCountBadge}>
                <Text style={styles.coachCountText}>{coaches.length} Coaches</Text>
              </View>
            </View>
            <Text style={styles.bannerSubtitle}>
              Browse visual coach layout, unreserved berths & real-time seat positions
            </Text>
          </View>
          <ChevronRight size={20} color={colors.brand.primary} />
        </TouchableOpacity>
      </GlassPanel>

      {/* Quick Coach Rows */}
      {displayedCoaches.length > 0 && (
        <GlassPanel style={styles.coachListCard}>
          <View style={styles.coachListHeader}>
            <Text style={styles.listHeaderTitle}>Confirmed Coaches Summary</Text>
            <Text style={styles.listHeaderSub}>Tap coach for berth map</Text>
          </View>

          {displayedCoaches.map((coach, index) => {
            const hasVacant = (coach.vacantCount ?? 0) > 0;
            return (
              <TouchableOpacity
                key={coach.coachId}
                style={[
                  styles.coachRow,
                  index === displayedCoaches.length - 1 && styles.coachRowLast,
                ]}
                onPress={() => (onCoachPress ? onCoachPress(coach.coachId) : onExplorePress())}
                activeOpacity={0.8}
              >
                {/* Coach ID Badge */}
                <View style={styles.coachIdBadge}>
                  <Text style={styles.coachIdText}>{coach.coachId}</Text>
                </View>

                {/* Class Badge */}
                <View style={styles.classTag}>
                  <Text style={styles.classTagText}>{coach.coachClass}</Text>
                </View>

                <View style={{ flex: 1 }} />

                {/* Vacancy count badge */}
                <View
                  style={[
                    styles.vacancyBadge,
                    {
                      backgroundColor: hasVacant ? '#152C1E' : '#2D1B22',
                      borderColor: hasVacant ? '#255E3A' : '#572935',
                    },
                  ]}
                >
                  <Armchair size={12} color={hasVacant ? '#22C55E' : '#E45F60'} />
                  <Text
                    style={[
                      styles.vacancyBadgeText,
                      { color: hasVacant ? '#22C55E' : colors.text.secondary },
                    ]}
                  >
                    {coach.vacantCount !== null && coach.vacantCount !== undefined
                      ? `${coach.vacantCount} vacant`
                      : 'No data'}
                  </Text>
                </View>

                <ChevronRight size={14} color={colors.text.tertiary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })}

          {remainingCount > 0 && (
            <TouchableOpacity style={styles.viewMoreRow} onPress={onExplorePress}>
              <Text style={styles.viewMoreText}>
                + {remainingCount} more {remainingCount === 1 ? 'coach' : 'coaches'} in Coach Explorer →
              </Text>
            </TouchableOpacity>
          )}
        </GlassPanel>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  bannerCard: {
    padding: 14,
    marginBottom: 12,
  },
  bannerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.wine,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#983D54',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  coachCountBadge: {
    backgroundColor: '#302D36',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coachCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  coachListCard: {
    padding: 14,
  },
  coachListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#302D36',
  },
  listHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  listHeaderSub: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2831',
  },
  coachRowLast: {
    borderBottomWidth: 0,
  },
  coachIdBadge: {
    backgroundColor: '#1E1D22',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#34313B',
    minWidth: 40,
    alignItems: 'center',
  },
  coachIdText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  classTag: {
    marginLeft: 8,
    backgroundColor: '#2E2B33',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3A3642',
  },
  classTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  vacancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  vacancyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewMoreRow: {
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#302D36',
  },
  viewMoreText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
});
