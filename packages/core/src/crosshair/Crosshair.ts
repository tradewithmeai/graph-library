import type { Viewport } from '../viewport/Viewport';
import type { CandleSeries } from '../data/CandleSeries';
import type { Candle } from '../data/types';
import type { ChartEvent } from '../events/types';

/**
 * Crosshair position and snapped candle data
 */
export interface CrosshairState {
  /** X position in pixels */
  x: number;

  /** Y position in pixels */
  y: number;

  /** Snapped candle (if any) */
  candle: Candle | null;

  /** Index of snapped candle in series */
  candleIndex: number;

  /** Timestamp at cursor position */
  time: number;

  /** Price at cursor position */
  price: number;

  /** Is crosshair visible */
  visible: boolean;
}

/**
 * Manages crosshair state and candle snapping
 */
export class Crosshair {
  private viewport: Viewport;
  private series: CandleSeries | null = null;
  private state: CrosshairState = {
    x: 0,
    y: 0,
    candle: null,
    candleIndex: -1,
    time: 0,
    price: 0,
    visible: false,
  };

  constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  /**
   * Set the primary series for candle snapping
   */
  public setSeries(series: CandleSeries | null): void {
    this.series = series;
  }

  /**
   * Update crosshair position from pointer event
   */
  public onPointerMove(event: ChartEvent): void {
    this.state.x = event.chartX;
    this.state.y = event.chartY;
    this.state.visible = true;

    // Convert pixel coordinates to data space
    this.state.time = this.viewport.invX(event.chartX);
    this.state.price = this.viewport.invY(event.chartY);

    // Snap to nearest candle if series is available
    this.snapToCandle(this.state.time);
  }

  /**
   * Hide crosshair (on mouse leave)
   */
  public hide(): void {
    this.state.visible = false;
  }

  /**
   * Get current crosshair state
   */
  public getState(): Readonly<CrosshairState> {
    return this.state;
  }

  /**
   * Snap to the nearest visible candle using binary search
   */
  private snapToCandle(time: number): void {
    if (!this.series) {
      this.state.candle = null;
      this.state.candleIndex = -1;
      return;
    }

    const length = this.series.getLength();
    if (length === 0) {
      this.state.candle = null;
      this.state.candleIndex = -1;
      return;
    }

    // Get visible range
    const timeRange = this.viewport.getTimeRange();
    const firstVisibleIndex = this.series.firstIndexAtOrAfter(timeRange.start);
    const lastVisibleIndex = this.series.lastIndexAtOrBefore(timeRange.end);

    if (firstVisibleIndex === -1 || lastVisibleIndex === -1) {
      this.state.candle = null;
      this.state.candleIndex = -1;
      return;
    }

    // Find closest candle to the cursor time
    let closestIndex = -1;
    let minDistance = Number.MAX_VALUE;

    // Binary search to find approximate position, then check neighbors
    const searchIndex = this.series.firstIndexAtOrAfter(time);

    if (searchIndex !== -1) {
      // Check the found index and the one before it
      const indices = [searchIndex];
      if (searchIndex > 0) {
        indices.push(searchIndex - 1);
      }
      if (searchIndex < length - 1) {
        indices.push(searchIndex + 1);
      }

      for (const idx of indices) {
        if (idx >= firstVisibleIndex && idx <= lastVisibleIndex) {
          const candleTime = this.series.getTimestamp(idx);
          const distance = Math.abs(candleTime - time);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
          }
        }
      }
    } else {
      // Time is after all candles, use the last one
      closestIndex = lastVisibleIndex;
    }

    if (closestIndex !== -1) {
      this.state.candle = this.series.getCandle(closestIndex);
      this.state.candleIndex = closestIndex;
    } else {
      this.state.candle = null;
      this.state.candleIndex = -1;
    }
  }

  /**
   * Check if crosshair is visible
   */
  public isVisible(): boolean {
    return this.state.visible;
  }
}
