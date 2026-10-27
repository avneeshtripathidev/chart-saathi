import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  GitFork, ArrowRight, Clock, ShieldCheck, ChevronDown, ChevronUp,
  SlidersHorizontal, X, Sparkles, MapPin, Train,
} from 'lucide-react-native';
import { GlassPanel } from './GlassPanel';
import { colors, spacing, borderRadius } from '../utils/theme';
import type { AlternativeRoute, TrainClass, RouteFilterOptions } from '../types';
import { getAlternativeRoutes } from '../api/alternativeRoutes';

interface AlternativeRouteExplorerProps {
  boardingCode: string;
  destinationCode: string;
  journeyDate: string;
  preferredClass?: TrainClass;
}

export function AlternativeRouteExplorer({
  boardingCode,
  destinationCode,
  journeyDate,
  preferredClass,
}: AlternativeRouteExplorerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Filter & sort state
  const [filters, setFilters] = useState<RouteFilterOptions>({
    maxTransfers: 'all',
    trainClass: preferredClass ?? 'all',
    sortBy: 'fastest',
  });
  const [showFilterToolbar, setShowFilterToolbar] = useState(false);

  // Load alternative routes
  const allRoutes = useMemo(() => {
    return getAlternativeRoutes(boardingCode, destinationCode, journeyDate, preferredClass);
  }, [boardingCode, destinationCode, journeyDate, preferredClass]);

  // Apply filters and sorting
  const filteredRoutes = useMemo(() => {
    let result = [...allRoutes];

    if (filters.maxTransfers !== 'all') {
      result = result.filter((r) => r.transferCount === filters.maxTransfers);
    }

    if (filters.trainClass !== 'all') {
      result = result.filter((r) =>
        r.legs.some((l) => l.trainClass === filters.trainClass)
      );
    }

    if (filters.sortBy === 'fastest') {
      result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (filters.sortBy === 'transfers') {
      result.sort((a, b) => a.transferCount - b.transferCount);
    } else if (filters.sortBy === 'vacancy') {
      result.sort((a, b) => b.totalVacant - a.totalVacant);
    }

    return result;
  }, [allRoutes, filters]);

  const activeFilterCount =
    (filters.maxTransfers !== 'all' ? 1 : 0) +
    (filters.trainClass !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'fastest' ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({
      maxTransfers: 'all',
      trainClass: 'all',
      sortBy: 'fastest',
    });
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Main Entry Card ──────────────────────────────── */}
      <GlassPanel elevated style={styles.entryCard}>
        <View style={styles.entryHeaderRow}>
          <View style={styles.connectingBadge}>
            <GitFork size={12} color={colors.brand.secondary} />
            <Text style={styles.connectingBadgeText}>CONNECTING JOURNEYS</Text>
          </View>
          <View style={styles.smartBadge}>
            <Sparkles size={11} color={colors.brand.primary} />
            <Text style={styles.smartBadgeText}>Split Vacancy Search</Text>
          </View>
        </View>

        <Text style={styles.entryTitle}>Can't Find a Direct Route?</Text>
        <Text style={styles.entrySubtitle}>
          Discover alternative connecting trains with confirmed chart vacancies to reach {destinationCode}.
        </Text>

        {/* Route Illustration: MMCT ━━━ BRC ━━━ KOTA ━━━ NDLS */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.illustrationTrack}>
            <View style={styles.nodeWrapper}>
              <View style={[styles.nodeCircle, styles.nodeOrigin]}>
                <View style={styles.nodeCore} />
              </View>
              <Text style={styles.nodeLabel}>{boardingCode}</Text>
            </View>

            <View style={styles.linkLine} />

            <View style={styles.nodeWrapper}>
              <View style={[styles.nodeCircle, styles.nodeVia]}>
                <View style={styles.nodeCore} />
              </View>
              <Text style={styles.nodeLabel}>BRC</Text>
            </View>

            <View style={styles.linkLine} />

            <View style={styles.nodeWrapper}>
              <View style={[styles.nodeCircle, styles.nodeVia]}>
                <View style={styles.nodeCore} />
              </View>
              <Text style={styles.nodeLabel}>KOTA</Text>
            </View>

            <View style={styles.linkLine} />

            <View style={styles.nodeWrapper}>
              <View style={[styles.nodeCircle, styles.nodeDest]}>
                <View style={styles.nodeCore} />
              </View>
              <Text style={[styles.nodeLabel, { color: colors.brand.primary }]}>{destinationCode}</Text>
            </View>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.exploreCtaBtn}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Explore Alternative Routes"
        >
          <Text style={styles.exploreCtaText}>
            {isExpanded ? 'Hide Alternative Routes' : 'Explore Alternative Routes'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={18} color={colors.white} />
          ) : (
            <ArrowRight size={18} color={colors.white} />
          )}
        </TouchableOpacity>
      </GlassPanel>

      {/* ── 2. Expanded Explorer Section ────────────────────── */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          {/* Toolbar Header: Count & Filter toggle */}
          <View style={styles.toolbarRow}>
            <View>
              <Text style={styles.resultsCountTitle}>
                {filteredRoutes.length} Alternative {filteredRoutes.length === 1 ? 'Route' : 'Routes'}
              </Text>
              <Text style={styles.resultsCountSubtitle}>
                Verified multi-leg post-chart itineraries
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.filterToggleBtn,
                showFilterToolbar && styles.filterToggleBtnActive,
              ]}
              onPress={() => setShowFilterToolbar(!showFilterToolbar)}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={14} color={showFilterToolbar ? colors.white : colors.text.secondary} />
              <Text
                style={[
                  styles.filterToggleText,
                  showFilterToolbar && styles.filterToggleTextActive,
                ]}
              >
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Functional Filter Panel (when toggled) */}
          {showFilterToolbar && (
            <GlassPanel style={styles.filterCard}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>CONNECTIONS</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'All Transfers', val: 'all' },
                    { label: '1 Transfer', val: 1 },
                    { label: '2 Transfers', val: 2 },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={String(opt.val)}
                      style={[
                        styles.filterChip,
                        filters.maxTransfers === opt.val && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, maxTransfers: opt.val as any })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.maxTransfers === opt.val && styles.filterChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>SORT CRITERIA</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: '⚡ Fastest', val: 'fastest' },
                    { label: 'Fewest Transfers', val: 'transfers' },
                    { label: 'Highest Vacancy', val: 'vacancy' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.val}
                      style={[
                        styles.filterChip,
                        filters.sortBy === opt.val && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, sortBy: opt.val as any })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.sortBy === opt.val && styles.filterChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={clearAllFilters}
                >
                  <X size={12} color={colors.brand.primary} />
                  <Text style={styles.clearFiltersText}>Reset all filters</Text>
                </TouchableOpacity>
              )}
            </GlassPanel>
          )}

          {/* ── 3. Connecting Route Cards ─────────────────────── */}
          {filteredRoutes.length === 0 ? (
            <GlassPanel style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>No routes match your filters</Text>
              <Text style={styles.emptyCardSub}>Try resetting the connection or class filters.</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={clearAllFilters}>
                <Text style={styles.resetBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </GlassPanel>
          ) : (
            filteredRoutes.map((route) => {
              const isDetailsOpen = expandedRouteId === route.id;
              return (
                <GlassPanel
                  key={route.id}
                  style={styles.routeCard}
                >
                  {/* Card Header */}
                  <View style={styles.routeCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.routeTitleRow}>
                        <Text style={styles.routeTitle}>{route.title}</Text>
                        {route.tags.map((tag) => (
                          <View
                            key={tag}
                            style={[
                              styles.routeTagBadge,
                              tag === 'Fastest' && styles.routeTagFastest,
                            ]}
                          >
                            <Text
                              style={[
                                styles.routeTagText,
                                tag === 'Fastest' && styles.routeTagFastestText,
                              ]}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.viaSummaryText}>{route.viaSummary}</Text>
                    </View>

                    <View style={styles.durationPill}>
                      <Clock size={12} color={colors.text.secondary} />
                      <Text style={styles.durationText}>{route.totalDuration}</Text>
                    </View>
                  </View>

                  {/* Route Timeline with structured train legs & transfer layovers */}
                  <View style={styles.timelineContainer}>
                    {route.legs.map((leg, legIdx) => {
                      const transfer = route.transfers[legIdx];
                      return (
                        <View key={`${leg.trainNumber}-${legIdx}`}>
                          {/* Train Leg */}
                          <View style={styles.legCard}>
                            <View style={styles.legLeftIndicator}>
                              <View style={styles.legDot} />
                              <View style={styles.legConnectingLine} />
                            </View>

                            <View style={styles.legContent}>
                              {/* Leg Route: From ➔ To */}
                              <View style={styles.legRouteHeader}>
                                <Text style={styles.legStationText}>
                                  {leg.fromStation.code} → {leg.toStation.code}
                                </Text>
                                <View style={styles.legClassPill}>
                                  <Text style={styles.legClassText}>{leg.trainClass}</Text>
                                </View>
                              </View>

                              {/* Train Name & Number */}
                              <Text style={styles.legTrainInfo} numberOfLines={1}>
                                #{leg.trainNumber} · {leg.trainName}
                              </Text>

                              {/* Timings */}
                              <View style={styles.legTimingRow}>
                                <Text style={styles.timeValue}>{leg.departureTime}</Text>
                                <Text style={styles.timeArrow}>── {leg.duration} ──</Text>
                                <Text style={styles.timeValue}>{leg.arrivalTime}</Text>
                              </View>

                              {/* Verified Vacancy */}
                              <View style={styles.legVacancyBadge}>
                                <ShieldCheck size={12} color="#22C55E" />
                                <Text style={styles.legVacancyText}>
                                  {leg.vacantBerths} berths vacant · Chart Prepared
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Transfer Layover Section */}
                          {transfer && (
                            <View style={styles.transferSection}>
                              <View style={styles.transferIconWrapper}>
                                <GitFork size={12} color={colors.brand.secondary} />
                              </View>
                              <View style={styles.transferTextBox}>
                                <Text style={styles.transferStationName}>
                                  {transfer.station.name} ({transfer.station.code})
                                </Text>
                                <Text style={styles.transferWaitText}>
                                  Change trains · {transfer.waitTime}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Expandable Route Details */}
                  {isDetailsOpen && (
                    <View style={styles.detailsPanel}>
                      <Text style={styles.detailsPanelHeader}>Transfer Guide & Platform Advice</Text>
                      <Text style={styles.detailsPanelBody}>
                        • Ample buffer time for cross-platform interchange at junction stations.{'\n'}
                        • Both legs operate with confirmed post-chart unreserved vacancies.{'\n'}
                        • Present your PNR or book unreserved slip at the TTE junction desk.
                      </Text>
                    </View>
                  )}

                  {/* Card Footer */}
                  <View style={styles.routeCardFooter}>
                    <View style={styles.footerVacantInfo}>
                      <Text style={styles.totalVacantLabel}>COMBINED VACANCY</Text>
                      <Text style={styles.totalVacantNumber}>
                        {route.totalVacant} Berths Available
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.detailsToggleBtn}
                      onPress={() =>
                        setExpandedRouteId(isDetailsOpen ? null : route.id)
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsToggleText}>
                        {isDetailsOpen ? 'Hide Details' : 'View Details'}
                      </Text>
                      {isDetailsOpen ? (
                        <ChevronUp size={14} color={colors.brand.primary} />
                      ) : (
                        <ChevronDown size={14} color={colors.brand.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </GlassPanel>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  // ── 1. Main Entry Card ────────────────────────────────
  entryCard: {
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2D2516',
    borderWidth: 1,
    borderColor: '#5C4718',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  connectingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brand.secondary,
    letterSpacing: 0.5,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#351F24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#5C2D37',
  },
  smartBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  entrySubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 17,
    marginBottom: 16,
  },

  // ── Illustration Track ────────────────────────────────
  illustrationWrapper: {
    backgroundColor: '#1E1D22',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#302D37',
    marginBottom: 16,
  },
  illustrationTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeWrapper: {
    alignItems: 'center',
    minWidth: 42,
  },
  nodeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nodeCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  nodeOrigin: {
    backgroundColor: colors.brand.secondary,
  },
  nodeVia: {
    backgroundColor: '#57525E',
  },
  nodeDest: {
    backgroundColor: colors.brand.primary,
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.primary,
  },
  linkLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3D3945',
    marginHorizontal: 4,
    marginBottom: 16,
  },

  exploreCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand.primary, // Solid Coral CTA
    borderRadius: 14,
    paddingVertical: 13,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  exploreCtaText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },

  // ── 2. Expanded Explorer Section ──────────────────────
  expandedSection: {
    marginTop: 14,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCountTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  resultsCountSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27252A',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#393640',
  },
  filterToggleBtnActive: {
    backgroundColor: colors.brand.wine,
    borderColor: colors.brand.wine,
  },
  filterToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  filterToggleTextActive: {
    color: colors.white,
  },

  // ── Filter Card ───────────────────────────────────────
  filterCard: {
    padding: 14,
    marginBottom: 14,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brand.roseStone,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#1E1D22',
    borderWidth: 1,
    borderColor: '#33303A',
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#302D36',
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },

  // ── 3. Route Cards ────────────────────────────────────
  routeCard: {
    padding: 16,
    marginBottom: 14,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  routeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  routeTagBadge: {
    backgroundColor: '#302D36',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeTagFastest: {
    backgroundColor: '#2F2615',
    borderColor: '#5C4718',
    borderWidth: 1,
  },
  routeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  routeTagFastestText: {
    color: colors.brand.secondary,
  },
  viaSummaryText: {
    fontSize: 11.5,
    color: colors.text.secondary,
    marginTop: 2,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1D21',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#34313B',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },

  // ── Route Timeline ────────────────────────────────────
  timelineContainer: {
    marginTop: 4,
  },
  legCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1D22',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#302D37',
  },
  legLeftIndicator: {
    alignItems: 'center',
    width: 14,
    marginRight: 8,
    paddingTop: 3,
  },
  legDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  legConnectingLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#3D3945',
    marginVertical: 4,
  },
  legContent: {
    flex: 1,
  },
  legRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  legStationText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  legClassPill: {
    backgroundColor: '#382226',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  legClassText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  legTrainInfo: {
    fontSize: 11.5,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  legTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  timeArrow: {
    fontSize: 10.5,
    color: colors.text.tertiary,
  },
  legVacancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#172B20',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legVacancyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22C55E',
  },

  // ── Transfer Section ──────────────────────────────────
  transferSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  transferIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2F2615',
    borderWidth: 1,
    borderColor: '#5C4718',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferTextBox: {
    flex: 1,
  },
  transferStationName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brand.secondary,
  },
  transferWaitText: {
    fontSize: 10.5,
    color: colors.text.secondary,
  },

  // ── Expandable Details Panel ──────────────────────────
  detailsPanel: {
    backgroundColor: '#1C1B1F',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#302D36',
  },
  detailsPanelHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.brand.secondary,
    marginBottom: 4,
  },
  detailsPanelBody: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 16,
  },

  // ── Route Card Footer ─────────────────────────────────
  routeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#302D36',
  },
  footerVacantInfo: {
    flex: 1,
  },
  totalVacantLabel: {
    fontSize: 9.5,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalVacantNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22C55E',
  },
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#351F24',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#5C2D37',
  },
  detailsToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },

  // Empty state
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 11.5,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  resetBtn: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  resetBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.white,
  },
});
