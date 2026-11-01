import { describe, it, expect } from '@jest/globals';
import { getAlternativeRoutes } from '../src/api/alternativeRoutes';

describe('Alternative Routes Engine Unit Tests', () => {
  describe('Mumbai — Delhi Corridor (MMCT/BDTS to NDLS/NZM)', () => {
    it('should generate 2 multi-leg route options for MMCT to NDLS', () => {
      const routes = getAlternativeRoutes('MMCT', 'NDLS', '2026-11-01');
      expect(routes).toHaveLength(2);

      const [route1, route2] = routes;
      expect(route1.title).toContain('via Vadodara (BRC)');
      expect(route1.legs).toHaveLength(2);
      expect(route1.legs[0].fromStation.code).toBe('MMCT');
      expect(route1.legs[0].toStation.code).toBe('BRC');
      expect(route1.legs[1].fromStation.code).toBe('BRC');
      expect(route1.legs[1].toStation.code).toBe('NDLS');
      expect(route1.transfers[0].station.code).toBe('BRC');
      expect(route1.totalVacant).toBe(14);

      expect(route2.title).toContain('via Kota (KOTA)');
      expect(route2.legs[0].toStation.code).toBe('KOTA');
      expect(route2.totalVacant).toBe(22);
    });

    it('should respect preferredClass when specified', () => {
      const routes = getAlternativeRoutes('BDTS', 'NZM', '2026-11-01', '2A');
      expect(routes[0].legs[0].trainClass).toBe('2A');
      expect(routes[0].legs[1].trainClass).toBe('2A');
    });
  });

  describe('Kolkata — Delhi Corridor (HWH/SDAH to NDLS/DLI)', () => {
    it('should generate DDU and CNB routes for HWH to NDLS', () => {
      const routes = getAlternativeRoutes('HWH', 'NDLS', '2026-11-01');
      expect(routes).toHaveLength(2);

      expect(routes[0].viaSummary).toContain('DDU');
      expect(routes[1].viaSummary).toContain('CNB');
      expect(routes[0].totalDuration).toBe('18h 10m');
      expect(routes[0].durationMinutes).toBe(1090);
    });

    it('should handle lowercase station codes seamlessly', () => {
      const routes = getAlternativeRoutes('sdah', 'dli', '2026-11-01');
      expect(routes).toHaveLength(2);
      expect(routes[0].viaSummary).toContain('DDU');
    });
  });

  describe('Dynamic / Generic Station Corridor', () => {
    it('should generate valid split routes for any arbitrary station pair', () => {
      const routes = getAlternativeRoutes('CNB', 'MAS', '2026-11-01');
      expect(routes).toHaveLength(2);
      expect(routes[0].legs).toHaveLength(2);
      expect(routes[0].transfers).toHaveLength(1);
      expect(routes[0].fareEstimate).toBeDefined();
      expect(routes[0].totalVacant).toBeGreaterThan(0);
    });
  });
});
