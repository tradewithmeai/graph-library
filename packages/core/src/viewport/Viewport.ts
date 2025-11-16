import type { TimestampMs, TimeRange, ViewportPriceConfig } from '../data/types';

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  /**
   * Time range visible in the viewport
   */
  time: TimeRange;

  /**
   * Price range and padding configuration
   */
  price: ViewportPriceConfig;

  /**
   * Width of the viewport in pixels
   */
  width: number;

  /**
   * Height of the viewport in pixels
   */
  height: number;
}

/**
 * Viewport manages coordinate transformations between data space and pixel space
 *
 * Provides bidirectional mapping:
 * - Time (ms) ↔ X (pixels)
 * - Price ↔ Y (pixels)
 *
 * The Y-axis is inverted (0 at top, height at bottom) following canvas convention.
 */
export class Viewport {
  private timeRange: TimeRange;
  private priceConfig: ViewportPriceConfig;
  private width: number;
  private height: number;

  /**
   * Create a new Viewport
   *
   * @param config - Viewport configuration
   */
  constructor(config: ViewportConfig) {
    this.timeRange = config.time;
    this.priceConfig = config.price;
    this.width = config.width;
    this.height = config.height;
  }

  /**
   * Get the current time range
   */
  public getTimeRange(): TimeRange {
    return { ...this.timeRange };
  }

  /**
   * Get the current price configuration
   */
  public getPriceConfig(): ViewportPriceConfig {
    return { ...this.priceConfig };
  }

  /**
   * Get viewport dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Update the time range
   *
   * @param timeRange - New time range
   */
  public setTimeRange(timeRange: TimeRange): void {
    this.timeRange = { ...timeRange };
  }

  /**
   * Update the price configuration
   *
   * @param priceConfig - New price configuration
   */
  public setPriceConfig(priceConfig: ViewportPriceConfig): void {
    this.priceConfig = { ...priceConfig };
  }

  /**
   * Update viewport dimensions
   *
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  public setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Update entire viewport configuration
   *
   * @param config - New viewport configuration
   */
  public setConfig(config: ViewportConfig): void {
    this.timeRange = { ...config.time };
    this.priceConfig = { ...config.price };
    this.width = config.width;
    this.height = config.height;
  }

  /**
   * Convert timestamp to X pixel coordinate
   *
   * Maps time domain to [0, width] pixel space
   *
   * @param ts - Timestamp in milliseconds
   * @returns X coordinate in pixels
   */
  public xScale(ts: TimestampMs): number {
    const { start, end } = this.timeRange;
    const timeSpan = end - start;

    if (timeSpan === 0) return 0;

    return ((ts - start) / timeSpan) * this.width;
  }

  /**
   * Convert price to Y pixel coordinate
   *
   * Maps price domain to [paddingPx, height - paddingPx] pixel space
   * Y-axis is inverted (higher prices → lower Y values)
   *
   * @param price - Price value
   * @returns Y coordinate in pixels
   */
  public yScale(price: number): number {
    const { min, max, paddingPx } = this.priceConfig;
    const priceSpan = max - min;

    if (priceSpan === 0) {
      return this.height / 2;
    }

    const availableHeight = this.height - 2 * paddingPx;
    const normalizedPrice = (price - min) / priceSpan;

    // Invert Y-axis: high prices at top (low Y), low prices at bottom (high Y)
    return paddingPx + availableHeight * (1 - normalizedPrice);
  }

  /**
   * Convert X pixel coordinate to timestamp
   *
   * Inverse of xScale
   *
   * @param px - X coordinate in pixels
   * @returns Timestamp in milliseconds
   */
  public invX(px: number): TimestampMs {
    const { start, end } = this.timeRange;
    const timeSpan = end - start;

    if (this.width === 0) return start;

    return start + (px / this.width) * timeSpan;
  }

  /**
   * Convert Y pixel coordinate to price
   *
   * Inverse of yScale
   *
   * @param px - Y coordinate in pixels
   * @returns Price value
   */
  public invY(px: number): number {
    const { min, max, paddingPx } = this.priceConfig;
    const priceSpan = max - min;
    const availableHeight = this.height - 2 * paddingPx;

    if (availableHeight === 0) {
      return (min + max) / 2;
    }

    // Invert Y-axis: low Y → high price, high Y → low price
    const normalizedY = 1 - (px - paddingPx) / availableHeight;

    return min + normalizedY * priceSpan;
  }

  /**
   * Check if a timestamp is visible in the viewport
   *
   * @param ts - Timestamp to check
   * @returns True if the timestamp is within the visible time range
   */
  public isTimeVisible(ts: TimestampMs): boolean {
    return ts >= this.timeRange.start && ts <= this.timeRange.end;
  }

  /**
   * Check if a price is visible in the viewport
   *
   * @param price - Price to check
   * @returns True if the price is within the visible price range
   */
  public isPriceVisible(price: number): boolean {
    return price >= this.priceConfig.min && price <= this.priceConfig.max;
  }

  /**
   * Get the time span of the viewport in milliseconds
   */
  public getTimeSpan(): number {
    return this.timeRange.end - this.timeRange.start;
  }

  /**
   * Get the price span of the viewport
   */
  public getPriceSpan(): number {
    return this.priceConfig.max - this.priceConfig.min;
  }
}
