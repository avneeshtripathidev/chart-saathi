/**
 * Mock Chart Vacancy Provider
 *
 * Provides realistic demonstration data for development and testing.
 * ALL results from this provider are clearly marked as DEMO DATA.
 * Never present these results as real railway information.
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
} from '../types/index.js';

// ─── Static demo dataset ──────────────────────────────────────────────────────

const DEMO_TRAINS: Train[] = [
  {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    source: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'MMCT', name: 'Mumbai Central' },
    departureTime: '16:55',
    arrivalTime: '08:15',
    runningDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    trainNumber: '12301',
    trainName: 'Howrah Rajdhani Express',
    source: { code: 'HWH', name: 'Howrah Junction' },
    destination: { code: 'NDLS', name: 'New Delhi' },
    departureTime: '14:05',
    arrivalTime: '09:55',
    runningDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    trainNumber: '12621',
    trainName: 'Tamil Nadu Express',
    source: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'MAS', name: 'Chennai Central' },
    departureTime: '22:30',
    arrivalTime: '07:15',
    runningDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    trainNumber: '12627',
    trainName: 'Karnataka Express',
    source: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'SBC', name: 'KSR Bengaluru' },
    departureTime: '20:15',
    arrivalTime: '10:15',
    runningDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    trainNumber: '11057',
    trainName: 'Amritsar Express',
    source: { code: 'CSTM', name: 'Mumbai CST' },
    destination: { code: 'ASR', name: 'Amritsar Junction' },
    departureTime: '22:00',
    arrivalTime: '05:55',
    runningDays: [1, 3, 6],
  },
];

function makeBerths(
  coachId: string,
  _coachClass: TrainClass,
  totalBerths: number,
  vacantBerthNumbers: number[],
  fromStation: { code: string; name: string },
  toStation: { code: string; name: string },
): BerthInfo[] {
  const berths: BerthInfo[] = [];
  const berthTypes: BerthInfo['berthType'][] = [
    'LOWER', 'MIDDLE', 'UPPER', 'LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER',
  ];
  for (let i = 1; i <= totalBerths; i++) {
    const isVacant = vacantBerthNumbers.includes(i);
    berths.push({
      berthNumber: i,
      berthType: berthTypes[(i - 1) % berthTypes.length],
      status: isVacant ? 'VACANT' : 'OCCUPIED',
      vacancySegment: isVacant
        ? { fromStation, toStation }
        : null,
    });
  }
  void coachId;
  return berths;
}

function makeCoaches(
  params: ChartVacancyParams,
  chartStatus: ChartStatus,
): CoachInfo[] {
  if (chartStatus === 'NOT_PREPARED') return [];

  const cls = params.trainClass ?? '3A';
  const from = { code: params.boardingStation, name: params.boardingStation };
  const to = { code: params.destinationStation, name: params.destinationStation };

  const coachMap: Partial<Record<TrainClass, Array<{ id: string; total: number; vacant: number[] }>>> = {
    '3A': [
      { id: 'B1', total: 72, vacant: [3, 12, 35, 48, 61, 72] },
      { id: 'B2', total: 72, vacant: [5, 20, 44] },
      { id: 'B3', total: 72, vacant: [8, 29, 55, 68] },
      { id: 'B4', total: 72, vacant: [] },
    ],
    '2A': [
      { id: 'A1', total: 46, vacant: [4, 18, 32] },
      { id: 'A2', total: 46, vacant: [10, 25] },
    ],
    '1A': [
      { id: 'H1', total: 24, vacant: [3, 15] },
    ],
    'SL': [
      { id: 'S1', total: 80, vacant: [7, 21, 43, 56, 72, 79] },
      { id: 'S2', total: 80, vacant: [3, 15, 38] },
      { id: 'S3', total: 80, vacant: [11, 49] },
      { id: 'S4', total: 80, vacant: [2, 27, 61, 75] },
      { id: 'S5', total: 80, vacant: [] },
    ],
    'CC': [
      { id: 'C1', total: 78, vacant: [5, 19, 42] },
    ],
  };
  const coachConfigs = coachMap[cls] ?? [{ id: 'B1', total: 72, vacant: [4, 20] }];

  return coachConfigs.map(({ id, total, vacant }) => {
    const berths = makeBerths(id, cls, total, vacant, from, to);
    return {
      coachId: id,
      coachClass: cls,
      totalBerths: total,
      vacantCount: vacant.length,
      occupiedCount: total - vacant.length,
      unknownCount: 0,
      berths,
      dataComplete: true,
    };
  });
}

// ─── Mock provider implementation ─────────────────────────────────────────────

export class MockProvider implements ChartVacancyProvider {
  readonly metadata: ProviderMetadata = {
    name: 'mock',
    isDemo: true,
    supportsTrainSearch: true,
    supportsChartStatus: true,
    supportsCoachVacancy: true,
    supportsBerthLevel: true,
    supportsVacancySegments: true,
  };

  async searchTrains(query: string): Promise<Train[]> {
    const q = query.toLowerCase().trim();
    return DEMO_TRAINS.filter(
      (t) =>
        t.trainNumber.includes(q) ||
        t.trainName.toLowerCase().includes(q) ||
        t.source?.code.toLowerCase().includes(q) ||
        t.destination?.code.toLowerCase().includes(q),
    );
  }

  async getTrainInfo(trainNumber: string): Promise<Train | null> {
    return DEMO_TRAINS.find((t) => t.trainNumber === trainNumber) ?? null;
  }

  async getChartStatus(params: ChartVacancyParams): Promise<ChartStatus> {
    const train = await this.getTrainInfo(params.trainNumber);
    if (!train) throw new ProviderError('TRAIN_NOT_FOUND', `Train ${params.trainNumber} not found`);
    // Simulate: chart is prepared for past/today's dates
    const today = new Date().toISOString().split('T')[0];
    return params.date <= today ? 'FINAL_CHART' : 'NOT_PREPARED';
  }

  async getChartVacancy(params: ChartVacancyParams): Promise<ChartVacancy> {
    const train = await this.getTrainInfo(params.trainNumber);
    if (!train) throw new ProviderError('TRAIN_NOT_FOUND', `Train ${params.trainNumber} not found`);

    const chartStatus = await this.getChartStatus(params);
    const coaches = makeCoaches(params, chartStatus);
    const totalVacant = coaches.reduce((sum, c) => sum + (c.vacantCount ?? 0), 0);

    return {
      train,
      journeyDate: params.date,
      boardingStation: { code: params.boardingStation, name: params.boardingStation },
      destinationStation: { code: params.destinationStation, name: params.destinationStation },
      selectedClass: params.trainClass ?? null,
      chartStatus,
      coaches,
      availableClasses: ['1A', '2A', '3A', 'SL'],
      totalVacantBerths: totalVacant,
      source: 'mock',
      fetchedAt: new Date().toISOString(),
      freshness: 'DEMO',
      isDemo: true,
    };
  }

  async getCoaches(params: ChartVacancyParams): Promise<CoachInfo[]> {
    const chartStatus = await this.getChartStatus(params);
    return makeCoaches(params, chartStatus);
  }

  async getBerths(params: ChartVacancyParams & { coachId: string }): Promise<BerthInfo[]> {
    const coaches = await this.getCoaches(params);
    const coach = coaches.find((c) => c.coachId === params.coachId);
    if (!coach) throw new ProviderError('NO_DATA', `Coach ${params.coachId} not found`);
    return coach.berths ?? [];
  }
}
