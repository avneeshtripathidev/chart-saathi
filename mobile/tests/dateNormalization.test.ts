import { describe, it, expect } from '@jest/globals';

// Test implementation of normalizeDate matching mobile/app/index.tsx
function normalizeDate(d: string): string {
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // DD MMM YYYY (e.g. 01 Nov 2026 or 1 Nov 2026)
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const mmmMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (mmmMatch) {
    const day = mmmMatch[1].padStart(2, '0');
    const monKey = mmmMatch[2].substring(0, 3).toLowerCase();
    const month = months[monKey];
    const year = mmmMatch[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch {}

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

describe('Mobile Cross-Platform Date Normalization Tests', () => {
  it('should preserve standard ISO YYYY-MM-DD format', () => {
    expect(normalizeDate('2026-11-01')).toBe('2026-11-01');
    expect(normalizeDate('2026-05-15')).toBe('2026-05-15');
  });

  it('should parse DD/MM/YYYY format with leading zeros', () => {
    expect(normalizeDate('01/11/2026')).toBe('2026-11-01');
    expect(normalizeDate('25/08/2026')).toBe('2026-08-25');
  });

  it('should parse DD-MM-YYYY format without leading zeros', () => {
    expect(normalizeDate('5-3-2026')).toBe('2026-03-05');
  });

  it('should parse DD MMM YYYY format (e.g. "01 Nov 2026" or "26 Oct 2026")', () => {
    expect(normalizeDate('01 Nov 2026')).toBe('2026-11-01');
    expect(normalizeDate('26 Oct 2026')).toBe('2026-10-26');
    expect(normalizeDate('15 Jan 2027')).toBe('2027-01-15');
  });

  it('should gracefully handle empty or invalid input with current date fallback', () => {
    const normalized = normalizeDate('');
    expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
