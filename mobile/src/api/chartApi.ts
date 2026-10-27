import { API_BASE_URL } from '../utils/config';
import type {
  ApiResponse,
  Train,
  ChartVacancy,
  CoachInfo,
  BerthInfo,
  TrainClass,
} from '../types';

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as ApiResponse<T>;
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

// ─── Train APIs ────────────────────────────────────────────────────────────────

export async function searchTrains(query: string): Promise<ApiResponse<Train[]>> {
  return apiFetch<Train[]>('/api/v1/trains/search', { query });
}

export interface StationSuggestion {
  code: string;
  name: string;
}

export async function searchStations(query: string): Promise<ApiResponse<StationSuggestion[]>> {
  return apiFetch<StationSuggestion[]>('/api/v1/stations/search', { query });
}

export async function getTrainInfo(trainNumber: string): Promise<ApiResponse<Train>> {
  return apiFetch<Train>(`/api/v1/trains/${trainNumber}`);
}

// ─── Chart APIs ────────────────────────────────────────────────────────────────

export interface ChartParams {
  trainNumber: string;
  date: string;
  boardingStation: string;
  destinationStation: string;
  trainClass?: TrainClass;
}

export async function getChartStatus(params: ChartParams): Promise<ApiResponse<{ chartStatus: string }>> {
  return apiFetch('/api/v1/charts/status', {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    ...(params.trainClass ? { trainClass: params.trainClass } : {}),
  });
}

export async function getChartVacancy(params: ChartParams): Promise<ApiResponse<ChartVacancy>> {
  return apiFetch<ChartVacancy>('/api/v1/charts/vacancy', {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    ...(params.trainClass ? { trainClass: params.trainClass } : {}),
  });
}

export async function getCoaches(params: ChartParams): Promise<ApiResponse<CoachInfo[]>> {
  return apiFetch<CoachInfo[]>('/api/v1/charts/coaches', {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    ...(params.trainClass ? { trainClass: params.trainClass } : {}),
  });
}

export async function getBerths(
  params: ChartParams & { coachId: string },
): Promise<ApiResponse<BerthInfo[]>> {
  return apiFetch<BerthInfo[]>('/api/v1/charts/berths', {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    coachId: params.coachId,
    ...(params.trainClass ? { trainClass: params.trainClass } : {}),
  });
}
