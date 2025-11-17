import type { Candle } from './types';
import type { IDataSource, CandleUpdateCallback } from './IDataSource';

/**
 * Configuration for ArrayPlaybackSource
 */
export interface ArrayPlaybackConfig {
  /**
   * Array of candles to play back
   */
  data: Candle[];

  /**
   * Playback speed multiplier
   * @default 1 (real-time based on candle intervals)
   */
  speed?: number;

  /**
   * Whether to loop playback when reaching the end
   * @default false
   */
  loop?: boolean;

  /**
   * Fixed interval between updates (overrides speed calculation)
   * Useful for regular updates regardless of data timestamps
   * @default undefined (calculate from data)
   */
  fixedInterval?: number;

  /**
   * Unique identifier for this source
   */
  id?: string;
}

/**
 * ArrayPlaybackSource replays historical data in accelerated real-time
 *
 * Takes an array of historical candles and plays them back at a configurable
 * speed. Useful for testing, demos, and backtesting scenarios.
 *
 * Features:
 * - Configurable playback speed
 * - Optional looping
 * - Maintains original time intervals (scaled by speed)
 * - Proper cleanup on stop
 */
export class ArrayPlaybackSource implements IDataSource {
  public readonly id?: string;

  private data: Candle[];
  private speed: number;
  private loop: boolean;
  private fixedInterval?: number;
  private subscribers: Set<CandleUpdateCallback> = new Set();
  private timeoutId: number | null = null;
  private currentIndex = 0;
  private isRunning = false;
  private startTime = 0;

  /**
   * Create a new ArrayPlaybackSource
   *
   * @param config - Configuration options
   */
  constructor(config: ArrayPlaybackConfig) {
    if (!config.data || config.data.length === 0) {
      throw new Error('ArrayPlaybackSource requires non-empty data array');
    }

    this.data = [...config.data].sort((a, b) => a.ts - b.ts); // Ensure sorted
    this.speed = config.speed ?? 1;
    this.loop = config.loop ?? false;
    this.fixedInterval = config.fixedInterval;
    this.id = config.id;
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
   * Start playback
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.scheduleNext();
  }

  /**
   * Stop playback
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Reset playback to the beginning
   */
  public reset(): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.currentIndex = 0;
    this.startTime = Date.now();

    if (wasRunning && this.subscribers.size > 0) {
      this.start();
    }
  }

  /**
   * Schedule the next candle emission
   */
  private scheduleNext(): void {
    if (!this.isRunning || this.currentIndex >= this.data.length) {
      if (this.loop) {
        this.currentIndex = 0;
        this.startTime = Date.now();
        this.scheduleNext();
      } else {
        this.isRunning = false;
      }
      return;
    }

    // Calculate delay until next candle
    let delay: number;

    if (this.fixedInterval !== undefined) {
      // Use fixed interval
      delay = this.fixedInterval;
    } else if (this.currentIndex === 0) {
      // First candle: emit immediately
      delay = 0;
    } else {
      // Calculate delay based on time difference between candles
      const prevCandle = this.data[this.currentIndex - 1];
      const currentCandle = this.data[this.currentIndex];

      if (!prevCandle || !currentCandle) {
        delay = 0;
      } else {
        const timeDiff = currentCandle.ts - prevCandle.ts;

        // Scale by speed (higher speed = shorter delay)
        delay = timeDiff / this.speed;
      }
    }

    this.timeoutId = window.setTimeout(() => {
      this.emitCandle();
    }, delay);
  }

  /**
   * Emit the current candle to subscribers
   */
  private emitCandle(): void {
    if (this.currentIndex >= this.data.length) {
      return;
    }

    const candle = this.data[this.currentIndex];
    if (!candle) {
      this.currentIndex++;
      this.scheduleNext();
      return;
    }

    const firstCandle = this.data[0];
    if (!firstCandle) {
      this.currentIndex++;
      this.scheduleNext();
      return;
    }

    // Adjust timestamp to current time
    // This ensures the chart sees the data as "live"
    const adjustedCandle: Candle = {
      ts: this.startTime + (candle.ts - firstCandle.ts) * (1 / this.speed),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    };

    // Notify subscribers
    this.notifySubscribers(adjustedCandle);

    // Move to next candle
    this.currentIndex++;

    // Schedule next
    this.scheduleNext();
  }

  /**
   * Notify all subscribers of a candle update
   */
  private notifySubscribers(candle: Candle): void {
    for (const callback of this.subscribers) {
      try {
        callback(candle);
      } catch (error) {
        console.error('Error in ArrayPlaybackSource subscriber:', error);
      }
    }
  }

  /**
   * Get playback progress (0 to 1)
   */
  public getProgress(): number {
    if (this.data.length === 0) return 0;
    return this.currentIndex / this.data.length;
  }

  /**
   * Check if playback is complete
   */
  public isComplete(): boolean {
    return this.currentIndex >= this.data.length;
  }

  /**
   * Update playback speed
   *
   * @param speed - New speed multiplier
   */
  public setSpeed(speed: number): void {
    if (speed <= 0) {
      throw new Error('Speed must be positive');
    }

    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.speed = speed;

    if (wasRunning && this.subscribers.size > 0) {
      this.start();
    }
  }

  /**
   * Get current playback speed
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Get total number of candles
   */
  public getTotalCandles(): number {
    return this.data.length;
  }

  /**
   * Get current candle index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}
