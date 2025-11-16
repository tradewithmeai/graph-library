import { describe, it, expect, beforeEach } from 'vitest';
import { Viewport } from './Viewport';
import type { ViewportConfig } from './Viewport';

describe('Viewport', () => {
  let viewport: Viewport;
  let config: ViewportConfig;

  beforeEach(() => {
    config = {
      time: { start: 1000, end: 5000 },
      price: { min: 100, max: 200, paddingPx: 20 },
      width: 800,
      height: 400,
    };
    viewport = new Viewport(config);
  });

  describe('constructor and configuration', () => {
    it('should initialize with config', () => {
      expect(viewport.getTimeRange()).toEqual({ start: 1000, end: 5000 });
      expect(viewport.getPriceConfig()).toEqual({ min: 100, max: 200, paddingPx: 20 });
      expect(viewport.getDimensions()).toEqual({ width: 800, height: 400 });
    });

    it('should update time range', () => {
      viewport.setTimeRange({ start: 2000, end: 6000 });
      expect(viewport.getTimeRange()).toEqual({ start: 2000, end: 6000 });
    });

    it('should update price config', () => {
      viewport.setPriceConfig({ min: 50, max: 150, paddingPx: 10 });
      expect(viewport.getPriceConfig()).toEqual({ min: 50, max: 150, paddingPx: 10 });
    });

    it('should update dimensions', () => {
      viewport.setDimensions(1000, 500);
      expect(viewport.getDimensions()).toEqual({ width: 1000, height: 500 });
    });

    it('should update entire config', () => {
      const newConfig: ViewportConfig = {
        time: { start: 0, end: 10000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 1200,
        height: 600,
      };
      viewport.setConfig(newConfig);
      expect(viewport.getTimeRange()).toEqual(newConfig.time);
      expect(viewport.getPriceConfig()).toEqual(newConfig.price);
      expect(viewport.getDimensions()).toEqual({ width: 1200, height: 600 });
    });
  });

  describe('xScale - time to pixel', () => {
    it('should map start time to 0', () => {
      expect(viewport.xScale(1000)).toBe(0);
    });

    it('should map end time to width', () => {
      expect(viewport.xScale(5000)).toBe(800);
    });

    it('should map middle time correctly', () => {
      expect(viewport.xScale(3000)).toBe(400);
    });

    it('should handle values outside range', () => {
      expect(viewport.xScale(0)).toBe(-200);
      expect(viewport.xScale(6000)).toBe(1000);
    });

    it('should be monotonically increasing', () => {
      const times = [1000, 1500, 2000, 3000, 4000, 5000];
      let prevX = -Infinity;

      for (const ts of times) {
        const x = viewport.xScale(ts);
        expect(x).toBeGreaterThan(prevX);
        prevX = x;
      }
    });

    it('should handle zero time span', () => {
      viewport.setTimeRange({ start: 1000, end: 1000 });
      expect(viewport.xScale(1000)).toBe(0);
    });
  });

  describe('yScale - price to pixel', () => {
    it('should map max price to top (with padding)', () => {
      // Max price (200) should be at paddingPx (20)
      expect(viewport.yScale(200)).toBe(20);
    });

    it('should map min price to bottom (with padding)', () => {
      // Min price (100) should be at height - paddingPx (380)
      expect(viewport.yScale(100)).toBe(380);
    });

    it('should map middle price correctly', () => {
      // Middle price (150) should be at middle Y
      expect(viewport.yScale(150)).toBe(200);
    });

    it('should be monotonically decreasing (Y-axis inversion)', () => {
      const prices = [100, 120, 140, 160, 180, 200];
      let prevY = Infinity;

      for (const price of prices) {
        const y = viewport.yScale(price);
        expect(y).toBeLessThan(prevY);
        prevY = y;
      }
    });

    it('should handle zero price span', () => {
      viewport.setPriceConfig({ min: 100, max: 100, paddingPx: 20 });
      expect(viewport.yScale(100)).toBe(200); // Middle of height
    });

    it('should respect padding', () => {
      const noPaddingViewport = new Viewport({
        ...config,
        price: { min: 100, max: 200, paddingPx: 0 },
      });

      expect(noPaddingViewport.yScale(200)).toBe(0);
      expect(noPaddingViewport.yScale(100)).toBe(400);
    });
  });

  describe('invX - pixel to time', () => {
    it('should be inverse of xScale', () => {
      const testTimes = [1000, 2000, 3000, 4000, 5000];

      for (const ts of testTimes) {
        const x = viewport.xScale(ts);
        const recovered = viewport.invX(x);
        expect(recovered).toBeCloseTo(ts, 0.01);
      }
    });

    it('should map 0 to start time', () => {
      expect(viewport.invX(0)).toBe(1000);
    });

    it('should map width to end time', () => {
      expect(viewport.invX(800)).toBe(5000);
    });

    it('should handle zero width', () => {
      viewport.setDimensions(0, 400);
      expect(viewport.invX(0)).toBe(1000);
    });
  });

  describe('invY - pixel to price', () => {
    it('should be inverse of yScale', () => {
      const testPrices = [100, 120, 150, 180, 200];

      for (const price of testPrices) {
        const y = viewport.yScale(price);
        const recovered = viewport.invY(y);
        expect(recovered).toBeCloseTo(price, 0.01);
      }
    });

    it('should map paddingPx to max price', () => {
      expect(viewport.invY(20)).toBeCloseTo(200, 0.01);
    });

    it('should map (height - paddingPx) to min price', () => {
      expect(viewport.invY(380)).toBeCloseTo(100, 0.01);
    });

    it('should handle zero available height', () => {
      viewport.setDimensions(800, 40);
      viewport.setPriceConfig({ min: 100, max: 200, paddingPx: 20 });
      // Available height is 0, should return middle price
      expect(viewport.invY(20)).toBe(150);
    });
  });

  describe('bidirectional mapping monotonicity', () => {
    it('should maintain monotonicity in both directions for time', () => {
      const times = [500, 1000, 2000, 3000, 4000, 5000, 6000];
      const pixels: number[] = [];

      // Forward mapping should be monotonic
      for (const ts of times) {
        pixels.push(viewport.xScale(ts));
      }

      for (let i = 1; i < pixels.length; i++) {
        expect(pixels[i]).toBeGreaterThan(pixels[i - 1]!);
      }

      // Inverse mapping should also be monotonic
      const recoveredTimes = pixels.map((px) => viewport.invX(px));
      for (let i = 1; i < recoveredTimes.length; i++) {
        expect(recoveredTimes[i]).toBeGreaterThan(recoveredTimes[i - 1]!);
      }
    });

    it('should maintain monotonicity in both directions for price', () => {
      const prices = [50, 100, 125, 150, 175, 200, 250];
      const pixels: number[] = [];

      // Forward mapping should be monotonic (decreasing due to Y inversion)
      for (const price of prices) {
        pixels.push(viewport.yScale(price));
      }

      for (let i = 1; i < pixels.length; i++) {
        expect(pixels[i]).toBeLessThan(pixels[i - 1]!);
      }

      // Inverse mapping should be monotonic (increasing)
      const recoveredPrices = pixels.map((px) => viewport.invY(px));
      for (let i = 1; i < recoveredPrices.length; i++) {
        expect(recoveredPrices[i]).toBeGreaterThan(recoveredPrices[i - 1]!);
      }
    });
  });

  describe('visibility checks', () => {
    it('should check time visibility correctly', () => {
      expect(viewport.isTimeVisible(3000)).toBe(true);
      expect(viewport.isTimeVisible(1000)).toBe(true);
      expect(viewport.isTimeVisible(5000)).toBe(true);
      expect(viewport.isTimeVisible(500)).toBe(false);
      expect(viewport.isTimeVisible(6000)).toBe(false);
    });

    it('should check price visibility correctly', () => {
      expect(viewport.isPriceVisible(150)).toBe(true);
      expect(viewport.isPriceVisible(100)).toBe(true);
      expect(viewport.isPriceVisible(200)).toBe(true);
      expect(viewport.isPriceVisible(50)).toBe(false);
      expect(viewport.isPriceVisible(250)).toBe(false);
    });
  });

  describe('span calculations', () => {
    it('should calculate time span', () => {
      expect(viewport.getTimeSpan()).toBe(4000);
    });

    it('should calculate price span', () => {
      expect(viewport.getPriceSpan()).toBe(100);
    });

    it('should handle zero spans', () => {
      viewport.setTimeRange({ start: 1000, end: 1000 });
      viewport.setPriceConfig({ min: 100, max: 100, paddingPx: 20 });

      expect(viewport.getTimeSpan()).toBe(0);
      expect(viewport.getPriceSpan()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very small ranges', () => {
      const smallViewport = new Viewport({
        time: { start: 0, end: 1 },
        price: { min: 0, max: 0.01, paddingPx: 0 },
        width: 10,
        height: 10,
      });

      const x = smallViewport.xScale(0.5);
      const y = smallViewport.yScale(0.005);

      expect(x).toBeCloseTo(5, 0.01);
      expect(y).toBeCloseTo(5, 0.01);
    });

    it('should handle very large ranges', () => {
      const largeViewport = new Viewport({
        time: { start: 0, end: 1e12 },
        price: { min: 0, max: 1e6, paddingPx: 0 },
        width: 1000,
        height: 1000,
      });

      const x = largeViewport.xScale(5e11);
      const y = largeViewport.yScale(5e5);

      expect(x).toBeCloseTo(500, 0.1);
      expect(y).toBeCloseTo(500, 0.1);
    });

    it('should handle negative prices', () => {
      const negViewport = new Viewport({
        time: { start: 0, end: 100 },
        price: { min: -100, max: 100, paddingPx: 0 },
        width: 100,
        height: 100,
      });

      expect(negViewport.yScale(0)).toBeCloseTo(50, 0.01);
      expect(negViewport.yScale(-100)).toBeCloseTo(100, 0.01);
      expect(negViewport.yScale(100)).toBeCloseTo(0, 0.01);
    });
  });
});
