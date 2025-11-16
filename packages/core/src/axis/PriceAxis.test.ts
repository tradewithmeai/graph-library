import { describe, it, expect, beforeEach } from 'vitest';
import { PriceAxis, defaultPriceFormatter } from './PriceAxis';

describe('PriceAxis', () => {
  let axis: PriceAxis;

  beforeEach(() => {
    // Price range 100-200, 400px height, 20px padding
    axis = new PriceAxis({ min: 100, max: 200 }, 400, 20);
  });

  describe('constructor and configuration', () => {
    it('should initialize with config', () => {
      expect(axis.getPriceRange()).toEqual({ min: 100, max: 200 });
      expect(axis.getHeight()).toBe(400);
      expect(axis.getPadding()).toBe(20);
    });

    it('should update price range', () => {
      axis.setPriceRange({ min: 50, max: 150 });
      expect(axis.getPriceRange()).toEqual({ min: 50, max: 150 });
    });

    it('should update height', () => {
      axis.setHeight(500);
      expect(axis.getHeight()).toBe(500);
    });

    it('should update padding', () => {
      axis.setPadding(10);
      expect(axis.getPadding()).toBe(10);
    });

    it('should allow custom formatter', () => {
      const customFormatter = (price: number) => `$${price}`;
      axis.setFormatter(customFormatter);
      const ticks = axis.generateTicks();
      expect(ticks[0]?.label).toMatch(/^\$\d+/);
    });
  });

  describe('scale and invert', () => {
    it('should map max price to top (with padding)', () => {
      expect(axis.scale(200)).toBe(20); // paddingPx
    });

    it('should map min price to bottom (with padding)', () => {
      expect(axis.scale(100)).toBe(380); // height - paddingPx
    });

    it('should map middle price correctly', () => {
      expect(axis.scale(150)).toBe(200); // middle
    });

    it('should invert scale correctly', () => {
      expect(axis.invert(20)).toBeCloseTo(200, 0.01); // top -> max
      expect(axis.invert(380)).toBeCloseTo(100, 0.01); // bottom -> min
      expect(axis.invert(200)).toBeCloseTo(150, 0.01); // middle
    });

    it('should be bidirectionally consistent', () => {
      const testPrices = [100, 125, 150, 175, 200];

      for (const price of testPrices) {
        const px = axis.scale(price);
        const recovered = axis.invert(px);
        expect(recovered).toBeCloseTo(price, 0.01);
      }
    });

    it('should be monotonically decreasing (Y-axis inversion)', () => {
      const prices = [100, 120, 140, 160, 180, 200];
      let prevY = Infinity;

      for (const price of prices) {
        const y = axis.scale(price);
        expect(y).toBeLessThan(prevY);
        prevY = y;
      }
    });

    it('should handle zero price span', () => {
      axis.setPriceRange({ min: 100, max: 100 });
      expect(axis.scale(100)).toBe(200); // Middle of height
    });

    it('should handle zero available height', () => {
      axis.setHeight(40);
      axis.setPadding(20);
      // Available height is 0
      expect(axis.invert(20)).toBe(150); // Should return middle price
    });

    it('should respect padding', () => {
      const noPaddingAxis = new PriceAxis({ min: 100, max: 200 }, 400, 0);
      expect(noPaddingAxis.scale(200)).toBe(0);
      expect(noPaddingAxis.scale(100)).toBe(400);
    });
  });

  describe('tick generation', () => {
    it('should generate ticks', () => {
      const ticks = axis.generateTicks();
      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should generate ticks at nice intervals', () => {
      const ticks = axis.generateTicks();

      // Check that ticks are evenly spaced (in price domain)
      if (ticks.length >= 2) {
        const intervals = [];
        for (let i = 1; i < ticks.length; i++) {
          const interval = ticks[i]!.value - ticks[i - 1]!.value;
          intervals.push(interval);
        }

        // All intervals should be approximately the same (allow for rounding)
        const firstInterval = intervals[0];
        for (const interval of intervals) {
          expect(Math.abs(interval - firstInterval!)).toBeLessThan(0.01);
        }
      }
    });

    it('should respect minimum tick spacing', () => {
      const ticks = axis.generateTicks();

      // Check that pixel spacing is at least minTickSpacingPx
      // Note: positions decrease as price increases (Y-axis inversion)
      for (let i = 1; i < ticks.length; i++) {
        const spacing = Math.abs(ticks[i]!.position - ticks[i - 1]!.position);
        expect(spacing).toBeGreaterThanOrEqual(40); // Default minTickSpacingPx
      }
    });

    it('should generate fewer ticks for smaller height', () => {
      const ticks1 = axis.generateTicks();

      axis.setHeight(200);
      const ticks2 = axis.generateTicks();

      expect(ticks2.length).toBeLessThanOrEqual(ticks1.length);
    });

    it('should generate more ticks for larger height', () => {
      const ticks1 = axis.generateTicks();

      axis.setHeight(800);
      const ticks2 = axis.generateTicks();

      expect(ticks2.length).toBeGreaterThanOrEqual(ticks1.length);
    });

    it('should generate ticks within range', () => {
      const ticks = axis.generateTicks();

      for (const tick of ticks) {
        expect(tick.value).toBeGreaterThanOrEqual(100);
        expect(tick.value).toBeLessThanOrEqual(200);
        expect(tick.position).toBeGreaterThanOrEqual(20); // paddingPx
        expect(tick.position).toBeLessThanOrEqual(380); // height - paddingPx
      }
    });

    it('should handle very small price ranges', () => {
      axis.setPriceRange({ min: 100, max: 100.1 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should handle very large price ranges', () => {
      axis.setPriceRange({ min: 0, max: 100000 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.length).toBeLessThan(50); // Should not generate too many
    });

    it('should return empty array for zero available height', () => {
      axis.setHeight(40);
      axis.setPadding(20);
      const ticks = axis.generateTicks();
      expect(ticks).toEqual([]);
    });

    it('should return empty array for negative price span', () => {
      axis.setPriceRange({ min: 200, max: 100 });
      const ticks = axis.generateTicks();
      expect(ticks).toEqual([]);
    });

    it('should include labels', () => {
      const ticks = axis.generateTicks();

      for (const tick of ticks) {
        expect(tick.label).toBeTruthy();
        expect(typeof tick.label).toBe('string');
      }
    });

    it('should use custom min tick spacing', () => {
      const customAxis = new PriceAxis({ min: 100, max: 200 }, 400, 20, 100);
      const ticks = customAxis.generateTicks();

      // Check spacing is at least 100px
      for (let i = 1; i < ticks.length; i++) {
        const spacing = Math.abs(ticks[i]!.position - ticks[i - 1]!.position);
        expect(spacing).toBeGreaterThanOrEqual(100);
      }
    });

    it('should generate nice round numbers', () => {
      const ticks = axis.generateTicks();

      // At least some ticks should be round numbers
      const hasRoundNumber = ticks.some((tick) => {
        const value = tick.value;
        // Check if divisible by 1, 2, 5, 10, etc.
        return (
          value % 1 === 0 ||
          value % 2 === 0 ||
          value % 5 === 0 ||
          value % 10 === 0 ||
          value % 25 === 0
        );
      });

      expect(hasRoundNumber).toBe(true);
    });
  });

  describe('tick monotonicity', () => {
    it('should generate ticks in ascending order (values)', () => {
      const ticks = axis.generateTicks();

      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]!.value).toBeGreaterThan(ticks[i - 1]!.value);
      }
    });

    it('should generate ticks in descending order (positions - Y inversion)', () => {
      const ticks = axis.generateTicks();

      // Higher prices should have lower Y positions
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]!.position).toBeLessThan(ticks[i - 1]!.position);
      }
    });
  });

  describe('default formatter', () => {
    it('should format with 2 decimal places', () => {
      expect(defaultPriceFormatter(123.456)).toBe('123.46');
      expect(defaultPriceFormatter(100)).toBe('100.00');
      expect(defaultPriceFormatter(99.995)).toBe('100.00');
    });
  });

  describe('edge cases', () => {
    it('should handle negative prices', () => {
      axis.setPriceRange({ min: -100, max: 100 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);

      // Should include 0 as a tick
      const hasZero = ticks.some((tick) => Math.abs(tick.value) < 0.01);
      expect(hasZero).toBe(true);
    });

    it('should handle fractional prices', () => {
      axis.setPriceRange({ min: 0.1, max: 0.9 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);

      for (const tick of ticks) {
        expect(tick.value).toBeGreaterThanOrEqual(0.1);
        expect(tick.value).toBeLessThanOrEqual(0.9);
      }
    });

    it('should handle zero-crossing ranges', () => {
      axis.setPriceRange({ min: -50, max: 50 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should handle prices in different orders of magnitude', () => {
      // Very large prices
      axis.setPriceRange({ min: 10000, max: 20000 });
      const ticks1 = axis.generateTicks();
      expect(ticks1.length).toBeGreaterThan(0);

      // Very small prices
      axis.setPriceRange({ min: 0.001, max: 0.002 });
      const ticks2 = axis.generateTicks();
      expect(ticks2.length).toBeGreaterThan(0);
    });

    it('should handle prices with different paddings', () => {
      const axis1 = new PriceAxis({ min: 100, max: 200 }, 400, 0);
      const axis2 = new PriceAxis({ min: 100, max: 200 }, 400, 50);

      const ticks1 = axis1.generateTicks();
      const ticks2 = axis2.generateTicks();

      // With more padding, there's less available space, so fewer ticks
      expect(ticks2.length).toBeLessThanOrEqual(ticks1.length);
    });
  });
});
