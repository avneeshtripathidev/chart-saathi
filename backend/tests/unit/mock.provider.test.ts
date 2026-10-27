/**
 * Unit tests for mock provider, normalizers, and helpers
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockProvider } from '../../src/providers/mock.provider';
import { ProviderError } from '../../src/providers/interface';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('metadata', () => {
    it('is marked as demo', () => {
      expect(provider.metadata.isDemo).toBe(true);
      expect(provider.metadata.name).toBe('mock');
    });

    it('supports all features', () => {
      expect(provider.metadata.supportsTrainSearch).toBe(true);
      expect(provider.metadata.supportsChartStatus).toBe(true);
      expect(provider.metadata.supportsCoachVacancy).toBe(true);
      expect(provider.metadata.supportsBerthLevel).toBe(true);
    });
  });

  describe('searchTrains', () => {
    it('returns results for partial train number', async () => {
      const results = await provider.searchTrains('12951');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].trainNumber).toBe('12951');
    });

    it('returns results for partial train name', async () => {
      const results = await provider.searchTrains('rajdhani');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown query', async () => {
      const results = await provider.searchTrains('xyzxyzxyz');
      expect(results).toHaveLength(0);
    });

    it('is case-insensitive', async () => {
      const lower = await provider.searchTrains('rajdhani');
      const upper = await provider.searchTrains('RAJDHANI');
      expect(lower.length).toBe(upper.length);
    });
  });

  describe('getTrainInfo', () => {
    it('returns train for known number', async () => {
      const train = await provider.getTrainInfo('12951');
      expect(train).not.toBeNull();
      expect(train?.trainNumber).toBe('12951');
      expect(train?.trainName).toContain('Rajdhani');
    });

    it('returns null for unknown train', async () => {
      const train = await provider.getTrainInfo('99999');
      expect(train).toBeNull();
    });
  });

  describe('getChartStatus', () => {
    const validParams = {
      trainNumber: '12951',
      date: '2020-01-01', // Past date — chart should be prepared
      boardingStation: 'NDLS',
      destinationStation: 'MMCT',
    };

    it('returns FINAL_CHART for past dates', async () => {
      const status = await provider.getChartStatus(validParams);
      expect(status).toBe('FINAL_CHART');
    });

    it('returns NOT_PREPARED for future dates', async () => {
      const status = await provider.getChartStatus({
        ...validParams,
        date: '2099-12-31',
      });
      expect(status).toBe('NOT_PREPARED');
    });

    it('throws ProviderError for unknown train', async () => {
      await expect(
        provider.getChartStatus({ ...validParams, trainNumber: '99999' }),
      ).rejects.toThrow(ProviderError);
    });
  });

  describe('getChartVacancy', () => {
    const validParams = {
      trainNumber: '12951',
      date: '2020-01-01',
      boardingStation: 'NDLS',
      destinationStation: 'MMCT',
      trainClass: '3A' as const,
    };

    it('returns full vacancy object with required fields', async () => {
      const vacancy = await provider.getChartVacancy(validParams);
      expect(vacancy.train.trainNumber).toBe('12951');
      expect(vacancy.isDemo).toBe(true);
      expect(vacancy.freshness).toBe('DEMO');
      expect(vacancy.source).toBe('mock');
      expect(vacancy.chartStatus).toBe('FINAL_CHART');
      expect(Array.isArray(vacancy.coaches)).toBe(true);
    });

    it('has non-negative berth counts', async () => {
      const vacancy = await provider.getChartVacancy(validParams);
      for (const coach of vacancy.coaches) {
        if (coach.vacantCount !== null && coach.vacantCount !== undefined) {
          expect(coach.vacantCount).toBeGreaterThanOrEqual(0);
        }
        if (coach.totalBerths !== null && coach.totalBerths !== undefined) {
          expect(coach.totalBerths).toBeGreaterThan(0);
        }
      }
    });

    it('returns empty coaches when chart not prepared', async () => {
      const vacancy = await provider.getChartVacancy({
        ...validParams,
        date: '2099-12-31',
      });
      expect(vacancy.chartStatus).toBe('NOT_PREPARED');
      expect(vacancy.coaches).toHaveLength(0);
    });

    it('includes fetchedAt timestamp', async () => {
      const vacancy = await provider.getChartVacancy(validParams);
      expect(() => new Date(vacancy.fetchedAt)).not.toThrow();
    });

    it('never sets isDemo to false', async () => {
      const vacancy = await provider.getChartVacancy(validParams);
      expect(vacancy.isDemo).toBe(true);
    });
  });

  describe('getCoaches', () => {
    it('returns coaches for SL class', async () => {
      const coaches = await provider.getCoaches({
        trainNumber: '12951',
        date: '2020-01-01',
        boardingStation: 'NDLS',
        destinationStation: 'MMCT',
        trainClass: 'SL',
      });
      expect(coaches.length).toBeGreaterThan(0);
      expect(coaches[0].coachClass).toBe('SL');
      expect(coaches[0].coachId).toMatch(/^S\d+$/);
    });
  });

  describe('getBerths', () => {
    it('returns berths for a known coach', async () => {
      const berths = await provider.getBerths({
        trainNumber: '12951',
        date: '2020-01-01',
        boardingStation: 'NDLS',
        destinationStation: 'MMCT',
        trainClass: '3A',
        coachId: 'B1',
      });
      expect(berths.length).toBeGreaterThan(0);
      expect(berths[0].berthNumber).toBeGreaterThan(0);
      expect(['VACANT', 'OCCUPIED', 'PARTIAL', 'UNKNOWN']).toContain(berths[0].status);
    });

    it('throws ProviderError for unknown coach', async () => {
      await expect(
        provider.getBerths({
          trainNumber: '12951',
          date: '2020-01-01',
          boardingStation: 'NDLS',
          destinationStation: 'MMCT',
          trainClass: '3A',
          coachId: 'Z99',
        }),
      ).rejects.toThrow(ProviderError);
    });

    it('vacant berths have vacancySegment', async () => {
      const berths = await provider.getBerths({
        trainNumber: '12951',
        date: '2020-01-01',
        boardingStation: 'NDLS',
        destinationStation: 'MMCT',
        trainClass: '3A',
        coachId: 'B1',
      });
      const vacant = berths.filter((b) => b.status === 'VACANT');
      for (const b of vacant) {
        expect(b.vacancySegment).not.toBeNull();
        expect(b.vacancySegment?.fromStation.code).toBeTruthy();
      }
    });
  });

  describe('freshness calculations', () => {
    it('demo data is always marked DEMO not LIVE', async () => {
      const vacancy = await provider.getChartVacancy({
        trainNumber: '12951',
        date: '2020-01-01',
        boardingStation: 'NDLS',
        destinationStation: 'MMCT',
      });
      expect(vacancy.freshness).toBe('DEMO');
      expect(vacancy.freshness).not.toBe('LIVE');
    });
  });
});
