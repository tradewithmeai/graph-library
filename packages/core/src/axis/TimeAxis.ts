import type { TimestampMs, TimeRange } from '../data/types';

/**
 * Tick mark on the time axis
 */
export interface TimeTick {
  /**
   * Timestamp value
   */
  value: TimestampMs;

  /**
   * Pixel position
   */
  position: number;

  /**
   * Formatted label
   */
  label: string;
}

/**
 * Time axis tick formatter function
 */
export type TimeFormatter = (ts: TimestampMs) => string;

/**
 * Default time formatter (ISO string)
 */
export const defaultTimeFormatter: TimeFormatter = (ts: TimestampMs): string => {
  return new Date(ts).toISOString();
};

/**
 * Nice time intervals in milliseconds
 */
const TIME_INTERVALS = [
  1000, // 1 second
  5000, // 5 seconds
  10000, // 10 seconds
  30000, // 30 seconds
  60000, // 1 minute
  300000, // 5 minutes
  600000, // 10 minutes
  1800000, // 30 minutes
  3600000, // 1 hour
  7200000, // 2 hours
  14400000, // 4 hours
  21600000, // 6 hours
  43200000, // 12 hours
  86400000, // 1 day
  172800000, // 2 days
  604800000, // 1 week
  2592000000, // 30 days (approximate month)
  7776000000, // 90 days (approximate quarter)
  31536000000, // 365 days (approximate year)
];

/**
 * TimeAxis handles time axis scaling and tick generation
 *
 * Generates appropriate tick marks based on the visible time range
 * and available pixel width. Ticks are generated at "nice" intervals
 * (round numbers like 1min, 5min, 1hour, etc.)
 */
export class TimeAxis {
  private timeRange: TimeRange;
  private widthPx: number;
  private minTickSpacingPx: number;
  private formatter: TimeFormatter;

  /**
   * Create a new TimeAxis
   *
   * @param timeRange - Visible time range
   * @param widthPx - Available width in pixels
   * @param minTickSpacingPx - Minimum spacing between ticks in pixels (default: 80)
   * @param formatter - Optional tick label formatter
   */
  constructor(
    timeRange: TimeRange,
    widthPx: number,
    minTickSpacingPx: number = 80,
    formatter?: TimeFormatter,
  ) {
    this.timeRange = timeRange;
    this.widthPx = widthPx;
    this.minTickSpacingPx = minTickSpacingPx;
    this.formatter = formatter || defaultTimeFormatter;
  }

  /**
   * Set the time range
   *
   * @param timeRange - New time range
   */
  public setTimeRange(timeRange: TimeRange): void {
    this.timeRange = timeRange;
  }

  /**
   * Set the width in pixels
   *
   * @param widthPx - New width
   */
  public setWidth(widthPx: number): void {
    this.widthPx = widthPx;
  }

  /**
   * Set the minimum tick spacing
   *
   * @param spacingPx - Minimum spacing in pixels
   */
  public setMinTickSpacing(spacingPx: number): void {
    this.minTickSpacingPx = spacingPx;
  }

  /**
   * Set the tick formatter
   *
   * @param formatter - Tick label formatter
   */
  public setFormatter(formatter: TimeFormatter): void {
    this.formatter = formatter;
  }

  /**
   * Convert timestamp to pixel position
   *
   * @param ts - Timestamp
   * @returns Pixel position
   */
  public scale(ts: TimestampMs): number {
    const { start, end } = this.timeRange;
    const span = end - start;

    if (span === 0) return 0;

    return ((ts - start) / span) * this.widthPx;
  }

  /**
   * Convert pixel position to timestamp
   *
   * @param px - Pixel position
   * @returns Timestamp
   */
  public invert(px: number): TimestampMs {
    const { start, end } = this.timeRange;
    const span = end - start;

    if (this.widthPx === 0) return start;

    return start + (px / this.widthPx) * span;
  }

  /**
   * Generate tick marks for the current configuration
   *
   * @returns Array of tick marks
   */
  public generateTicks(): TimeTick[] {
    if (this.widthPx <= 0) return [];

    const { start, end } = this.timeRange;
    const timeSpan = end - start;

    if (timeSpan <= 0) return [];

    // Calculate maximum number of ticks that can fit
    const maxTicks = Math.floor(this.widthPx / this.minTickSpacingPx);

    if (maxTicks <= 0) return [];

    // Find appropriate tick interval
    const interval = this.findNiceInterval(timeSpan, maxTicks);

    // Generate ticks at nice intervals
    const ticks: TimeTick[] = [];

    // Round start time up to next interval
    const firstTick = Math.ceil(start / interval) * interval;

    for (let ts = firstTick; ts <= end; ts += interval) {
      const position = this.scale(ts);
      const label = this.formatter(ts);

      ticks.push({ value: ts, position, label });
    }

    return ticks;
  }

  /**
   * Find a "nice" interval that produces an appropriate number of ticks
   *
   * @param timeSpan - Total time span
   * @param maxTicks - Maximum number of ticks desired
   * @returns Interval in milliseconds
   */
  private findNiceInterval(timeSpan: number, maxTicks: number): number {
    const minInterval = timeSpan / maxTicks;

    // Find the smallest predefined interval that's >= minInterval
    for (const interval of TIME_INTERVALS) {
      if (interval >= minInterval) {
        return interval;
      }
    }

    // If no predefined interval is large enough, use a multiple of the largest
    const largestInterval = TIME_INTERVALS[TIME_INTERVALS.length - 1];
    if (!largestInterval) return timeSpan;

    const multiplier = Math.ceil(minInterval / largestInterval);
    return largestInterval * multiplier;
  }

  /**
   * Get the current time range
   */
  public getTimeRange(): TimeRange {
    return { ...this.timeRange };
  }

  /**
   * Get the current width
   */
  public getWidth(): number {
    return this.widthPx;
  }
}
