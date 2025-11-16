import { describe, it, expect, beforeEach } from 'vitest';
import { TimeAxis, defaultTimeFormatter } from './TimeAxis';

describe('TimeAxis', () => {
  let axis: TimeAxis;

  beforeEach(() => {
    // 1 hour range (3600000 ms), 800px width
    axis = new TimeAxis({ start: 0, end: 3600000 }, 800);
  });

  describe('constructor and configuration', () => {
    it('should initialize with config', () => {
      expect(axis.getTimeRange()).toEqual({ start: 0, end: 3600000 });
      expect(axis.getWidth()).toBe(800);
    });

    it('should update time range', () => {
      axis.setTimeRange({ start: 1000, end: 5000 });
      expect(axis.getTimeRange()).toEqual({ start: 1000, end: 5000 });
    });

    it('should update width', () => {
      axis.setWidth(1000);
      expect(axis.getWidth()).toBe(1000);
    });

    it('should allow custom formatter', () => {
      const customFormatter = (ts: number) => `T${ts}`;
      axis.setFormatter(customFormatter);
      const ticks = axis.generateTicks();
      expect(ticks[0]?.label).toMatch(/^T\d+$/);
    });
  });

  describe('scale and invert', () => {
    it('should map start time to 0', () => {
      expect(axis.scale(0)).toBe(0);
    });

    it('should map end time to width', () => {
      expect(axis.scale(3600000)).toBe(800);
    });

    it('should map middle time correctly', () => {
      expect(axis.scale(1800000)).toBe(400);
    });

    it('should invert scale correctly', () => {
      expect(axis.invert(0)).toBe(0);
      expect(axis.invert(800)).toBe(3600000);
      expect(axis.invert(400)).toBe(1800000);
    });

    it('should be bidirectionally consistent', () => {
      const testTimes = [0, 900000, 1800000, 2700000, 3600000];

      for (const ts of testTimes) {
        const px = axis.scale(ts);
        const recovered = axis.invert(px);
        expect(recovered).toBeCloseTo(ts, 0.01);
      }
    });

    it('should handle zero width', () => {
      axis.setWidth(0);
      // When width is 0, scale returns 0 (mathematically: any_ratio * 0 = 0)
      expect(axis.scale(1800000)).toBe(0);
      expect(axis.invert(0)).toBe(0);
    });

    it('should handle zero time span', () => {
      axis.setTimeRange({ start: 1000, end: 1000 });
      expect(axis.scale(1000)).toBe(0);
    });
  });

  describe('tick generation', () => {
    it('should generate ticks', () => {
      const ticks = axis.generateTicks();
      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should generate ticks at nice intervals', () => {
      const ticks = axis.generateTicks();

      // Check that ticks are evenly spaced (in time domain)
      if (ticks.length >= 2) {
        const intervals = [];
        for (let i = 1; i < ticks.length; i++) {
          const interval = ticks[i]!.value - ticks[i - 1]!.value;
          intervals.push(interval);
        }

        // All intervals should be the same
        const firstInterval = intervals[0];
        for (const interval of intervals) {
          expect(interval).toBe(firstInterval);
        }
      }
    });

    it('should respect minimum tick spacing', () => {
      const ticks = axis.generateTicks();

      // Check that pixel spacing is at least minTickSpacingPx
      for (let i = 1; i < ticks.length; i++) {
        const spacing = ticks[i]!.position - ticks[i - 1]!.position;
        expect(spacing).toBeGreaterThanOrEqual(80); // Default minTickSpacingPx
      }
    });

    it('should generate fewer ticks for smaller width', () => {
      const ticks1 = axis.generateTicks();

      axis.setWidth(400);
      const ticks2 = axis.generateTicks();

      expect(ticks2.length).toBeLessThanOrEqual(ticks1.length);
    });

    it('should generate more ticks for larger width', () => {
      const ticks1 = axis.generateTicks();

      axis.setWidth(1600);
      const ticks2 = axis.generateTicks();

      expect(ticks2.length).toBeGreaterThanOrEqual(ticks1.length);
    });

    it('should generate ticks within range', () => {
      const ticks = axis.generateTicks();

      for (const tick of ticks) {
        expect(tick.value).toBeGreaterThanOrEqual(0);
        expect(tick.value).toBeLessThanOrEqual(3600000);
        expect(tick.position).toBeGreaterThanOrEqual(0);
        expect(tick.position).toBeLessThanOrEqual(800);
      }
    });

    it('should handle very small time ranges', () => {
      // 10 second range
      axis.setTimeRange({ start: 0, end: 10000 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.length).toBeLessThan(20); // Should not generate too many ticks
    });

    it('should handle very large time ranges', () => {
      // 1 year range
      axis.setTimeRange({ start: 0, end: 365 * 24 * 60 * 60 * 1000 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.length).toBeLessThan(50); // Should not generate too many ticks
    });

    it('should return empty array for zero width', () => {
      axis.setWidth(0);
      const ticks = axis.generateTicks();
      expect(ticks).toEqual([]);
    });

    it('should return empty array for negative time span', () => {
      axis.setTimeRange({ start: 1000, end: 0 });
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
      const customAxis = new TimeAxis({ start: 0, end: 3600000 }, 800, 150);
      const ticks = customAxis.generateTicks();

      // Check spacing is at least 150px
      for (let i = 1; i < ticks.length; i++) {
        const spacing = ticks[i]!.position - ticks[i - 1]!.position;
        expect(spacing).toBeGreaterThanOrEqual(150);
      }
    });
  });

  describe('tick monotonicity', () => {
    it('should generate ticks in ascending order (values)', () => {
      const ticks = axis.generateTicks();

      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]!.value).toBeGreaterThan(ticks[i - 1]!.value);
      }
    });

    it('should generate ticks in ascending order (positions)', () => {
      const ticks = axis.generateTicks();

      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]!.position).toBeGreaterThan(ticks[i - 1]!.position);
      }
    });
  });

  describe('default formatter', () => {
    it('should format as ISO string', () => {
      const formatted = defaultTimeFormatter(0);
      expect(formatted).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should handle various timestamps', () => {
      const ts = new Date('2024-01-01T12:00:00Z').getTime();
      const formatted = defaultTimeFormatter(ts);
      expect(formatted).toContain('2024-01-01');
      expect(formatted).toContain('12:00:00');
    });
  });

  describe('edge cases', () => {
    it('should handle sub-second intervals', () => {
      axis.setTimeRange({ start: 0, end: 1000 }); // 1 second
      const ticks = axis.generateTicks();
      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should handle exact interval boundaries', () => {
      // 5 minutes exactly
      axis.setTimeRange({ start: 0, end: 300000 });
      const ticks = axis.generateTicks();

      // Should include nice round intervals
      const hasRoundInterval = ticks.some((tick) => tick.value % 60000 === 0);
      expect(hasRoundInterval).toBe(true);
    });

    it('should handle non-zero start times', () => {
      axis.setTimeRange({ start: 1000000, end: 2000000 });
      const ticks = axis.generateTicks();

      expect(ticks.length).toBeGreaterThan(0);

      for (const tick of ticks) {
        expect(tick.value).toBeGreaterThanOrEqual(1000000);
        expect(tick.value).toBeLessThanOrEqual(2000000);
      }
    });
  });
});
