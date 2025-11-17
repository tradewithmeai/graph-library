import type { Candle, TimestampMs, PriceRange, TimeRange, ChangeListener } from './types';

/**
 * View into a subset of candle data
 */
export interface CandleDataView {
  ts: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume?: Float64Array;
  startIndex: number;
  endIndex: number;
  length: number;
}

/**
 * High-performance candle series using typed arrays
 *
 * Stores candlestick data in columnar format using typed arrays for
 * efficient access and memory usage. Data is kept sorted by timestamp.
 */
export class CandleSeries {
  private ts: Float64Array;
  private open: Float64Array;
  private high: Float64Array;
  private low: Float64Array;
  private close: Float64Array;
  private volume: Float64Array | null;
  private hasVolume: boolean;
  private length: number;
  private listeners: Set<ChangeListener>;

  /**
   * Create a new CandleSeries
   *
   * @param candles - Array of candles to initialize with
   */
  constructor(candles: Candle[] = []) {
    this.listeners = new Set();
    this.length = 0;
    this.hasVolume = false;

    // Initialize with empty arrays
    this.ts = new Float64Array(0);
    this.open = new Float64Array(0);
    this.high = new Float64Array(0);
    this.low = new Float64Array(0);
    this.close = new Float64Array(0);
    this.volume = null;

    if (candles.length > 0) {
      this.setData(candles);
    }
  }

  /**
   * Replace all data in the series
   *
   * @param candles - New candles to set
   */
  public setData(candles: Candle[]): void {
    if (candles.length === 0) {
      this.length = 0;
      this.ts = new Float64Array(0);
      this.open = new Float64Array(0);
      this.high = new Float64Array(0);
      this.low = new Float64Array(0);
      this.close = new Float64Array(0);
      this.volume = null;
      this.hasVolume = false;
      this.notifyListeners();
      return;
    }

    // Sort by timestamp (stable sort)
    const sorted = [...candles].sort((a, b) => a.ts - b.ts);

    // Check if any candle has volume
    this.hasVolume = sorted.some((c) => c.volume !== undefined);

    // Allocate typed arrays
    this.length = sorted.length;
    this.ts = new Float64Array(this.length);
    this.open = new Float64Array(this.length);
    this.high = new Float64Array(this.length);
    this.low = new Float64Array(this.length);
    this.close = new Float64Array(this.length);
    this.volume = this.hasVolume ? new Float64Array(this.length) : null;

    // Populate arrays
    for (let i = 0; i < this.length; i++) {
      const candle = sorted[i];
      if (!candle) continue;

      this.ts[i] = candle.ts;
      this.open[i] = candle.open;
      this.high[i] = candle.high;
      this.low[i] = candle.low;
      this.close[i] = candle.close;

      if (this.volume && candle.volume !== undefined) {
        this.volume[i] = candle.volume;
      }
    }

    this.notifyListeners();
  }

  /**
   * Get the number of candles in the series
   */
  public getLength(): number {
    return this.length;
  }

  /**
   * Binary search: find first index where ts >= target
   *
   * @param target - Target timestamp
   * @returns Index of first candle at or after target, or length if not found
   */
  public firstIndexAtOrAfter(target: TimestampMs): number {
    if (this.length === 0) return 0;

    let left = 0;
    let right = this.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midTs = this.ts[mid];

      if (midTs === undefined) break;

      if (midTs < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  /**
   * Binary search: find last index where ts <= target
   *
   * @param target - Target timestamp
   * @returns Index of last candle at or before target, or -1 if not found
   */
  public lastIndexAtOrBefore(target: TimestampMs): number {
    if (this.length === 0) return -1;

    let left = -1;
    let right = this.length - 1;

    while (left < right) {
      const mid = Math.ceil((left + right) / 2);
      const midTs = this.ts[mid];

      if (midTs === undefined) break;

      if (midTs > target) {
        right = mid - 1;
      } else {
        left = mid;
      }
    }

    return left;
  }

  /**
   * Get a view of data by index range
   *
   * Returns views (subarrays) of the underlying typed arrays, not copies.
   *
   * @param startIndex - Start index (inclusive)
   * @param endIndex - End index (exclusive)
   * @returns View of the data
   */
  public rangeByIndex(startIndex: number, endIndex: number): CandleDataView {
    const start = Math.max(0, startIndex);
    const end = Math.min(this.length, endIndex);

    if (start >= end) {
      return {
        ts: new Float64Array(0),
        open: new Float64Array(0),
        high: new Float64Array(0),
        low: new Float64Array(0),
        close: new Float64Array(0),
        volume: this.hasVolume ? new Float64Array(0) : undefined,
        startIndex: start,
        endIndex: start,
        length: 0,
      };
    }

    return {
      ts: this.ts.subarray(start, end),
      open: this.open.subarray(start, end),
      high: this.high.subarray(start, end),
      low: this.low.subarray(start, end),
      close: this.close.subarray(start, end),
      volume: this.volume ? this.volume.subarray(start, end) : undefined,
      startIndex: start,
      endIndex: end,
      length: end - start,
    };
  }

  /**
   * Get a view of data by time range
   *
   * @param startTime - Start timestamp (inclusive)
   * @param endTime - End timestamp (inclusive)
   * @returns View of the data
   */
  public rangeByTime(startTime: TimestampMs, endTime: TimestampMs): CandleDataView {
    const startIndex = this.firstIndexAtOrAfter(startTime);
    const endIndex = this.lastIndexAtOrBefore(endTime) + 1;

    return this.rangeByIndex(startIndex, endIndex);
  }

  /**
   * Get the time domain (min and max timestamps)
   *
   * @returns Time range or null if empty
   */
  public domainX(): TimeRange | null {
    if (this.length === 0) return null;

    const start = this.ts[0];
    const end = this.ts[this.length - 1];

    if (start === undefined || end === undefined) return null;

    return { start, end };
  }

  /**
   * Get the price domain (min and max prices)
   *
   * @param xRange - Optional time range to constrain the search
   * @returns Price range or null if empty
   */
  public domainY(xRange?: TimeRange): PriceRange | null {
    if (this.length === 0) return null;

    let startIndex = 0;
    let endIndex = this.length;

    if (xRange) {
      startIndex = this.firstIndexAtOrAfter(xRange.start);
      endIndex = this.lastIndexAtOrBefore(xRange.end) + 1;
    }

    if (startIndex >= endIndex) return null;

    let min = Infinity;
    let max = -Infinity;

    for (let i = startIndex; i < endIndex; i++) {
      const low = this.low[i];
      const high = this.high[i];

      if (low !== undefined && low < min) min = low;
      if (high !== undefined && high > max) max = high;
    }

    if (!isFinite(min) || !isFinite(max)) return null;

    return { min, max };
  }

  /**
   * Subscribe to data changes
   *
   * @param listener - Callback to invoke when data changes
   * @returns Unsubscribe function
   */
  public onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of data changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Get a candle at a specific index
   *
   * @param index - Index of the candle
   * @returns Candle object or null if out of bounds
   */
  public getCandle(index: number): Candle | null {
    if (index < 0 || index >= this.length) return null;

    const ts = this.ts[index];
    const open = this.open[index];
    const high = this.high[index];
    const low = this.low[index];
    const close = this.close[index];

    if (
      ts === undefined ||
      open === undefined ||
      high === undefined ||
      low === undefined ||
      close === undefined
    ) {
      return null;
    }

    let volume: number | undefined;
    if (this.volume) {
      const vol = this.volume[index];
      if (vol !== undefined) {
        volume = vol;
      }
    }

    const candle: Candle = { ts, open, high, low, close, volume };

    return candle;
  }

  /**
   * Get timestamp at a specific index
   *
   * @param index - Index of the candle
   * @returns Timestamp in milliseconds or -1 if out of bounds
   */
  public getTimestamp(index: number): TimestampMs {
    if (index < 0 || index >= this.length) return -1;
    const ts = this.ts[index];
    return ts !== undefined ? ts : -1;
  }

  /**
   * Get all candles as an array
   *
   * @returns Array of candles
   */
  public toArray(): Candle[] {
    const result: Candle[] = [];

    for (let i = 0; i < this.length; i++) {
      const candle = this.getCandle(i);
      if (candle) {
        result.push(candle);
      }
    }

    return result;
  }
}
