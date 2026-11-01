import { API_BASE_URL } from '../utils/config';
import type {
  ApiResponse,
  Train,
  ChartVacancy,
  CoachInfo,
  BerthInfo,
  TrainClass,
} from '../types';

const VALID_TRAIN_CLASSES = new Set(['1A', '2A', '3A', 'SL', 'CC', '2S', 'FC', 'EC']);

function isRealClass(cls?: string): cls is TrainClass {
  return Boolean(cls && VALID_TRAIN_CLASSES.has(cls));
}

async function apiFetch<T>(path: string, params?: Record<string, string | undefined>): Promise<ApiResponse<T>> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== 'undefined' && v !== null && v !== 'null' && v !== '') {
        url.searchParams.set(k, v);
      }
    });
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
  trainClass?: TrainClass | string;
}

export async function getChartStatus(params: ChartParams): Promise<ApiResponse<{ chartStatus: string }>> {
  const query: Record<string, string> = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
  };
  if (isRealClass(params.trainClass)) {
    query.trainClass = params.trainClass;
  }
  return apiFetch('/api/v1/charts/status', query);
}

export async function getChartVacancy(params: ChartParams): Promise<ApiResponse<ChartVacancy>> {
  const query: Record<string, string> = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
  };
  if (isRealClass(params.trainClass)) {
    query.trainClass = params.trainClass;
  }
  return apiFetch<ChartVacancy>('/api/v1/charts/vacancy', query);
}

export async function getCoaches(params: ChartParams): Promise<ApiResponse<CoachInfo[]>> {
  const query: Record<string, string> = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
  };
  if (isRealClass(params.trainClass)) {
    query.trainClass = params.trainClass;
  }
  return apiFetch<CoachInfo[]>('/api/v1/charts/coaches', query);
}

export async function getBerths(
  params: ChartParams & { coachId: string },
): Promise<ApiResponse<BerthInfo[]>> {
  const query: Record<string, string> = {
    trainNumber: params.trainNumber,
    date: params.date,
    boardingStation: params.boardingStation,
    destinationStation: params.destinationStation,
    coachId: params.coachId,
  };
  if (isRealClass(params.trainClass)) {
    query.trainClass = params.trainClass;
  }
  return apiFetch<BerthInfo[]>('/api/v1/charts/berths', query);
}
