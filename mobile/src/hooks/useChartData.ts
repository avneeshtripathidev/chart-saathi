import { useQuery } from '@tanstack/react-query';
import {
  searchTrains,
  searchStations,
  getChartVacancy,
  getCoaches,
  getBerths,
  type ChartParams,
} from '../api/chartApi';

export const queryKeys = {
  trainSearch: (q: string) => ['trains', 'search', q] as const,
  stationSearch: (q: string) => ['stations', 'search', q] as const,
  chartVacancy: (p: ChartParams) => ['charts', 'vacancy', p] as const,
  coaches: (p: ChartParams) => ['charts', 'coaches', p] as const,
  berths: (p: ChartParams & { coachId: string }) => ['charts', 'berths', p] as const,
};

export function useTrainSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.trainSearch(query),
    queryFn: () => searchTrains(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min
    select: (res) => (res.success ? res.data ?? [] : []),
  });
}

export function useStationSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.stationSearch(query),
    queryFn: () => searchStations(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour
    select: (res) => (res.success ? res.data ?? [] : []),
  });
}

export function useChartVacancy(params: ChartParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chartVacancy(params),
    queryFn: () => getChartVacancy(params),
    enabled: enabled && Boolean(params.trainNumber && params.date && params.boardingStation && params.destinationStation),
    staleTime: 1000 * 60, // 1 min — chart data changes often
    retry: 2,
  });
}

export function useCoaches(params: ChartParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.coaches(params),
    queryFn: () => getCoaches(params),
    enabled: enabled && Boolean(params.trainNumber && params.date),
    staleTime: 1000 * 60,
    select: (res) => (res.success ? res.data ?? [] : []),
  });
}

export function useBerths(params: ChartParams & { coachId: string }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.berths(params),
    queryFn: () => getBerths(params),
    enabled: enabled && Boolean(params.coachId),
    staleTime: 1000 * 60,
    select: (res) => (res.success ? res.data ?? [] : []),
  });
}
