import { z } from 'zod';

// ─── Shared enums ──────────────────────────────────────────────────────────────

export const TrainClassSchema = z.enum(['1A', '2A', '3A', 'SL', 'CC', '2S', 'FC', 'EC']);
export type TrainClass = z.infer<typeof TrainClassSchema>;

export const BerthTypeSchema = z.enum([
  'LOWER', 'MIDDLE', 'UPPER',
  'SIDE_LOWER', 'SIDE_UPPER',
  'CABIN', 'COUPE', 'SEAT', 'UNKNOWN',
]);
export type BerthType = z.infer<typeof BerthTypeSchema>;

export const BerthStatusSchema = z.enum([
  'VACANT',     // Berth is definitively empty for the requested segment
  'OCCUPIED',   // Berth is confirmed occupied
  'PARTIAL',    // Berth vacant for only part of the journey
  'UNKNOWN',    // Data not available for this berth
]);
export type BerthStatus = z.infer<typeof BerthStatusSchema>;

export const ChartStatusSchema = z.enum([
  'NOT_PREPARED',
  'FIRST_CHART',
  'FINAL_CHART',
  'UNKNOWN',
]);
export type ChartStatus = z.infer<typeof ChartStatusSchema>;

export const DataFreshnessSchema = z.enum(['LIVE', 'CACHED', 'STALE', 'DEMO']);
export type DataFreshness = z.infer<typeof DataFreshnessSchema>;

// ─── Core data models ─────────────────────────────────────────────────────────

export const StationSchema = z.object({
  code: z.string().toUpperCase().min(2).max(7),
  name: z.string().min(1),
});
export type Station = z.infer<typeof StationSchema>;

export const TrainSchema = z.object({
  trainNumber: z.string().regex(/^\d{4,6}$/, 'Train number must be 4-6 digits'),
  trainName: z.string().min(1),
  source: StationSchema.optional(),
  destination: StationSchema.optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  runningDays: z.array(z.number().int().min(0).max(6)).optional(),
});
export type Train = z.infer<typeof TrainSchema>;

export const VacancySegmentSchema = z.object({
  fromStation: StationSchema,
  toStation: StationSchema,
});
export type VacancySegment = z.infer<typeof VacancySegmentSchema>;

export const BerthInfoSchema = z.object({
  berthNumber: z.number().int().positive(),
  berthType: BerthTypeSchema,
  status: BerthStatusSchema,
  vacancySegment: VacancySegmentSchema.optional().nullable(),
  note: z.string().optional(),
});
export type BerthInfo = z.infer<typeof BerthInfoSchema>;

export const CoachInfoSchema = z.object({
  coachId: z.string().min(1),      // e.g. "B1", "S3", "A1"
  coachClass: TrainClassSchema,
  totalBerths: z.number().int().nonnegative().optional().nullable(),
  vacantCount: z.number().int().nonnegative().optional().nullable(),
  occupiedCount: z.number().int().nonnegative().optional().nullable(),
  unknownCount: z.number().int().nonnegative().optional().nullable(),
  berths: z.array(BerthInfoSchema).optional(),
  dataComplete: z.boolean().default(false),
});
export type CoachInfo = z.infer<typeof CoachInfoSchema>;

export const ChartVacancySchema = z.object({
  train: TrainSchema,
  journeyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  boardingStation: StationSchema,
  destinationStation: StationSchema,
  selectedClass: TrainClassSchema.optional().nullable(),
  chartStatus: ChartStatusSchema,
  coaches: z.array(CoachInfoSchema),
  availableClasses: z.array(TrainClassSchema).optional(),
  totalVacantBerths: z.number().int().nonnegative().optional().nullable(),
  source: z.string().min(1),
  fetchedAt: z.string().datetime(),
  freshness: DataFreshnessSchema,
  isDemo: z.boolean().default(false),
});
export type ChartVacancy = z.infer<typeof ChartVacancySchema>;

// ─── API Request schemas ──────────────────────────────────────────────────────

export const TrainSearchParamsSchema = z.object({
  query: z.string().min(1).max(100),
});

export const ChartVacancyParamsSchema = z.object({
  trainNumber: z.string().regex(/^\d{4,6}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  boardingStation: z.string().min(2).max(7).toUpperCase(),
  destinationStation: z.string().min(2).max(7).toUpperCase().default('ALL'),
  trainClass: TrainClassSchema.optional(),
});
export type ChartVacancyParams = z.infer<typeof ChartVacancyParamsSchema>;

// ─── API Response envelope ────────────────────────────────────────────────────

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
    details?: unknown;
  };
}

export function successResponse<T>(
  data: T,
  meta?: { source?: string; fetchedAt?: string; stale?: boolean; isDemo?: boolean },
): ApiResponse<T> {
  return {
    success: true,
    data,
    source: meta?.source,
    fetchedAt: meta?.fetchedAt ?? new Date().toISOString(),
    stale: meta?.stale ?? false,
    isDemo: meta?.isDemo ?? false,
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}
