import { BerthInfo, CoachInfo } from '../src/types';

describe('Phase 2.1: Business Logic & Berth Analysis Engine', () => {
  describe('Berth Classification and Berth Type Recognition', () => {
    function classifyBerth(berthNo: number, coachClass: string): string {
      if (coachClass === '3A' || coachClass === 'SL') {
        const mod = berthNo % 8;
        switch (mod) {
          case 1:
          case 4:
            return 'Lower';
          case 2:
          case 5:
            return 'Middle';
          case 3:
          case 6:
            return 'Upper';
          case 7:
            return 'Side Lower';
          case 0:
            return 'Side Upper';
          default:
            return 'Unknown';
        }
      } else if (coachClass === '2A') {
        const mod = berthNo % 6;
        switch (mod) {
          case 1:
          case 3:
            return 'Lower';
          case 2:
          case 4:
            return 'Upper';
          case 5:
            return 'Side Lower';
          case 0:
            return 'Side Upper';
          default:
            return 'Unknown';
        }
      }
      return 'Window / Chair';
    }

    test('correctly identifies 3A and Sleeper berth types', () => {
      expect(classifyBerth(1, '3A')).toBe('Lower');
      expect(classifyBerth(2, '3A')).toBe('Middle');
      expect(classifyBerth(3, '3A')).toBe('Upper');
      expect(classifyBerth(4, '3A')).toBe('Lower');
      expect(classifyBerth(5, '3A')).toBe('Middle');
      expect(classifyBerth(6, '3A')).toBe('Upper');
      expect(classifyBerth(7, '3A')).toBe('Side Lower');
      expect(classifyBerth(8, '3A')).toBe('Side Upper');
    });

    test('correctly identifies 2A berth types', () => {
      expect(classifyBerth(1, '2A')).toBe('Lower');
      expect(classifyBerth(2, '2A')).toBe('Upper');
      expect(classifyBerth(3, '2A')).toBe('Lower');
      expect(classifyBerth(4, '2A')).toBe('Upper');
      expect(classifyBerth(5, '2A')).toBe('Side Lower');
      expect(classifyBerth(6, '2A')).toBe('Side Upper');
    });
  });

  describe('Coach Vacancy Summaries & Availability Status', () => {
    function summarizeCoaches(coaches: CoachInfo[]) {
      const totalVacant = coaches.reduce((acc, c) => acc + (c.vacantCount || 0), 0);
      const totalCapacity = coaches.reduce((acc, c) => acc + (c.totalBerths || 0), 0);
      const coachesWithVacancies = coaches.filter(c => (c.vacantCount || 0) > 0);

      return {
        totalVacant,
        totalCapacity,
        hasVacancies: totalVacant > 0,
        availableCoachesCount: coachesWithVacancies.length,
        occupancyRate: totalCapacity > 0 ? ((totalCapacity - totalVacant) / totalCapacity) * 100 : 0,
      };
    }

    test('calculates correct occupancy and vacancies across coach fleet', () => {
      const mockCoaches: CoachInfo[] = [
        { coachId: 'B1', coachClass: '3A', vacantCount: 4, totalBerths: 72, dataComplete: true },
        { coachId: 'B2', coachClass: '3A', vacantCount: 0, totalBerths: 72, dataComplete: true },
        { coachId: 'A1', coachClass: '2A', vacantCount: 2, totalBerths: 54, dataComplete: true },
      ];

      const summary = summarizeCoaches(mockCoaches);
      expect(summary.totalVacant).toBe(6);
      expect(summary.totalCapacity).toBe(198);
      expect(summary.hasVacancies).toBe(true);
      expect(summary.availableCoachesCount).toBe(2);
      expect(summary.occupancyRate).toBeCloseTo(96.96, 1);
    });

    test('handles empty or zero-vacancy trains cleanly', () => {
      const summary = summarizeCoaches([]);
      expect(summary.totalVacant).toBe(0);
      expect(summary.hasVacancies).toBe(false);
      expect(summary.occupancyRate).toBe(0);
    });
  });

  describe('PNR & Station Code Utilities', () => {
    function maskPnr(pnr: string): string {
      if (!pnr || pnr.length !== 10) return pnr;
      return `${pnr.slice(0, 3)}****${pnr.slice(7)}`;
    }

    function formatStationPair(from: string, to: string): string {
      return `${from.trim().toUpperCase()} ➔ ${to.trim().toUpperCase()}`;
    }

    test('masks 10-digit PNR for privacy', () => {
      expect(maskPnr('1234567890')).toBe('123****890');
      expect(maskPnr('9876543210')).toBe('987****210');
      expect(maskPnr('invalid')).toBe('invalid');
    });

    test('formats station pairs cleanly with arrow symbol', () => {
      expect(formatStationPair('mmct', 'ndls')).toBe('MMCT ➔ NDLS');
      expect(formatStationPair('  cstm ', ' hwh ')).toBe('CSTM ➔ HWH');
    });
  });
});
