import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getProvider } from '../providers/index.js';
import { ProviderError } from '../providers/interface.js';
import { cacheGet, cacheSet, cacheKey } from '../db/cache.js';
import { successResponse, errorResponse, ChartVacancyParamsSchema } from '../types/index.js';

function parseChartParams(query: unknown) {
  return ChartVacancyParamsSchema.safeParse(query);
}

function providerErrorReply(err: unknown, reply: FastifyReply) {
  if (err instanceof ProviderError) {
    const statusMap: Record<string, number> = {
      TRAIN_NOT_FOUND: 404,
      STATION_NOT_FOUND: 404,
      CHART_NOT_PREPARED: 200,
      UNAUTHORIZED: 503,
      RATE_LIMITED: 503,
      TIMEOUT: 504,
      PROVIDER_UNAVAILABLE: 503,
      NO_DATA: 404,
      INVALID_DATE: 400,
      UPSTREAM_ERROR: 502,
    };
    const status = statusMap[err.code] ?? 500;
    return reply.status(status).send(errorResponse(err.code, err.message));
  }
  return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
}

export async function chartRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/charts/status
   * Chart preparation status for a train on a given date
   */
  app.get('/status', async (request, reply) => {
    const parse = parseChartParams(request.query);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid parameters', parse.error.flatten()));
    }
    const params = parse.data;
    const ck = cacheKey('chart:status', params.trainNumber, params.date, params.boardingStation);
    const cached = cacheGet(ck);
    if (cached) return reply.send(successResponse(cached.value, { source: 'cache', stale: cached.stale }));

    try {
      const provider = getProvider();
      const status = await provider.getChartStatus(params);
      cacheSet(ck, status, 120);
      return reply.send(
        successResponse({ chartStatus: status }, {
          source: provider.metadata.name,
          isDemo: provider.metadata.isDemo,
        }),
      );
    } catch (err) {
      return providerErrorReply(err, reply);
    }
  });

  /**
   * GET /api/v1/charts/vacancy
   * Full chart vacancy including all coaches and berths
   */
  app.get('/vacancy', async (request, reply) => {
    const parse = parseChartParams(request.query);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid parameters', parse.error.flatten()));
    }
    const params = parse.data;
    const ck = cacheKey(
      'chart:vacancy',
      params.trainNumber, params.date,
      params.boardingStation, params.destinationStation,
      params.trainClass ?? 'any',
    );
    const cached = cacheGet(ck);
    if (cached) {
      return reply.send(
        successResponse(cached.value, { source: 'cache', stale: cached.stale }),
      );
    }

    try {
      const provider = getProvider();
      const vacancy = await provider.getChartVacancy(params);
      cacheSet(ck, vacancy, 60); // Chart data refreshes frequently
      return reply.send(
        successResponse(vacancy, {
          source: provider.metadata.name,
          fetchedAt: vacancy.fetchedAt,
          isDemo: provider.metadata.isDemo,
        }),
      );
    } catch (err) {
      return providerErrorReply(err, reply);
    }
  });

  /**
   * GET /api/v1/charts/coaches
   * Coach-level vacancy summary for a specific class
   */
  app.get('/coaches', async (request, reply) => {
    const parse = parseChartParams(request.query);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid parameters', parse.error.flatten()));
    }
    const params = parse.data;
    const ck = cacheKey('chart:coaches', params.trainNumber, params.date, params.trainClass ?? 'any');
    const cached = cacheGet(ck);
    if (cached) return reply.send(successResponse(cached.value, { source: 'cache', stale: cached.stale }));

    try {
      const provider = getProvider();
      const coaches = await provider.getCoaches(params);
      cacheSet(ck, coaches, 60);
      return reply.send(
        successResponse(coaches, { source: provider.metadata.name, isDemo: provider.metadata.isDemo }),
      );
    } catch (err) {
      return providerErrorReply(err, reply);
    }
  });

  /**
   * GET /api/v1/charts/berths
   * Berth-level detail for a specific coach
   */
  app.get('/berths', async (request, reply) => {
    const berthSchema = ChartVacancyParamsSchema.extend({
      coachId: z.string().min(1).max(10),
    });
    const parse = berthSchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid parameters', parse.error.flatten()));
    }
    const params = parse.data;
    const ck = cacheKey('chart:berths', params.trainNumber, params.date, params.coachId);
    const cached = cacheGet(ck);
    if (cached) return reply.send(successResponse(cached.value, { source: 'cache', stale: cached.stale }));

    try {
      const provider = getProvider();
      const berths = await provider.getBerths(params);
      cacheSet(ck, berths, 60);
      return reply.send(
        successResponse(berths, { source: provider.metadata.name, isDemo: provider.metadata.isDemo }),
      );
    } catch (err) {
      return providerErrorReply(err, reply);
    }
  });
}
