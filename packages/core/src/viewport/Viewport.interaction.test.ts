import { describe, it, expect } from 'vitest';
import { Viewport } from './Viewport';

describe('Viewport - Interaction Methods', () => {
  describe('pan', () => {
    it('should pan time range forward (positive delta)', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.pan(100);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.start).toBe(100);
      expect(timeRange.end).toBe(1100);
    });

    it('should pan time range backward (negative delta)', () => {
      const viewport = new Viewport({
        time: { start: 1000, end: 2000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.pan(-500);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.start).toBe(500);
      expect(timeRange.end).toBe(1500);
    });

    it('should pan price range when price delta is provided', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 50, max: 150, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.pan(0, 10);

      const priceConfig = viewport.getPriceConfig();
      expect(priceConfig.min).toBe(60);
      expect(priceConfig.max).toBe(160);
    });

    it('should pan both time and price simultaneously', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 50, max: 150, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.pan(100, 10);

      const timeRange = viewport.getTimeRange();
      const priceConfig = viewport.getPriceConfig();
      expect(timeRange.start).toBe(100);
      expect(timeRange.end).toBe(1100);
      expect(priceConfig.min).toBe(60);
      expect(priceConfig.max).toBe(160);
    });
  });

  describe('zoom', () => {
    it('should zoom in (factor > 1)', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Zoom in by 2x centered at middle (x=400)
      viewport.zoom(2, 400);

      const timeRange = viewport.getTimeRange();
      const timeSpan = timeRange.end - timeRange.start;

      // Time span should be halved
      expect(timeSpan).toBe(500);
    });

    it('should zoom out (factor < 1)', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Zoom out by 0.5x centered at middle (x=400)
      viewport.zoom(0.5, 400);

      const timeRange = viewport.getTimeRange();
      const timeSpan = timeRange.end - timeRange.start;

      // Time span should be doubled
      expect(timeSpan).toBe(2000);
    });

    it('should preserve center point time during zoom', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Center point at x=400 should be at time 500
      const centerTimeBefore = viewport.invX(400);
      expect(centerTimeBefore).toBe(500);

      viewport.zoom(2, 400);

      // After zoom, same pixel position should still map to same time
      const centerTimeAfter = viewport.invX(400);
      expect(centerTimeAfter).toBeCloseTo(500, 1);
    });

    it('should zoom centered on left edge', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Zoom centered at x=0 (left edge, time=0)
      viewport.zoom(2, 0);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.start).toBeCloseTo(0, 1);
    });

    it('should zoom centered on right edge', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Zoom centered at x=800 (right edge, time=1000)
      viewport.zoom(2, 800);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.end).toBeCloseTo(1000, 1);
    });
  });

  describe('getVisibleBars', () => {
    it('should calculate visible bars correctly', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 10000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      const visibleBars = viewport.getVisibleBars(100, 100);
      expect(visibleBars).toBe(100); // 10000 / 100 = 100
    });

    it('should return 0 when total candles is 0', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      const visibleBars = viewport.getVisibleBars(0, 100);
      expect(visibleBars).toBe(0);
    });

    it('should return 0 when avg candle duration is 0', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 1000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      const visibleBars = viewport.getVisibleBars(100, 0);
      expect(visibleBars).toBe(0);
    });
  });

  describe('clampTimeRange', () => {
    it('should clamp span to minimum', () => {
      const viewport = new Viewport({
        time: { start: 500, end: 600 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Clamp to min span of 500
      viewport.clampTimeRange(0, 2000, 500, 1500);

      const timeRange = viewport.getTimeRange();
      const span = timeRange.end - timeRange.start;
      expect(span).toBe(500);
    });

    it('should clamp span to maximum', () => {
      const viewport = new Viewport({
        time: { start: 0, end: 2000 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Clamp to max span of 1500
      viewport.clampTimeRange(0, 3000, 500, 1500);

      const timeRange = viewport.getTimeRange();
      const span = timeRange.end - timeRange.start;
      expect(span).toBe(1500);
    });

    it('should clamp start to minimum time', () => {
      const viewport = new Viewport({
        time: { start: -100, end: 900 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.clampTimeRange(0, 2000, 500, 1500);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.start).toBe(0);
    });

    it('should clamp end to maximum time', () => {
      const viewport = new Viewport({
        time: { start: 1500, end: 2500 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      viewport.clampTimeRange(0, 2000, 500, 1500);

      const timeRange = viewport.getTimeRange();
      expect(timeRange.end).toBe(2000);
    });

    it('should preserve center when clamping span', () => {
      const viewport = new Viewport({
        time: { start: 450, end: 550 },
        price: { min: 0, max: 100, paddingPx: 0 },
        width: 800,
        height: 600,
      });

      // Center is at 500, span is 100, min span is 200
      viewport.clampTimeRange(0, 2000, 200, 1500);

      const timeRange = viewport.getTimeRange();
      const center = (timeRange.start + timeRange.end) / 2;
      expect(center).toBe(500);
      expect(timeRange.end - timeRange.start).toBe(200);
    });
  });
});
