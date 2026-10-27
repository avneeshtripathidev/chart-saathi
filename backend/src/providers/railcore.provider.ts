/**
 * RailCore Provider Adapter
 *
 * Integrates with RailCore (railcore.tech) REST API.
 * Base URL: https://ir.railcore.tech/v1
 * Auth: X-RailCore-Key header
 *
 * STATUS: Integration adapter ready. Live calls require a valid RAILCORE_API_KEY.
 * Falls back gracefully if the key is absent.
 */

import type { ChartVacancyProvider, ProviderMetadata } from './interface.js';
import { ProviderError } from './interface.js';
import type {
  Train,
  ChartVacancy,
  ChartVacancyParams,
  ChartStatus,
  CoachInfo,
  BerthInfo,
  TrainClass,
  BerthType,
  BerthStatus,
} from '../types/index.js';
import { config } from '../config/env.js';

// ─── RailCore response shapes (best-effort, pending live key confirmation) ────

interface RCTrain {
  train_number: string;
  train_name: string;
  source_code?: string;
  source_name?: string;
  destination_code?: string;
  destination_name?: string;
  departure?: string;
  arrival?: string;
}

interface RCChartStatus {
  chart_status: 'NOT_PREPARED' | 'FIRST_CHART' | 'FINAL_CHART';
  prepared_at?: string;
}

interface RCBerth {
  berth_number: number;
  berth_type?: string;
  status?: string;
  vacant_from?: string;
  vacant_from_name?: string;
  vacant_to?: string;
  vacant_to_name?: string;
}

interface RCCoach {
  coach_id: string;
  coach_class: string;
  total_berths?: number;
  vacant_count?: number;
  occupied_count?: number;
  berths?: RCBerth[];
}

interface RCVacancyResponse {
  train: RCTrain;
  journey_date: string;
  boarding_station: string;
  boarding_station_name?: string;
  destination_station: string;
  destination_station_name?: string;
  chart_status: RCChartStatus;
  coaches: RCCoach[];
  available_classes?: string[];
  fetched_at: string;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeBerthType(raw?: string): BerthType {
  const map: Record<string, BerthType> = {
    L: 'LOWER', LOWER: 'LOWER',
    M: 'MIDDLE', MIDDLE: 'MIDDLE',
    U: 'UPPER', UPPER: 'UPPER',
    SL: 'SIDE_LOWER', SIDE_LOWER: 'SIDE_LOWER',
    SU: 'SIDE_UPPER', SIDE_UPPER: 'SIDE_UPPER',
  };
  return map[raw?.toUpperCase() ?? ''] ?? 'UNKNOWN';
}

function normalizeBerthStatus(raw?: string): BerthStatus {
  if (!raw) return 'UNKNOWN';
  const u = raw.toUpperCase();
  if (u === 'VACANT' || u === 'EMPTY') return 'VACANT';
  if (u === 'OCCUPIED' || u === 'BOOKED') return 'OCCUPIED';
  if (u === 'PARTIAL') return 'PARTIAL';
  return 'UNKNOWN';
}

function normalizeChartStatus(raw?: string): ChartStatus {
  if (!raw) return 'UNKNOWN';
  const u = raw.toUpperCase();
  if (u === 'NOT_PREPARED') return 'NOT_PREPARED';
  if (u === 'FIRST_CHART') return 'FIRST_CHART';
  if (u === 'FINAL_CHART') return 'FINAL_CHART';
  return 'UNKNOWN';
}

function normalizeTrain(rc: RCTrain): Train {
  return {
    trainNumber: rc.train_number,
    trainName: rc.train_name,
    source: rc.source_code
      ? { code: rc.source_code, name: rc.source_name ?? rc.source_code }
      : undefined,
    destination: rc.destination_code
      ? { code: rc.destination_code, name: rc.destination_name ?? rc.destination_code }
      : undefined,
    departureTime: rc.departure,
    arrivalTime: rc.arrival,
  };
}

function normalizeCoach(rc: RCCoach): CoachInfo {
  const berths = rc.berths?.map((b): BerthInfo => ({
    berthNumber: b.berth_number,
    berthType: normalizeBerthType(b.berth_type),
    status: normalizeBerthStatus(b.status),
    vacancySegment:
      b.vacant_from && b.vacant_to
        ? {
            fromStation: { code: b.vacant_from, name: b.vacant_from_name ?? b.vacant_from },
            toStation: { code: b.vacant_to, name: b.vacant_to_name ?? b.vacant_to },
          }
        : null,
  }));

  return {
    coachId: rc.coach_id,
    coachClass: rc.coach_class as TrainClass,
    totalBerths: rc.total_berths ?? null,
    vacantCount: rc.vacant_count ?? null,
    occupiedCount: rc.occupied_count ?? null,
    unknownCount: null,
    berths,
    dataComplete: !!berths,
  };
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function rcFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${config.RAILCORE_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.RAILCORE_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RailCore-Key': config.RAILCORE_API_KEY ?? '',
        Accept: 'application/json',
        'User-Agent': 'ChartSaathi/1.0',
      },
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      throw new ProviderError('UNAUTHORIZED', 'RailCore API key invalid or missing', false);
    }
    if (res.status === 429) {
      throw new ProviderError('RATE_LIMITED', 'RailCore rate limit exceeded', true);
    }
    if (!res.ok) {
      throw new ProviderError(
        'UPSTREAM_ERROR',
        `RailCore returned HTTP ${res.status}`,
        res.status >= 500,
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort') || msg.includes('timeout')) {
      throw new ProviderError('TIMEOUT', 'RailCore request timed out', true, err);
    }
    throw new ProviderError('PROVIDER_UNAVAILABLE', `RailCore unreachable: ${msg}`, true, err);
  } finally {
    clearTimeout(timer);
  }
}

// ─── RailCore provider ────────────────────────────────────────────────────────

export class RailCoreProvider implements ChartVacancyProvider {
  readonly metadata: ProviderMetadata = {
    name: 'railcore',
    isDemo: false,
    supportsTrainSearch: true,
    supportsChartStatus: true,
    supportsCoachVacancy: true,
    supportsBerthLevel: true,
    supportsVacancySegments: true,
  };

  private assertKey(): void {
    if (!config.RAILCORE_API_KEY) {
      throw new ProviderError(
        'UNAUTHORIZED',
        'RAILCORE_API_KEY is not configured. Set it in .env and restart the server.',
        false,
      );
    }
  }

  async searchTrains(query: string): Promise<Train[]> {
    this.assertKey();
    // RailCore may expose /trains/search — adjust path if docs differ
    const data = await rcFetch<{ trains: RCTrain[] }>('/trains/search', { q: query });
    return (data.trains ?? []).map(normalizeTrain);
  }

  async getTrainInfo(trainNumber: string): Promise<Train | null> {
    this.assertKey();
    try {
      const data = await rcFetch<RCTrain>(`/trains/${trainNumber}`, {});
      return normalizeTrain(data);
    } catch (err) {
      if (err instanceof ProviderError && err.code === 'UPSTREAM_ERROR') return null;
      throw err;
    }
  }

  async getChartStatus(params: ChartVacancyParams): Promise<ChartStatus> {
    this.assertKey();
    const data = await rcFetch<RCChartStatus>('/charts/status', {
      train_number: params.trainNumber,
      date: params.date,
      boarding_station: params.boardingStation,
    });
    return normalizeChartStatus(data.chart_status);
  }

  async getChartVacancy(params: ChartVacancyParams): Promise<ChartVacancy> {
    this.assertKey();
    const data = await rcFetch<RCVacancyResponse>('/charts/vacant-berths', {
      train_number: params.trainNumber,
      date: params.date,
      boarding_station: params.boardingStation,
      destination_station: params.destinationStation,
      ...(params.trainClass ? { class: params.trainClass } : {}),
    });

    const coaches = (data.coaches ?? []).map(normalizeCoach);
    const totalVacant = coaches.reduce((sum, c) => sum + (c.vacantCount ?? 0), 0);
    const chartStatus = normalizeChartStatus(data.chart_status?.chart_status);

    return {
      train: normalizeTrain(data.train),
      journeyDate: params.date,
      boardingStation: {
        code: data.boarding_station,
        name: data.boarding_station_name ?? data.boarding_station,
      },
      destinationStation: {
        code: data.destination_station,
        name: data.destination_station_name ?? data.destination_station,
      },
      selectedClass: params.trainClass ?? null,
      chartStatus,
      coaches,
      availableClasses: (data.available_classes ?? []) as TrainClass[],
      totalVacantBerths: totalVacant,
      source: 'railcore',
      fetchedAt: data.fetched_at ?? new Date().toISOString(),
      freshness: 'LIVE',
      isDemo: false,
    };
  }

  async getCoaches(params: ChartVacancyParams): Promise<CoachInfo[]> {
    const vacancy = await this.getChartVacancy(params);
    return vacancy.coaches;
  }

  async getBerths(params: ChartVacancyParams & { coachId: string }): Promise<BerthInfo[]> {
    const coaches = await this.getCoaches(params);
    const coach = coaches.find((c) => c.coachId === params.coachId);
    if (!coach) throw new ProviderError('NO_DATA', `Coach ${params.coachId} not found in response`);
    return coach.berths ?? [];
  }
}
