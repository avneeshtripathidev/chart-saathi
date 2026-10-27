import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Train, Search, Calendar, MapPin, Settings, ArrowRight, GitFork, ArrowRightLeft, Plus, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { colors, spacing, borderRadius, typography, shadows } from '../src/utils/theme';
import { useTrainSearch, useStationSearch } from '../src/hooks/useChartData';
import type { RecentSearch, TrainClass } from '../src/types';
import { SEARCH_DEBOUNCE_MS, MAX_RECENT_SEARCHES } from '../src/utils/config';

type RouteType = 'DIRECT' | 'INDIRECT';

interface RecentInquiryItem {
  id: string;
  trainNumber: string;
  trainName: string;
  boarding: string;
  destination: string;
  date: string;
  trainClass: TrainClass;
  vacantCount: number;
  routeType: RouteType;
  viaStation?: string;
}

const getTodayFormatted = () => {
  try {
    return format(new Date(), 'dd MMM yyyy');
  } catch {
    return '26 Oct 2026';
  }
};

const LIVE_POPULAR_INQUIRIES: RecentInquiryItem[] = [
  {
    id: 'live-1',
    trainNumber: '12951',
    trainName: 'NDLS TEJAS RAJ',
    boarding: 'MMCT',
    destination: 'NDLS',
    date: getTodayFormatted(),
    trainClass: '3A',
    vacantCount: 33,
    routeType: 'DIRECT',
  },
  {
    id: 'live-2',
    trainNumber: '12301',
    trainName: 'RAJDHANI EXPRES',
    boarding: 'HWH',
    destination: 'NDLS',
    date: getTodayFormatted(),
    trainClass: '3A',
    vacantCount: 18,
    routeType: 'DIRECT',
  },
  {
    id: 'live-3',
    trainNumber: '12002',
    trainName: 'SHATABDI EXPRES',
    boarding: 'NDLS',
    destination: 'RKMP',
    date: getTodayFormatted(),
    trainClass: 'CC',
    vacantCount: 14,
    routeType: 'DIRECT',
  },
  {
    id: 'live-4',
    trainNumber: '22692',
    trainName: 'SBC RAJDHANI',
    boarding: 'NZM',
    destination: 'SBC',
    date: getTodayFormatted(),
    trainClass: '2A',
    vacantCount: 9,
    routeType: 'INDIRECT',
    viaStation: 'Via NGP',
  },
];

function normalizeDate(d: string): string {
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return trimmed;
}

export default function HomeScreen() {
  const [trainQuery, setTrainQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState<{ number: string; name: string } | null>(null);
  const [date, setDate] = useState(getTodayFormatted);
  const [boarding, setBoarding] = useState('');
  const [destination, setDestination] = useState('');
  const [showDestination, setShowDestination] = useState(false);
  const [routeType, setRouteType] = useState<RouteType>('DIRECT');
  const [viaStation, setViaStation] = useState('');
  const [trainClass, setTrainClass] = useState<TrainClass | undefined>(undefined);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [debouncedBoarding, setDebouncedBoarding] = useState('');
  const [debouncedDestination, setDebouncedDestination] = useState('');

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceBoardingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceDestRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: trainResults, isLoading: searchLoading } = useTrainSearch(debouncedQuery);
  const { data: boardingStationResults, isLoading: boardingStationLoading } = useStationSearch(debouncedBoarding);
  const { data: destinationStationResults, isLoading: destStationLoading } = useStationSearch(debouncedDestination);

  React.useEffect(() => {
    AsyncStorage.getItem('recent_searches')
      .then((raw) => raw && setRecentSearches(JSON.parse(raw) as RecentSearch[]))
      .catch(() => null);
  }, []);

  const handleTrainInput = useCallback((text: string) => {
    setTrainQuery(text);
    setSelectedTrain(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text), SEARCH_DEBOUNCE_MS);
  }, []);

  const handleBoardingInput = useCallback((text: string) => {
    setBoarding(text);
    if (debounceBoardingRef.current) clearTimeout(debounceBoardingRef.current);
    debounceBoardingRef.current = setTimeout(() => setDebouncedBoarding(text), 300);
  }, []);

  const handleDestinationInput = useCallback((text: string) => {
    setDestination(text);
    if (debounceDestRef.current) clearTimeout(debounceDestRef.current);
    debounceDestRef.current = setTimeout(() => setDebouncedDestination(text), 300);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    const normDate = normalizeDate(date);

    const resolvedBoarding = (() => {
      const b = boarding.trim().toUpperCase();
      if (b.length > 5 && boardingStationResults && boardingStationResults.length > 0) {
        return boardingStationResults[0].code;
      }
      return b;
    })();

    if (!selectedTrain && !trainQuery.match(/^\d{4,6}$/)) {
      errs.train = 'Select a train or enter valid train number';
    }
    if (!normDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errs.date = 'Enter date like 25 Oct 2026 or YYYY-MM-DD';
    }
    if (!resolvedBoarding.match(/^[A-Za-z0-9\s]{2,30}$/)) {
      errs.boarding = 'Enter departure station code or name (e.g. MMCT or GOY)';
    }

    const destActive = (showDestination || routeType === 'INDIRECT') && destination.trim().length > 0;
    if (destActive) {
      const resolvedDest = (() => {
        const d = destination.trim().toUpperCase();
        if (d.length > 5 && destinationStationResults && destinationStationResults.length > 0) {
          return destinationStationResults[0].code;
        }
        return d;
      })();
      if (!resolvedDest.match(/^[A-Za-z0-9\s]{2,30}$/)) {
        errs.destination = 'Valid station code (e.g. NDLS)';
      } else if (resolvedBoarding === resolvedDest) {
        errs.destination = 'Boarding & destination cannot match';
      }
    }

    if (routeType === 'INDIRECT') {
      if (!destination.trim().match(/^[A-Za-z0-9\s]{2,30}$/)) {
        errs.destination = 'Destination required for indirect route';
      }
      if (!viaStation.trim().match(/^[A-Za-z]{2,7}$/)) {
        errs.via = 'Enter valid via station (e.g. BRC)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSearch = async () => {
    if (!validate()) return;

    const normDate = normalizeDate(date);
    const trainNum = selectedTrain?.number ?? trainQuery.split('—')[0].trim();
    const trainNm = selectedTrain?.name ?? `Train ${trainNum}`;
    const destActive = (showDestination || routeType === 'INDIRECT') && destination.trim().length > 0;
    
    let boardingCode = boarding.trim().toUpperCase();
    if (boardingCode.length > 5 && boardingStationResults && boardingStationResults.length > 0) {
      boardingCode = boardingStationResults[0].code;
    }
    
    let destCode = 'ALL';
    if (destActive) {
      destCode = destination.trim().toUpperCase();
      if (destCode.length > 5 && destinationStationResults && destinationStationResults.length > 0) {
        destCode = destinationStationResults[0].code;
      }
    }

    const params = {
      trainNumber: trainNum,
      trainName: trainNm,
      date: normDate,
      boardingStation: boardingCode,
      destinationStation: destCode,
      trainClass,
      routeType,
      viaStation: routeType === 'INDIRECT' ? viaStation.trim().toUpperCase() : '',
    };

    const newRecent: RecentSearch = {
      id: Date.now().toString(),
      searchedAt: new Date().toISOString(),
      trainNumber: params.trainNumber,
      trainName: params.trainName,
      date: params.date,
      boardingStation: params.boardingStation,
      destinationStation: params.destinationStation,
      trainClass: params.trainClass,
    };
    const updated = [newRecent, ...recentSearches.filter((r) => r.trainNumber !== params.trainNumber)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));

    router.push({
      pathname: '/results',
      params,
    });
  };

  const selectInquiry = (item: RecentInquiryItem) => {
    setSelectedTrain({ number: item.trainNumber, name: item.trainName });
    setTrainQuery(`${item.trainNumber} — ${item.trainName}`);
    setBoarding(item.boarding);
    if (item.destination && item.destination !== 'ALL') {
      setShowDestination(true);
      setDestination(item.destination);
    } else {
      setShowDestination(false);
      setDestination('');
    }
    setDate(item.date || getTodayFormatted());
    setTrainClass(item.trainClass);
    setRouteType(item.routeType);
    if (item.viaStation) {
      setViaStation(item.viaStation.replace('Via ', '').trim());
    }
  };

  const showSuggestions = debouncedQuery.length >= 2 && !selectedTrain && (trainResults?.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Train size={22} color={colors.text.primary} />
              </View>
              <View>
                <Text style={styles.appName}>ChartSaathi</Text>
                <Text style={styles.appSubtitle}>Post-Chart Vacancy Explorer</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsBtn}
              accessibilityLabel="Open Settings"
              activeOpacity={0.8}
            >
              <Settings size={18} color={colors.brand.roseStone} />
            </TouchableOpacity>
          </View>

          {/* Hero Search Card */}
          <View style={styles.heroCard}>
            {/* Train Input */}
            <Text style={styles.cardSectionLabel}>Train Number or Name</Text>
            <View style={styles.inputWrapper}>
              <Search size={18} color={colors.brand.roseStone} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 12951 or Rajdhani"
                placeholderTextColor="rgba(245, 240, 233, 0.4)"
                value={trainQuery}
                onChangeText={handleTrainInput}
                autoCapitalize="characters"
                accessibilityLabel="Train number or name search"
              />
              {searchLoading && <ActivityIndicator size="small" color={colors.brand.primary} />}
            </View>
            {errors.train ? <Text style={styles.errorText}>{errors.train}</Text> : null}

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <View style={styles.suggestions}>
                {trainResults!.map((t) => (
                  <TouchableOpacity
                    key={t.trainNumber}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedTrain({ number: t.trainNumber, name: t.trainName });
                      setTrainQuery(`${t.trainNumber} — ${t.trainName}`);
                      if (t.source?.code) setBoarding(t.source.code);
                      if (t.destination?.code) setDestination(t.destination.code);
                      setDebouncedQuery('');
                    }}
                  >
                    <Text style={styles.suggestionNumber}>{t.trainNumber}</Text>
                    <Text style={styles.suggestionName}>{t.trainName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Direct vs Indirect Route Switcher */}
            <View style={styles.routeTypeSegmentRow}>
              <TouchableOpacity
                style={[styles.routeTypePill, routeType === 'DIRECT' && styles.routeTypePillActive]}
                onPress={() => setRouteType('DIRECT')}
                activeOpacity={0.85}
              >
                <View style={[styles.routeTypeDot, routeType === 'DIRECT' && styles.routeTypeDotActive]} />
                <Text style={[styles.routeTypePillText, routeType === 'DIRECT' && styles.routeTypePillTextActive]}>
                  Direct Route
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.routeTypePill, routeType === 'INDIRECT' && styles.routeTypePillIndirectActive]}
                onPress={() => setRouteType('INDIRECT')}
                activeOpacity={0.85}
              >
                <GitFork size={13} color={routeType === 'INDIRECT' ? colors.brand.secondary : colors.brand.roseStone} style={{ marginRight: 4 }} />
                <Text style={[styles.routeTypePillText, routeType === 'INDIRECT' && styles.routeTypePillTextIndirectActive]}>
                  Indirect / Split
                </Text>
              </TouchableOpacity>
            </View>

            {/* Departure Station & Optional Destination */}
            {(!showDestination && routeType === 'DIRECT') ? (
              <View style={styles.singleDepartureCard}>
                <View style={styles.stationHeaderRow}>
                  <View style={styles.labelWithIcon}>
                    <MapPin size={12} color={colors.brand.roseStone} />
                    <Text style={styles.miniLabel} numberOfLines={1}>DEPARTURE STATION</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addDestinationBtn}
                    onPress={() => setShowDestination(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Plus size={11} color={colors.brand.primary} />
                    <Text style={styles.addDestinationBtnText}>+ Destination</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.singleStationInputBox}>
                  <TextInput
                    style={styles.singleStationInput}
                    placeholder="e.g. Govindpuri, MMCT, NDLS"
                    placeholderTextColor="rgba(245, 240, 233, 0.4)"
                    value={boarding}
                    onChangeText={handleBoardingInput}
                    autoCapitalize="characters"
                    maxLength={30}
                  />
                  {boardingStationLoading && (
                    <ActivityIndicator size="small" color={colors.brand.primary} style={{ marginLeft: 8 }} />
                  )}
                </View>

                {/* Live Station Autocomplete Dropdown */}
                {debouncedBoarding.trim().length >= 2 && (boardingStationResults?.length ?? 0) > 0 && (
                  <View style={styles.stationSuggestions}>
                    <Text style={styles.stationSuggestionsHeader}>STATION SUGGESTIONS</Text>
                    {boardingStationResults!.slice(0, 5).map((stn) => (
                      <TouchableOpacity
                        key={stn.code}
                        style={styles.stationSuggestionItem}
                        onPress={() => {
                          setBoarding(stn.code);
                          setDebouncedBoarding('');
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.stationCodeBadge}>
                          <Text style={styles.stationCodeBadgeText}>{stn.code}</Text>
                        </View>
                        <Text style={styles.stationNameText} numberOfLines={1}>
                          {stn.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.departureHintRow}>
                  <Text style={styles.departureHintText}>
                    ⚡ Shows all vacant berths across entire train route from this departure station
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.routeSection}>
                <View style={styles.routeField}>
                  <Text style={styles.miniLabel}>FROM (DEPARTURE)</Text>
                  <View style={styles.stationInputBox}>
                    <MapPin size={15} color={colors.brand.roseStone} />
                    <TextInput
                      style={styles.stationInput}
                      placeholder="MMCT / Station"
                      placeholderTextColor="rgba(245, 240, 233, 0.4)"
                      value={boarding}
                      onChangeText={handleBoardingInput}
                      autoCapitalize="characters"
                      maxLength={30}
                    />
                    {boardingStationLoading && (
                      <ActivityIndicator size="small" color={colors.brand.primary} />
                    )}
                  </View>
                  {debouncedBoarding.trim().length >= 2 && (boardingStationResults?.length ?? 0) > 0 && (
                    <View style={styles.dualStationSuggestions}>
                      {boardingStationResults!.slice(0, 4).map((stn) => (
                        <TouchableOpacity
                          key={stn.code}
                          style={styles.stationSuggestionItem}
                          onPress={() => {
                            setBoarding(stn.code);
                            setDebouncedBoarding('');
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.stationCodeBadge}>
                            <Text style={styles.stationCodeBadgeText}>{stn.code}</Text>
                          </View>
                          <Text style={styles.stationNameText} numberOfLines={1}>
                            {stn.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Stylized route connector (Direct or Indirect / Via Station) */}
                {routeType === 'DIRECT' ? (
                  <View style={styles.routeConnector}>
                    <View style={styles.connectorDot} />
                    <View style={styles.connectorLine}>
                      <View style={styles.trainIconBubble}>
                        <Train size={12} color={colors.brand.primary} />
                      </View>
                    </View>
                    <View style={[styles.connectorDot, styles.connectorDotEnd]} />
                  </View>
                ) : (
                  <View style={styles.indirectRouteConnector}>
                    <View style={styles.connectorDot} />
                    <View style={styles.indirectLineSegment} />
                    <View style={styles.viaBadgeBox}>
                      <Text style={styles.viaTagText}>VIA</Text>
                      <TextInput
                        style={styles.viaInput}
                        placeholder="BRC"
                        placeholderTextColor="rgba(232, 185, 67, 0.6)"
                        value={viaStation}
                        onChangeText={setViaStation}
                        autoCapitalize="characters"
                        maxLength={7}
                      />
                    </View>
                    <View style={styles.indirectLineSegment} />
                    <View style={[styles.connectorDot, styles.connectorDotEnd]} />
                  </View>
                )}

                <View style={styles.routeField}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.miniLabel}>TO (DESTINATION)</Text>
                    {routeType === 'DIRECT' && (
                      <TouchableOpacity
                        onPress={() => {
                          setShowDestination(false);
                          setDestination('');
                          setDebouncedDestination('');
                        }}
                        style={styles.removeDestBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Remove destination"
                      >
                        <X size={11} color={colors.brand.roseStone} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.stationInputBox}>
                    <MapPin size={15} color={colors.brand.primary} />
                    <TextInput
                      style={styles.stationInput}
                      placeholder="NDLS / Station"
                      placeholderTextColor="rgba(245, 240, 233, 0.4)"
                      value={destination}
                      onChangeText={handleDestinationInput}
                      autoCapitalize="characters"
                      maxLength={30}
                    />
                    {destStationLoading && (
                      <ActivityIndicator size="small" color={colors.brand.primary} />
                    )}
                  </View>
                  {debouncedDestination.trim().length >= 2 && (destinationStationResults?.length ?? 0) > 0 && (
                    <View style={styles.dualStationSuggestions}>
                      {destinationStationResults!.slice(0, 4).map((stn) => (
                        <TouchableOpacity
                          key={stn.code}
                          style={styles.stationSuggestionItem}
                          onPress={() => {
                            setDestination(stn.code);
                            setDebouncedDestination('');
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.stationCodeBadge}>
                            <Text style={styles.stationCodeBadgeText}>{stn.code}</Text>
                          </View>
                          <Text style={styles.stationNameText} numberOfLines={1}>
                            {stn.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
            {errors.boarding ? <Text style={styles.errorText}>{errors.boarding}</Text> : null}
            {errors.destination ? <Text style={styles.errorText}>{errors.destination}</Text> : null}
            {errors.via ? <Text style={styles.errorText}>{errors.via}</Text> : null}

            {/* Route Status Tagline */}
            <View style={styles.routeStatusNote}>
              {routeType === 'DIRECT' ? (
                <Text style={styles.routeStatusNoteText}>
                  ✨ <Text style={{ color: colors.status.vacant, fontWeight: '700' }}>Direct Route</Text> · {!showDestination ? 'All downstream vacant berths' : 'Continuous end-to-end berth'}
                </Text>
              ) : (
                <Text style={styles.routeStatusNoteText}>
                  ⚡ <Text style={{ color: colors.brand.secondary, fontWeight: '700' }}>Indirect / Split Vacancy</Text> · Connecting via {viaStation || 'Intermediate'}
                </Text>
              )}
            </View>

            {/* Row with Date Picker & Class Selector Chips */}
            <View style={styles.dateClassRow}>
              <View style={styles.dateBoxWrapper}>
                <Text style={styles.miniLabel}>DATE</Text>
                <View style={styles.dateInputBox}>
                  <Calendar size={15} color={colors.brand.roseStone} />
                  <TextInput
                    style={styles.dateInput}
                    placeholder={getTodayFormatted()}
                    placeholderTextColor="rgba(245, 240, 233, 0.4)"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>
            </View>
            {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

            {/* Class Selector Chips: 3A, 2A, SL, CC styled in Rose Stone pill chips with Coral active state */}
            <View style={styles.classChipsSection}>
              <Text style={styles.miniLabel}>TRAVEL CLASS</Text>
              <View style={styles.chipsRow}>
                {(['3A', '2A', 'SL', 'CC'] as TrainClass[]).map((cls) => {
                  const isActive = trainClass === cls;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.classPill, isActive && styles.classPillActive]}
                      onPress={() => setTrainClass(isActive ? undefined : cls)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.classPillText, isActive && styles.classPillTextActive]}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Primary Search CTA Button: Full-width Coral with bold text and subtle drop shadow */}
            <TouchableOpacity
              style={styles.searchCtaBtn}
              onPress={handleSearch}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Search size={18} color={colors.white} />
              <Text style={styles.searchCtaText} numberOfLines={1}>
                {routeType === 'INDIRECT'
                  ? 'Search Indirect Vacancies'
                  : (!showDestination ? 'Search Vacant Berths' : 'Search Direct Vacancies')}
              </Text>
              <ArrowRight size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Live Status & Recent Searches Section */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent Inquiries</Text>
              <Text style={styles.recentSubtitle}>Direct & Indirect Routes</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalInquiryList}
            >
              {(recentSearches.length > 0
                ? recentSearches.map((s, idx) => ({
                    id: s.id || `search-${idx}`,
                    trainNumber: s.trainNumber,
                    trainName: s.trainName,
                    boarding: s.boardingStation,
                    destination: s.destinationStation,
                    date: s.date,
                    trainClass: (s.trainClass as TrainClass) || '3A',
                    vacantCount: 15,
                    routeType: 'DIRECT' as RouteType,
                    viaStation: undefined as string | undefined,
                  }))
                : LIVE_POPULAR_INQUIRIES
              ).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.inquiryCard}
                  onPress={() => selectInquiry(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.inquiryTopRow}>
                    <View style={styles.wineHeaderBadge}>
                      <Text style={styles.wineBadgeText}>{item.trainNumber}</Text>
                    </View>
                    <View style={styles.marigoldVacancyBadge}>
                      <Text style={styles.marigoldVacancyText}>{item.vacantCount} Vacant</Text>
                    </View>
                  </View>

                  <Text style={styles.inquiryTrainName} numberOfLines={1}>
                    {item.trainName}
                  </Text>

                  {/* Direct / Indirect Route Badge */}
                  <View style={styles.inquiryRouteTypeRow}>
                    {item.routeType === 'DIRECT' ? (
                      <View style={styles.directPillBadge}>
                        <View style={styles.directSmallDot} />
                        <Text style={styles.directPillText}>Direct Route</Text>
                      </View>
                    ) : (
                      <View style={styles.indirectPillBadge}>
                        <Text style={styles.indirectPillText}>⚡ {item.viaStation ?? 'Indirect'}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inquiryRouteRow}>
                    <Text style={styles.inquiryRouteText}>
                      {item.boarding} → {item.destination}
                    </Text>
                    <View style={styles.inquiryClassTag}>
                      <Text style={styles.inquiryClassText}>{item.trainClass}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Disclaimer Pill at bottom */}
          <View style={styles.disclaimerPill}>
            <Text style={styles.disclaimerText}>
              Independent chart viewer. Not official IRCTC ticket booking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#19181B', // Deep solid charcoal base
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  scroll: {
    paddingBottom: 28,
  },
  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    backgroundColor: colors.brand.wine, // Wine Red (#7E3044)
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#983D54',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#242227',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#36333D',
  },

  // ── Hero Search Card ────────────────────────────────────
  heroCard: {
    backgroundColor: '#242227', // Crisp solid elevated card surface
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#36333D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  cardSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.brand.roseStone,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34313B',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: colors.brand.primary,
    marginTop: 5,
    fontWeight: '600',
  },
  suggestions: {
    backgroundColor: '#1E1D21',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#34313B',
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2831',
  },
  suggestionNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  suggestionName: {
    fontSize: 12,
    color: colors.text.primary,
    marginTop: 2,
  },

  // ── Direct / Indirect Route Switcher ────────────────────
  routeTypeSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1D21',
    borderRadius: 12,
    padding: 3,
    marginTop: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#34313B',
  },
  routeTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  routeTypePillActive: {
    backgroundColor: colors.brand.wine,
    shadowColor: colors.brand.wine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  routeTypePillIndirectActive: {
    backgroundColor: '#2F2615',
    borderWidth: 1,
    borderColor: '#5C4718',
  },
  routeTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.tertiary,
    marginRight: 6,
  },
  routeTypeDotActive: {
    backgroundColor: colors.status.vacant,
  },
  routeTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  routeTypePillTextActive: {
    color: colors.text.primary,
  },
  routeTypePillTextIndirectActive: {
    color: colors.brand.secondary,
  },

  // ── Single Departure Card (Departure-First Mode) ────────
  singleDepartureCard: {
    marginTop: 10,
    backgroundColor: '#1E1D21',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#34313B',
  },
  stationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  addDestinationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(228, 95, 96, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(228, 95, 96, 0.4)',
    flexShrink: 0,
  },
  addDestinationBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  singleStationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  singleStationInput: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    padding: 0,
  },
  departureHintRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#28252E',
  },
  departureHintText: {
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 14,
  },
  removeDestBtn: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // ── Route Section (MMCT ─── [Train] ─── NDLS) ────────────
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: '#1E1D21',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#34313B',
  },
  routeField: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brand.roseStone,
    letterSpacing: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stationInput: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    padding: 0,
    minWidth: 50,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.secondary,
  },
  connectorDotEnd: {
    backgroundColor: colors.brand.primary,
  },
  connectorLine: {
    width: 50,
    height: 1.5,
    backgroundColor: '#3E3A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainIconBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#28262C',
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Indirect Route Connector (with VIA Station) ─────────
  indirectRouteConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  indirectLineSegment: {
    width: 14,
    height: 1.5,
    backgroundColor: colors.brand.secondary,
  },
  viaBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F2615',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#5C4718',
    gap: 3,
  },
  viaTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.secondary,
  },
  viaInput: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.secondary,
    padding: 0,
    minWidth: 32,
    textAlign: 'center',
  },

  routeStatusNote: {
    marginTop: 8,
    alignItems: 'center',
  },
  routeStatusNoteText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // ── Date & Class Row ────────────────────────────────────
  dateClassRow: {
    marginTop: 14,
  },
  dateBoxWrapper: {
    width: '100%',
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34313B',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // ── Class Selector Chips (3A, 2A, SL, CC) ───────────────
  classChipsSection: {
    marginTop: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  classPill: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#34313B',
    backgroundColor: '#1E1D21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classPillActive: {
    backgroundColor: colors.brand.primary, // Solid Coral #E45F60
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  classPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  classPillTextActive: {
    color: colors.white,
  },

  // ── Primary Search CTA Button ───────────────────────────
  searchCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand.primary, // Solid Coral (#E45F60)
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 18,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  searchCtaText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },

  // ── Live Status & Recent Searches Section ───────────────
  recentSection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  recentSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  horizontalInquiryList: {
    gap: 12,
    paddingRight: 16,
  },
  inquiryCard: {
    width: 176,
    backgroundColor: '#242227', // Solid crisp card
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#36333D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  inquiryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wineHeaderBadge: {
    backgroundColor: colors.brand.wine,
    borderWidth: 1,
    borderColor: '#983D54',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  wineBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  marigoldVacancyBadge: {
    backgroundColor: '#2F2615',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#5C4718',
  },
  marigoldVacancyText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.secondary,
  },
  inquiryTrainName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },

  // ── Direct / Indirect Inquiries Badges ──────────────────
  inquiryRouteTypeRow: {
    marginBottom: 8,
  },
  directPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172C20',
    borderWidth: 1,
    borderColor: '#265438',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  directSmallDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  directPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.2,
  },
  indirectPillBadge: {
    backgroundColor: '#2E2616',
    borderWidth: 1,
    borderColor: '#574519',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  indirectPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.brand.secondary,
    letterSpacing: 0.2,
  },

  inquiryRouteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#302D36',
    paddingTop: 8,
  },
  inquiryRouteText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  inquiryClassTag: {
    backgroundColor: '#1E1D22',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#34313B',
  },
  inquiryClassText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },

  // ── Station Autocomplete Suggestions ───────────────────
  stationSuggestions: {
    backgroundColor: '#1E1D21',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#383541',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dualStationSuggestions: {
    backgroundColor: '#18171B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#383541',
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  stationSuggestionsHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.roseStone,
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stationSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#25232A',
  },
  stationCodeBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  stationCodeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stationNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },

  // ── Disclaimer Pill ─────────────────────────────────────
  disclaimerPill: {
    marginHorizontal: 16,
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#201E23',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#302D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
