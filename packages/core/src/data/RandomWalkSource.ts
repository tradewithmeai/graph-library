import type { Candle } from './types';
import type { IDataSource, CandleUpdateCallback } from './IDataSource';

/**
 * Configuration for RandomWalkSource
 */
export interface RandomWalkConfig {
  /**
   * Starting price
   * @default 100
   */
  initialPrice?: number;

  /**
   * Maximum price change per update
   * @default 1
   */
  volatility?: number;

  /**
   * Update interval in milliseconds
   * @default 1000
   */
  interval?: number;

  /**
   * Candle duration in milliseconds
   * @default 5000 (5 seconds)
   */
  candleDuration?: number;

  /**
   * Base volume per candle
   * @default 100000
   */
  baseVolume?: number;

  /**
   * Unique identifier for this source
   */
  id?: string;
}

const DEFAULT_CONFIG: Required<Omit<RandomWalkConfig, 'id'>> = {
  initialPrice: 100,
  volatility: 1,
  interval: 1000,
  candleDuration: 5000,
  baseVolume: 100000,
};

/**
 * RandomWalkSource generates random walk price data
 *
 * Emits candle updates at a configurable interval. Updates the current
 * candle until its duration expires, then starts a new candle.
 *
 * Features:
 * - Configurable price volatility
 * - Realistic OHLCV generation
 * - Partial bar updates (last candle updates)
 * - Automatic new bar creation
 */
export class RandomWalkSource implements IDataSource {
  public readonly id?: string;

  private config: Required<Omit<RandomWalkConfig, 'id'>>;
  private subscribers: Set<CandleUpdateCallback> = new Set();
  private intervalId: number | null = null;
  private currentCandle: Candle | null = null;
  private currentPrice: number;
  private isRunning = false;

  /**
   * Create a new RandomWalkSource
   *
   * @param config - Configuration options
   */
  constructor(config: RandomWalkConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.id = config.id;
    this.currentPrice = this.config.initialPrice;
  }

  /**
   * Subscribe to candle updates
   *
   * @param callback - Function to call with candle updates
   * @returns Unsubscribe function
   */
  public subscribe(callback: CandleUpdateCallback): () => void {
    this.subscribers.add(callback);

    // Start on first subscriber
    if (this.subscribers.size === 1 && !this.isRunning) {
      this.start();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);

      // Stop when no more subscribers
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  /**
   * Start generating data
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentCandle = null;

    // Generate updates at configured interval
    this.intervalId = window.setInterval(() => {
      this.generateUpdate();
    }, this.config.interval);
  }

  /**
   * Stop generating data
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.currentCandle = null;
  }

  /**
   * Generate a candle update
   */
  private generateUpdate(): void {
    const now = Date.now();

    // Determine if we need a new candle
    const needNewCandle =
      !this.currentCandle || now - this.currentCandle.ts >= this.config.candleDuration;

    if (needNewCandle) {
      // Start a new candle
      const candleStart = this.currentCandle
        ? this.currentCandle.ts + this.config.candleDuration
        : Math.floor(now / this.config.candleDuration) * this.config.candleDuration;

      this.currentCandle = {
        ts: candleStart,
        open: this.currentPrice,
        high: this.currentPrice,
        low: this.currentPrice,
        close: this.currentPrice,
        volume: 0,
      };
    }

    if (!this.currentCandle) {
      return;
    }

    // Generate price movement (random walk)
    const change = (Math.random() - 0.5) * 2 * this.config.volatility;
    this.currentPrice = Math.max(1, this.currentPrice + change);

    // Update candle (create new object since Candle is readonly)
    this.currentCandle = {
      ts: this.currentCandle.ts,
      open: this.currentCandle.open,
      high: Math.max(this.currentCandle.high, this.currentPrice),
      low: Math.min(this.currentCandle.low, this.currentPrice),
      close: this.currentPrice,
      volume: (this.currentCandle.volume ?? 0) + Math.random() * this.config.baseVolume * 0.2,
    };

    // Notify subscribers
    this.notifySubscribers(this.currentCandle);
  }

  /**
   * Notify all subscribers of a candle update
   */
  private notifySubscribers(candle: Candle): void {
    // Create a copy to avoid mutation issues
    const candleCopy = { ...candle };

    for (const callback of this.subscribers) {
      try {
        callback(candleCopy);
      } catch (error) {
        console.error('Error in RandomWalkSource subscriber:', error);
      }
    }
  }

  /**
   * Get the current candle (if any)
   */
  public getCurrentCandle(): Candle | null {
    return this.currentCandle ? { ...this.currentCandle } : null;
  }

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  public updateConfig(config: Partial<RandomWalkConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (wasRunning && this.subscribers.size > 0) {
      this.start();
    }
  }
}
