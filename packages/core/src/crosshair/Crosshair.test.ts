import { describe, it, expect, beforeEach } from 'vitest';
import { Crosshair } from './Crosshair';
import { Viewport } from '../viewport/Viewport';
import { CandleSeries } from '../data/CandleSeries';
import type { Candle } from '../data/types';
import type { ChartEvent } from '../events/types';

describe('Crosshair', () => {
  let viewport: Viewport;
  let crosshair: Crosshair;
  let series: CandleSeries;

  beforeEach(() => {
    viewport = new Viewport({
      time: { start: 0, end: 1000 },
      price: { min: 0, max: 100, paddingPx: 0 },
      width: 800,
      height: 600,
    });
    crosshair = new Crosshair(viewport);

    // Create sample candles at regular intervals
    const candles: Candle[] = [];
    for (let i = 0; i < 10; i++) {
      candles.push({
        ts: i * 100,
        open: 50,
        high: 60,
        low: 40,
        close: 55,
        volume: 1000,
      });
    }
    series = new CandleSeries(candles);
    crosshair.setSeries(series);
  });

  describe('onPointerMove', () => {
    it('should update position and make crosshair visible', () => {
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 100,
        clientY: 200,
        chartX: 100,
        chartY: 200,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.visible).toBe(true);
      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
    });

    it('should convert pixel coordinates to time and price', () => {
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      // x=400 is middle of 800px width, should map to middle of time range (0-1000)
      expect(state.time).toBe(500);
      // y=300 is middle of 600px height, should map to middle of price range (0-100)
      expect(state.price).toBe(50);
    });

    it('should snap to nearest candle', () => {
      // Pointer at x=400 should map to time=500
      // Nearest candle should be at time=500
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle).not.toBeNull();
      expect(state.candle?.ts).toBe(500); // Candle at index 5
      expect(state.candleIndex).toBe(5);
    });

    it('should snap to closest candle when between two candles', () => {
      // Pointer at x=320 should map to time=400
      // Should snap to candle at time=400 (index 4)
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 320,
        clientY: 300,
        chartX: 320,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle?.ts).toBe(400);
      expect(state.candleIndex).toBe(4);
    });

    it('should handle pointer at left edge', () => {
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 0,
        clientY: 300,
        chartX: 0,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle?.ts).toBe(0);
      expect(state.candleIndex).toBe(0);
    });

    it('should handle pointer at right edge', () => {
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 800,
        clientY: 300,
        chartX: 800,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle?.ts).toBe(900);
      expect(state.candleIndex).toBe(9);
    });
  });

  describe('hide', () => {
    it('should hide crosshair', () => {
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);
      expect(crosshair.isVisible()).toBe(true);

      crosshair.hide();
      expect(crosshair.isVisible()).toBe(false);
    });
  });

  describe('snapping with zoomed viewport', () => {
    it('should only snap to visible candles', () => {
      // Zoom to show only candles 3-7
      viewport.setTimeRange({ start: 300, end: 700 });

      // Pointer at time=500 (middle of viewport)
      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle?.ts).toBe(500);
      expect(state.candleIndex).toBe(5);
    });

    it('should return null when no visible candles', () => {
      // Set viewport to range with no candles
      viewport.setTimeRange({ start: 10000, end: 20000 });

      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshair.onPointerMove(event);

      const state = crosshair.getState();
      expect(state.candle).toBeNull();
      expect(state.candleIndex).toBe(-1);
    });
  });

  describe('without series', () => {
    it('should not snap to candle when no series is set', () => {
      const crosshairNoSeries = new Crosshair(viewport);

      const event: ChartEvent = {
        type: 'pointermove',
        clientX: 400,
        clientY: 300,
        chartX: 400,
        chartY: 300,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        originalEvent: new Event('pointermove'),
      };

      crosshairNoSeries.onPointerMove(event);

      const state = crosshairNoSeries.getState();
      expect(state.candle).toBeNull();
      expect(state.candleIndex).toBe(-1);
      expect(state.time).toBe(500);
      expect(state.price).toBe(50);
    });
  });
});
