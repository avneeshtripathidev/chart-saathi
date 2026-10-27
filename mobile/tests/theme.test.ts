import { colors, spacing, borderRadius } from '../src/utils/theme';

describe('Mobile Theme Design Tokens', () => {
  it('has valid background colors', () => {
    expect(colors.bg.primary).toBeDefined();
    expect(colors.bg.secondary).toBeDefined();
    expect(colors.bg.tertiary).toBeDefined();
  });

  it('has consistent brand palette', () => {
    expect(colors.brand.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.brand.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('defines status colors for all vacancy states', () => {
    expect(colors.status.vacant).toBeDefined();
    expect(colors.status.occupied).toBeDefined();
    expect(colors.status.partial).toBeDefined();
    expect(colors.status.unknown).toBeDefined();
  });

  it('defines spacing scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
  });

  it('defines border radiuses', () => {
    expect(borderRadius.sm).toBe(6);
    expect(borderRadius.md).toBe(10);
    expect(borderRadius.lg).toBe(16);
    expect(borderRadius.full).toBe(9999);
  });
});
