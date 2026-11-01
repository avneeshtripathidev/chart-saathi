import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { buildApp } from '../../src/index.js';
import type { FastifyInstance } from 'fastify';

describe('ChartSaathi Backend Full API Test Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CHART_PROVIDER = 'mock';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 1. System & Discovery Endpoints ─────────────────────────────────────────

  describe('Discovery & Health Endpoints', () => {
    it('GET / should return 200 and API discovery metadata', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.status).toBe('ok');
      expect(json.name).toBe('ChartSaathi API');
      expect(json.version).toBe('1.0.0');
      expect(json.endpoints).toHaveProperty('trains');
      expect(json.endpoints).toHaveProperty('charts');
    });

    it('GET /health should report ok status with mock provider', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.status).toBe('ok');
      expect(json.provider).toBe('mock');
      expect(json.isDemo).toBe(true);
    });

    it('GET /non-existent-route should return 404 JSON', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-endpoint',
      });

      expect(response.statusCode).toBe(404);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });

  // ─── 2. Trains Endpoints ─────────────────────────────────────────────────────

  describe('Train APIs (/api/v1/trains)', () => {
    it('GET /api/v1/trains/search with valid query should return train results', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trains/search?query=12951',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data[0]).toHaveProperty('trainNumber', '12951');
    });

    it('GET /api/v1/trains/search without query should return 400 validation error', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trains/search',
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.error || json.message).toBeDefined();
    });

    it('GET /api/v1/trains/:trainNumber with valid number should return train details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trains/12951',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.trainNumber).toBe('12951');
      expect(json.data.trainName).toContain('Rajdhani');
    });

    it('GET /api/v1/trains/:trainNumber with invalid format should return 400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trains/abc',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ─── 3. Station Endpoints ────────────────────────────────────────────────────

  describe('Station APIs (/api/v1/stations)', () => {
    it('GET /api/v1/stations/search with query should return suggestions array', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stations/search?query=DELHI',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('GET /api/v1/stations/search with empty query should return empty data list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stations/search?query=',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
    });
  });

  // ─── 4. Chart Endpoints ──────────────────────────────────────────────────────

  describe('Chart APIs (/api/v1/charts)', () => {
    const validParams = 'trainNumber=12951&date=2026-10-26&boardingStation=MMCT&destinationStation=NDLS';

    it('GET /api/v1/charts/status should return chart preparation status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/status?${validParams}`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('chartStatus');
    });

    it('GET /api/v1/charts/vacancy should return comprehensive chart vacancy data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/vacancy?${validParams}`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('train');
      expect(json.data).toHaveProperty('coaches');
      expect(Array.isArray(json.data.coaches)).toBe(true);
      expect(json.data.totalVacantBerths).toBeGreaterThan(0);
    });

    it('GET /api/v1/charts/vacancy with specific trainClass=3A should filter to 3A', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/vacancy?${validParams}&trainClass=3A`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data.selectedClass).toBe('3A');
    });

    it('GET /api/v1/charts/vacancy with trainClass=undefined should not fail (graceful fallback)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/vacancy?${validParams}&trainClass=undefined`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('coaches');
    });

    it('GET /api/v1/charts/vacancy with trainClass=ALL should not fail (graceful fallback)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/vacancy?${validParams}&trainClass=ALL`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
    });

    it('GET /api/v1/charts/vacancy with missing date should return 400 VALIDATION_ERROR', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/charts/vacancy?trainNumber=12951&boardingStation=MMCT',
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/charts/vacancy with invalid date format should return 400 VALIDATION_ERROR', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/charts/vacancy?trainNumber=12951&date=invalid-date&boardingStation=MMCT',
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/charts/coaches should return list of coaches with occupancy counts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/coaches?${validParams}`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data[0]).toHaveProperty('coachId');
      expect(json.data[0]).toHaveProperty('totalBerths');
    });

    it('GET /api/v1/charts/berths should return individual berth layout for coach', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/berths?${validParams}&coachId=B1`,
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data[0]).toHaveProperty('berthNumber');
      expect(json.data[0]).toHaveProperty('status');
      expect(json.data[0]).toHaveProperty('berthType');
    });

    it('GET /api/v1/charts/berths without coachId should return 400 VALIDATION_ERROR', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/charts/berths?${validParams}`,
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── 5. PNR Endpoints ────────────────────────────────────────────────────────

  describe('PNR APIs (/api/v1/pnr)', () => {
    it('GET /api/v1/pnr/:pnrNumber with valid 10-digit number responds (503 when railkit unconfigured in test)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pnr/1234567890',
      });

      // In test mode without railkit key, 503 is returned
      expect([200, 503]).toContain(response.statusCode);
    });

    it('GET /api/v1/pnr/:pnrNumber with invalid length should return 400 VALIDATION_ERROR', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pnr/123',
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
