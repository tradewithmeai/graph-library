import type { Candle } from './types';

/**
 * Callback for receiving candle updates
 *
 * @param candle - The updated or new candle
 */
export type CandleUpdateCallback = (candle: Candle) => void;

/**
 * Callback for receiving batch candle updates
 *
 * @param candles - Array of candles
 */
export type CandleBatchCallback = (candles: Candle[]) => void;

/**
 * Data source interface for live and historical data
 *
 * Data sources provide a unified API for subscribing to real-time updates
 * and fetching historical data. This enables flexible integration with
 * various backends (WebSocket, REST API, local playback, etc.)
 */
export interface IDataSource {
  /**
   * Unique identifier for this data source (optional)
   */
  id?: string;

  /**
   * Subscribe to live candle updates
   *
   * The callback will be invoked whenever a new candle is available or
   * when an existing candle is updated (e.g., partial bar updates).
   *
   * @param callback - Function to call with candle updates
   * @returns Unsubscribe function
   */
  subscribe(callback: CandleUpdateCallback): () => void;

  /**
   * Subscribe to batch candle updates (optional)
   *
   * Some data sources may emit multiple candles at once for efficiency.
   * If not implemented, the chart will use the single-candle subscribe method.
   *
   * @param callback - Function to call with batch updates
   * @returns Unsubscribe function
   */
  subscribeBatch?(callback: CandleBatchCallback): () => void;

  /**
   * Fetch historical candles for a time range (optional)
   *
   * This method allows loading historical data on demand. If not implemented,
   * the chart will rely solely on subscribed updates.
   *
   * @param startTime - Start timestamp (inclusive)
   * @param endTime - End timestamp (inclusive)
   * @returns Promise resolving to array of candles
   */
  fetchRange?(startTime: number, endTime: number): Promise<Candle[]>;

  /**
   * Start the data source (optional)
   *
   * Some data sources may need explicit starting (e.g., WebSocket connection).
   * This method is called automatically when the first subscriber is added.
   */
  start?(): void;

  /**
   * Stop the data source (optional)
   *
   * Cleanup method called when all subscribers are removed.
   * Should close connections, clear timers, etc.
   */
  stop?(): void;
}
