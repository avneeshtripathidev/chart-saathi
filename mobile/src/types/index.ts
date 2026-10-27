// Shared types mirroring the backend schema
// Keep in sync with backend/src/types/index.ts

export type TrainClass = '1A' | '2A' | '3A' | 'SL' | 'CC' | '2S' | 'FC' | 'EC';

export type BerthType =
  | 'LOWER' | 'MIDDLE' | 'UPPER'
  | 'SIDE_LOWER' | 'SIDE_UPPER'
  | 'CABIN' | 'COUPE' | 'SEAT' | 'UNKNOWN';

export type BerthStatus = 'VACANT' | 'OCCUPIED' | 'PARTIAL' | 'UNKNOWN';

export type ChartStatus = 'NOT_PREPARED' | 'FIRST_CHART' | 'FINAL_CHART' | 'UNKNOWN';

export type DataFreshness = 'LIVE' | 'CACHED' | 'STALE' | 'DEMO';

export interface Station {
  code: string;
  name: string;
}

export interface Train {
  trainNumber: string;
  trainName: string;
  source?: Station;
  destination?: Station;
  departureTime?: string;
  arrivalTime?: string;
  runningDays?: number[];
}

export interface VacancySegment {
  fromStation: Station;
  toStation: Station;
}

export interface BerthInfo {
  berthNumber: number;
  berthType: BerthType;
  status: BerthStatus;
  vacancySegment?: VacancySegment | null;
  note?: string;
}

export interface CoachInfo {
  coachId: string;
  coachClass: TrainClass;
  totalBerths?: number | null;
  vacantCount?: number | null;
  occupiedCount?: number | null;
  unknownCount?: number | null;
  berths?: BerthInfo[];
  dataComplete: boolean;
}

export interface ChartVacancy {
  train: Train;
  journeyDate: string;
  boardingStation: Station;
  destinationStation: Station;
  selectedClass?: TrainClass | null;
  chartStatus: ChartStatus;
  coaches: CoachInfo[];
  availableClasses?: TrainClass[];
  totalVacantBerths?: number | null;
  source: string;
  fetchedAt: string;
  freshness: DataFreshness;
  isDemo: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  source?: string;
  fetchedAt?: string;
  stale?: boolean;
  isDemo?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// Navigation param types
export interface SearchParams {
  trainNumber: string;
  trainName: string;
  date: string;
  boardingStation: string;
  destinationStation: string;
  trainClass?: TrainClass;
}

export interface RecentSearch extends SearchParams {
  id: string;
  searchedAt: string;
}

// Alternative Route Explorer types
export interface TrainLeg {
  trainNumber: string;
  trainName: string;
  trainClass: TrainClass;
  fromStation: Station;
  toStation: Station;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  vacantBerths: number;
  chartStatus: ChartStatus;
}

export interface RouteTransfer {
  station: Station;
  waitTime: string;
  waitMinutes: number;
}

export interface AlternativeRoute {
  id: string;
  title: string;
  viaSummary: string;
  totalDuration: string;
  durationMinutes: number;
  transferCount: number;
  tags: string[];
  legs: TrainLeg[];
  transfers: RouteTransfer[];
  totalVacant: number;
  fareEstimate: string;
}

export interface RouteFilterOptions {
  maxTransfers: 'all' | 1 | 2;
  trainClass: TrainClass | 'all';
  sortBy: 'fastest' | 'transfers' | 'vacancy';
}

