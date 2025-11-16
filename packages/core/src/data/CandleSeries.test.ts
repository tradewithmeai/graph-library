import { describe, it, expect, beforeEach } from 'vitest';
import { CandleSeries } from './CandleSeries';
import type { Candle } from './types';

describe('CandleSeries', () => {
  let series: CandleSeries;
  let sampleCandles: Candle[];

  beforeEach(() => {
    sampleCandles = [
      { ts: 1000, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
      { ts: 2000, open: 105, high: 115, low: 100, close: 110, volume: 1500 },
      { ts: 3000, open: 110, high: 120, low: 105, close: 115, volume: 2000 },
      { ts: 4000, open: 115, high: 125, low: 110, close: 120, volume: 2500 },
      { ts: 5000, open: 120, high: 130, low: 115, close: 125, volume: 3000 },
    ];
    series = new CandleSeries(sampleCandles);
  });

  describe('constructor and setData', () => {
    it('should create an empty series', () => {
      const empty = new CandleSeries();
      expect(empty.getLength()).toBe(0);
    });

    it('should initialize with candles', () => {
      expect(series.getLength()).toBe(5);
    });

    it('should sort candles by timestamp', () => {
      const unsorted: Candle[] = [
        { ts: 3000, open: 110, high: 120, low: 105, close: 115 },
        { ts: 1000, open: 100, high: 110, low: 95, close: 105 },
        { ts: 2000, open: 105, high: 115, low: 100, close: 110 },
      ];
      const sorted = new CandleSeries(unsorted);
      const domain = sorted.domainX();
      expect(domain?.start).toBe(1000);
      expect(domain?.end).toBe(3000);
    });

    it('should handle empty data', () => {
      series.setData([]);
      expect(series.getLength()).toBe(0);
      expect(series.domainX()).toBeNull();
      expect(series.domainY()).toBeNull();
    });
  });

  describe('binary search', () => {
    describe('firstIndexAtOrAfter', () => {
      it('should find exact match', () => {
        expect(series.firstIndexAtOrAfter(3000)).toBe(2);
      });

      it('should find first index after target', () => {
        expect(series.firstIndexAtOrAfter(2500)).toBe(2);
      });

      it('should return 0 for value before start', () => {
        expect(series.firstIndexAtOrAfter(500)).toBe(0);
      });

      it('should return length for value after end', () => {
        expect(series.firstIndexAtOrAfter(6000)).toBe(5);
      });

      it('should return 0 for empty series', () => {
        const empty = new CandleSeries();
        expect(empty.firstIndexAtOrAfter(1000)).toBe(0);
      });

      it('should be monotonic', () => {
        // Test monotonicity: if ts1 < ts2, then firstIndex(ts1) <= firstIndex(ts2)
        const timestamps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500];
        let prevIndex = -1;

        for (const ts of timestamps) {
          const index = series.firstIndexAtOrAfter(ts);
          expect(index).toBeGreaterThanOrEqual(prevIndex);
          prevIndex = index;
        }
      });
    });

    describe('lastIndexAtOrBefore', () => {
      it('should find exact match', () => {
        expect(series.lastIndexAtOrBefore(3000)).toBe(2);
      });

      it('should find last index before target', () => {
        expect(series.lastIndexAtOrBefore(2500)).toBe(1);
      });

      it('should return -1 for value before start', () => {
        expect(series.lastIndexAtOrBefore(500)).toBe(-1);
      });

      it('should return last index for value after end', () => {
        expect(series.lastIndexAtOrBefore(6000)).toBe(4);
      });

      it('should return -1 for empty series', () => {
        const empty = new CandleSeries();
        expect(empty.lastIndexAtOrBefore(1000)).toBe(-1);
      });

      it('should be monotonic', () => {
        // Test monotonicity: if ts1 < ts2, then lastIndex(ts1) <= lastIndex(ts2)
        const timestamps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500];
        let prevIndex = -2;

        for (const ts of timestamps) {
          const index = series.lastIndexAtOrBefore(ts);
          expect(index).toBeGreaterThanOrEqual(prevIndex);
          prevIndex = index;
        }
      });
    });

    it('should satisfy complementary relationship', () => {
      // For any value, firstAtOrAfter and lastAtOrBefore should be adjacent or overlapping
      const testValues = [500, 1000, 1500, 2000, 3000, 4500, 5000, 6000];

      for (const ts of testValues) {
        const first = series.firstIndexAtOrAfter(ts);
        const last = series.lastIndexAtOrBefore(ts);

        // Either they point to the same element (exact match) or last + 1 === first
        expect(first - last).toBeGreaterThanOrEqual(0);
        expect(first - last).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('range queries', () => {
    describe('rangeByIndex', () => {
      it('should return correct range', () => {
        const view = series.rangeByIndex(1, 4);
        expect(view.length).toBe(3);
        expect(view.startIndex).toBe(1);
        expect(view.endIndex).toBe(4);
        expect(view.ts[0]).toBe(2000);
        expect(view.ts[2]).toBe(4000);
      });

      it('should return views, not copies', () => {
        const view1 = series.rangeByIndex(0, 2);
        const view2 = series.rangeByIndex(0, 2);
        // Views of the same data should have the same buffer
        expect(view1.ts.buffer).toBe(view2.ts.buffer);
      });

      it('should handle out of bounds indices', () => {
        const view = series.rangeByIndex(-5, 100);
        expect(view.length).toBe(5);
        expect(view.startIndex).toBe(0);
        expect(view.endIndex).toBe(5);
      });

      it('should return empty view for invalid range', () => {
        const view = series.rangeByIndex(3, 1);
        expect(view.length).toBe(0);
      });
    });

    describe('rangeByTime', () => {
      it('should return correct time range', () => {
        const view = series.rangeByTime(2000, 4000);
        expect(view.length).toBe(3);
        expect(view.ts[0]).toBe(2000);
        expect(view.ts[2]).toBe(4000);
      });

      it('should include partial ranges', () => {
        const view = series.rangeByTime(1500, 3500);
        expect(view.length).toBe(2);
        expect(view.ts[0]).toBe(2000);
        expect(view.ts[1]).toBe(3000);
      });

      it('should return empty for non-overlapping range', () => {
        const view = series.rangeByTime(6000, 7000);
        expect(view.length).toBe(0);
      });
    });
  });

  describe('domain functions', () => {
    describe('domainX', () => {
      it('should return correct time domain', () => {
        const domain = series.domainX();
        expect(domain).toEqual({ start: 1000, end: 5000 });
      });

      it('should return null for empty series', () => {
        const empty = new CandleSeries();
        expect(empty.domainX()).toBeNull();
      });
    });

    describe('domainY', () => {
      it('should return correct price domain', () => {
        const domain = series.domainY();
        expect(domain).toEqual({ min: 95, max: 130 });
      });

      it('should respect time range constraint', () => {
        const domain = series.domainY({ start: 2000, end: 3000 });
        expect(domain).toEqual({ min: 100, max: 120 });
      });

      it('should return null for empty series', () => {
        const empty = new CandleSeries();
        expect(empty.domainY()).toBeNull();
      });

      it('should return null for non-overlapping time range', () => {
        const domain = series.domainY({ start: 6000, end: 7000 });
        expect(domain).toBeNull();
      });
    });
  });

  describe('change notifications', () => {
    it('should notify listeners on data change', () => {
      let called = false;
      series.onChange(() => {
        called = true;
      });

      series.setData([{ ts: 1000, open: 100, high: 110, low: 90, close: 105 }]);
      expect(called).toBe(true);
    });

    it('should allow unsubscribe', () => {
      let callCount = 0;
      const unsubscribe = series.onChange(() => {
        callCount++;
      });

      series.setData([{ ts: 1000, open: 100, high: 110, low: 90, close: 105 }]);
      expect(callCount).toBe(1);

      unsubscribe();

      series.setData([{ ts: 2000, open: 100, high: 110, low: 90, close: 105 }]);
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('getCandle and toArray', () => {
    it('should get candle by index', () => {
      const candle = series.getCandle(2);
      expect(candle).toEqual({
        ts: 3000,
        open: 110,
        high: 120,
        low: 105,
        close: 115,
        volume: 2000,
      });
    });

    it('should return null for out of bounds index', () => {
      expect(series.getCandle(-1)).toBeNull();
      expect(series.getCandle(100)).toBeNull();
    });

    it('should convert to array', () => {
      const array = series.toArray();
      expect(array).toHaveLength(5);
      expect(array[0]).toEqual(sampleCandles[0]);
    });

    it('should handle candles without volume', () => {
      const noVolume: Candle[] = [
        { ts: 1000, open: 100, high: 110, low: 95, close: 105 },
        { ts: 2000, open: 105, high: 115, low: 100, close: 110 },
      ];
      const s = new CandleSeries(noVolume);
      const candle = s.getCandle(0);
      expect(candle?.volume).toBeUndefined();
    });
  });
});
