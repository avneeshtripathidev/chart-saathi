import type {
  Train,
  ChartVacancy,
  ChartVacancyParams,
  ChartStatus,
  CoachInfo,
  BerthInfo,
} from '../types/index.js';

// ─── Provider interface ────────────────────────────────────────────────────────

export interface ProviderMetadata {
  name: string;
  isDemo: boolean;
  supportsTrainSearch: boolean;
  supportsChartStatus: boolean;
  supportsCoachVacancy: boolean;
  supportsBerthLevel: boolean;
  supportsVacancySegments: boolean;
}

export interface ChartVacancyProvider {
  readonly metadata: ProviderMetadata;

  /** Search trains by number or name fragment */
  searchTrains(query: string): Promise<Train[]>;

  /** Get detailed train info by train number */
  getTrainInfo(trainNumber: string): Promise<Train | null>;

  /** Get chart preparation status for a train on a date */
  getChartStatus(params: ChartVacancyParams): Promise<ChartStatus>;

  /** Get full chart vacancy — coaches + berths where available */
  getChartVacancy(params: ChartVacancyParams): Promise<ChartVacancy>;

  /** Get all coaches for a specific class */
  getCoaches(params: ChartVacancyParams): Promise<CoachInfo[]>;

  /** Get berth-level detail for a specific coach */
  getBerths(params: ChartVacancyParams & { coachId: string }): Promise<BerthInfo[]>;
}

// ─── Provider errors ──────────────────────────────────────────────────────────

export type ProviderErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'CHART_NOT_PREPARED'
  | 'TRAIN_NOT_FOUND'
  | 'STATION_NOT_FOUND'
  | 'INVALID_DATE'
  | 'NO_DATA'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT';

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
