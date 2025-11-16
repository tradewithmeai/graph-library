/**
 * Timestamp in milliseconds since Unix epoch
 */
export type TimestampMs = number;

/**
 * Metadata that can be attached to a candle
 */
export interface CandleMeta {
  [key: string]: unknown;
}

/**
 * Immutable candlestick data structure
 */
export interface Candle {
  /**
   * Timestamp in milliseconds
   */
  readonly ts: TimestampMs;

  /**
   * Opening price
   */
  readonly open: number;

  /**
   * Highest price
   */
  readonly high: number;

  /**
   * Lowest price
   */
  readonly low: number;

  /**
   * Closing price
   */
  readonly close: number;

  /**
   * Trading volume (optional)
   */
  readonly volume?: number;

  /**
   * Additional metadata (optional)
   */
  readonly meta?: CandleMeta;
}

/**
 * Time range
 */
export interface TimeRange {
  start: TimestampMs;
  end: TimestampMs;
}

/**
 * Price range
 */
export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Viewport configuration for price axis
 */
export interface ViewportPriceConfig extends PriceRange {
  /**
   * Padding in pixels at top and bottom
   */
  paddingPx: number;
}

/**
 * Listener for data changes
 */
export type ChangeListener = () => void;
