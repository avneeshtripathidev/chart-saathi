import type { FastifyInstance } from 'fastify';
import { cacheGet, cacheSet, cacheKey } from '../db/cache.js';
import { successResponse, errorResponse } from '../types/index.js';

let rkModule: any = null;
async function getRailKit(): Promise<any> {
  if (!rkModule) {
    try {
      rkModule = await import('railkit');
    } catch {
      rkModule = null;
    }
  }
  return rkModule;
}

export async function pnrRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/pnr/:pnrNumber
   * Check 10-digit PNR status via RailKit
   */
  app.get('/:pnrNumber', async (request, reply) => {
    const { pnrNumber } = request.params as { pnrNumber: string };
    const cleanPNR = pnrNumber.trim().replace(/\D/g, '');

    if (cleanPNR.length !== 10) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'PNR number must be exactly 10 digits'),
      );
    }

    const ck = cacheKey('pnr', cleanPNR);
    const cached = cacheGet(ck);
    if (cached) {
      return reply.send(
        successResponse(cached.value, { source: 'cache', stale: cached.stale }),
      );
    }

    try {
      const rk = await getRailKit();
      if (!rk || typeof rk.checkPNRStatus !== 'function') {
        return reply.status(503).send(
          errorResponse('SERVICE_UNAVAILABLE', 'RailKit service is not available'),
        );
      }
      const res = await rk.checkPNRStatus(cleanPNR);
      if (res?.success && res.data) {
        // Cache PNR status for 2 minutes
        cacheSet(ck, res.data, 120);
        return reply.send(
          successResponse(res.data, { source: 'railkit', isDemo: false }),
        );
      }
      return reply.status(404).send(
        errorResponse('PNR_NOT_FOUND', res?.error || 'PNR details not found or expired'),
      );
    } catch (err: any) {
      return reply.status(502).send(
        errorResponse('UPSTREAM_ERROR', err?.message || 'RailKit upstream service error'),
      );
    }
  });
}
