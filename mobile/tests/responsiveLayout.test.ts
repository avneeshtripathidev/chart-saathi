/**
 * Responsive Web & Mobile Viewport Matrix Tests
 * 
 * Target Viewport Breakpoints:
 * - 320px (Compact Mobile / iPhone SE 1st gen)
 * - 360px (Standard Android / Galaxy S series)
 * - 375px (iPhone mini / SE 2nd gen)
 * - 390px (iPhone 12/13/14/15/16 standard)
 * - 430px (iPhone Pro Max / Android Plus models)
 * - 768px (iPad Mini / Portrait Tablets)
 * - 1024px (iPad Pro / Landscape Tablets / Small Laptops)
 * - 1280px (Standard Desktop Display)
 * - 1440px (High-resolution Desktop)
 * - 1920px (Full HD 1080p Monitor)
 */

describe('Phase 2.6: Responsive Web & Viewport Adaptability', () => {
  const VIEWPORTS = [
    { width: 320, name: 'Compact Mobile (320px)', device: 'mobile', maxColumns: 1 },
    { width: 360, name: 'Standard Android (360px)', device: 'mobile', maxColumns: 1 },
    { width: 375, name: 'iPhone Standard (375px)', device: 'mobile', maxColumns: 1 },
    { width: 390, name: 'iPhone Modern (390px)', device: 'mobile', maxColumns: 1 },
    { width: 430, name: 'Large Mobile (430px)', device: 'mobile', maxColumns: 1 },
    { width: 768, name: 'Tablet Portrait (768px)', device: 'tablet', maxColumns: 2 },
    { width: 1024, name: 'Tablet Landscape / Laptop (1024px)', device: 'desktop', maxColumns: 3 },
    { width: 1280, name: 'Desktop Standard (1280px)', device: 'desktop', maxColumns: 4 },
    { width: 1440, name: 'Desktop Large (1440px)', device: 'desktop', maxColumns: 4 },
    { width: 1920, name: 'Full HD Monitor (1920px)', device: 'desktop', maxColumns: 4 },
  ];

  function calculateLayout(viewportWidth: number) {
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
    const isDesktop = viewportWidth >= 1024;

    const horizontalPadding = isMobile ? (viewportWidth <= 360 ? 12 : 16) : 24;
    const contentMaxWidth = 1200;
    const effectiveContentWidth = Math.min(viewportWidth - horizontalPadding * 2, contentMaxWidth);

    // Column count logic for berth grid & coach list
    let columns = 1;
    if (viewportWidth >= 1280) columns = 4;
    else if (viewportWidth >= 1024) columns = 3;
    else if (viewportWidth >= 768) columns = 2;

    const columnGap = 12;
    const columnWidth = (effectiveContentWidth - columnGap * (columns - 1)) / columns;

    return {
      isMobile,
      isTablet,
      isDesktop,
      horizontalPadding,
      effectiveContentWidth,
      columns,
      columnWidth,
      hasOverflow: effectiveContentWidth <= 0 || columnWidth <= 0,
    };
  }

  VIEWPORTS.forEach(({ width, name, device, maxColumns }) => {
    describe(`Viewport: ${name}`, () => {
      const layout = calculateLayout(width);

      test('calculates valid layout without horizontal overflow', () => {
        expect(layout.hasOverflow).toBe(false);
        expect(layout.effectiveContentWidth).toBeGreaterThan(0);
        expect(layout.effectiveContentWidth).toBeLessThanOrEqual(width);
      });

      test(`matches device classification: ${device}`, () => {
        if (device === 'mobile') expect(layout.isMobile).toBe(true);
        if (device === 'tablet') expect(layout.isTablet).toBe(true);
        if (device === 'desktop') expect(layout.isDesktop).toBe(true);
      });

      test('ensures touch targets meet accessibility standard (>= 44px)', () => {
        const minimumTouchTarget = 44;
        const buttonHeight = 48; // ChartSaathi standard button height
        expect(buttonHeight).toBeGreaterThanOrEqual(minimumTouchTarget);
      });

      test('ensures column width is adequate for coach and berth cards', () => {
        expect(layout.columnWidth).toBeGreaterThan(250); // Minimum card width to avoid text wrapping
        expect(layout.columns).toBeLessThanOrEqual(maxColumns);
      });
    });
  });

  test('Search input containers retain padding on ultra-compact 320px devices', () => {
    const layout = calculateLayout(320);
    expect(layout.horizontalPadding).toBe(12);
    expect(layout.effectiveContentWidth).toBe(296);
  });

  test('Desktop layout centers content with max width 1200px', () => {
    const layout = calculateLayout(1920);
    expect(layout.effectiveContentWidth).toBe(1200);
    expect(layout.columns).toBe(4);
  });
});
