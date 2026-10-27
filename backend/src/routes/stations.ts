import type { FastifyInstance } from 'fastify';
import { stationsByName, stationByCode, configure } from 'railkit';
import { cacheGet, cacheSet, cacheKey } from '../db/cache.js';
import { successResponse, errorResponse } from '../types/index.js';
import { config } from '../config/env.js';

interface StationSuggestion {
  code: string;
  name: string;
}

export async function stationRoutes(app: FastifyInstance): Promise<void> {
  if (config.RAILKIT_API_KEY) {
    configure(config.RAILKIT_API_KEY);
  }

  /**
   * GET /api/v1/stations/search
   * Search stations by name or code query
   */
  app.get('/search', async (request, reply) => {
    const { query } = request.query as { query?: string };
    const q = (query ?? '').trim();

    if (q.length < 2) {
      return reply.send(successResponse([]));
    }

    if (config.RAILKIT_API_KEY) {
      configure(config.RAILKIT_API_KEY);
    }

    const ck = cacheKey('stations:search', q);
    const cached = cacheGet<StationSuggestion[]>(ck);
    if (cached && cached.value && cached.value.length > 0) {
      return reply.send(successResponse(cached.value, { source: 'cache', stale: cached.stale }));
    }

    const results: StationSuggestion[] = [];
    const seenCodes = new Set<string>();

    try {
      // 1. Try station by code (if 2-5 chars)
      if (q.length >= 2 && q.length <= 5) {
        try {
          const codeRes = await stationByCode(q.toUpperCase());
          if (codeRes?.success && codeRes.data?.code) {
            seenCodes.add(codeRes.data.code);
            results.push({
              code: codeRes.data.code,
              name: codeRes.data.name,
            });
          }
        } catch {
          // ignore
        }
      }

      // 2. Try stations by name
      let nameRes = await stationsByName(q);
      if (nameRes?.success && Array.isArray(nameRes.data?.stations) && nameRes.data.stations.length > 0) {
        for (const stn of nameRes.data.stations) {
          if (!seenCodes.has(stn.code)) {
            seenCodes.add(stn.code);
            results.push({ code: stn.code, name: stn.name });
          }
        }
      } else if (q.length >= 4) {
        // Fallback for typos or trailing extra characters (e.g., 'Govinde' -> 'Govind')
        try {
          const fallbackRes = await stationsByName(q.slice(0, -1));
          if (fallbackRes?.success && Array.isArray(fallbackRes.data?.stations)) {
            for (const stn of fallbackRes.data.stations) {
              if (!seenCodes.has(stn.code)) {
                seenCodes.add(stn.code);
                results.push({ code: stn.code, name: stn.name });
              }
            }
          }
        } catch {
          // ignore fallback error
        }
      }

      // Cache for 24 hours in memory (stations rarely change)
      cacheSet(ck, results, 86400);

      return reply.send(
        successResponse(results, { source: 'railkit', isDemo: false }),
      );
    } catch (err: any) {
      return reply.status(502).send(
        errorResponse('UPSTREAM_ERROR', err?.message || 'Failed to search stations'),
      );
    }
  });
}
