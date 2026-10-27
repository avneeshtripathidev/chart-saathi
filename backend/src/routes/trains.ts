import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getProvider } from '../providers/index.js';
import { ProviderError } from '../providers/interface.js';
import { cacheGet, cacheSet, cacheKey } from '../db/cache.js';
import { successResponse, errorResponse, TrainSearchParamsSchema } from '../types/index.js';

export async function trainRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/trains/search
   * Search trains by number or name fragment
   */
  app.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const parse = TrainSearchParamsSchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid query', parse.error.flatten()));
    }

    const { query } = parse.data;
    const ck = cacheKey('trains:search', query);
    const cached = cacheGet(ck);
    if (cached) {
      return reply.send(successResponse(cached.value, { source: 'cache', stale: cached.stale }));
    }

    try {
      const provider = getProvider();
      const trains = await provider.searchTrains(query);
      cacheSet(ck, trains, 300);
      return reply.send(
        successResponse(trains, {
          source: provider.metadata.name,
          isDemo: provider.metadata.isDemo,
        }),
      );
    } catch (err) {
      return handleProviderError(err, reply);
    }
  });

  /**
   * GET /api/v1/trains/:trainNumber
   * Get train details by number
   */
  app.get('/:trainNumber', {
    schema: {
      params: {
        type: 'object',
        required: ['trainNumber'],
        properties: {
          trainNumber: { type: 'string', pattern: '^\\d{4,6}$' },
        },
      },
    },
  }, async (request, reply) => {
    const params = request.params as { trainNumber: string };
    const parse = z.string().regex(/^\d{4,6}$/).safeParse(params.trainNumber);
    if (!parse.success) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Invalid train number'));
    }

    const ck = cacheKey('trains:info', params.trainNumber);
    const cached = cacheGet(ck);
    if (cached) return reply.send(successResponse(cached.value, { source: 'cache' }));

    try {
      const provider = getProvider();
      const train = await provider.getTrainInfo(params.trainNumber);
      if (!train) {
        return reply.status(404).send(errorResponse('TRAIN_NOT_FOUND', `Train ${params.trainNumber} not found`));
      }
      cacheSet(ck, train, 3600);
      return reply.send(
        successResponse(train, { source: provider.metadata.name, isDemo: provider.metadata.isDemo }),
      );
    } catch (err) {
      return handleProviderError(err, reply);
    }
  });
}

function handleProviderError(err: unknown, reply: FastifyReply) {
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
