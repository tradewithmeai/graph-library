import type { PriceRange } from '../data/types';

/**
 * Tick mark on the price axis
 */
export interface PriceTick {
  /**
   * Price value
   */
  value: number;

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
 * Price axis tick formatter function
 */
export type PriceFormatter = (price: number) => string;

/**
 * Default price formatter (2 decimal places)
 */
export const defaultPriceFormatter: PriceFormatter = (price: number): string => {
  return price.toFixed(2);
};

/**
 * Nice price intervals (base values to multiply)
 */
const PRICE_STEPS = [1, 2, 2.5, 5];

/**
 * PriceAxis handles price axis scaling and tick generation
 *
 * Generates appropriate tick marks based on the visible price range
 * and available pixel height. Ticks are generated at "nice" intervals
 * (round numbers).
 */
export class PriceAxis {
  private priceRange: PriceRange;
  private heightPx: number;
  private paddingPx: number;
  private minTickSpacingPx: number;
  private formatter: PriceFormatter;

  /**
   * Create a new PriceAxis
   *
   * @param priceRange - Visible price range
   * @param heightPx - Available height in pixels
   * @param paddingPx - Padding at top and bottom in pixels (default: 0)
   * @param minTickSpacingPx - Minimum spacing between ticks in pixels (default: 40)
   * @param formatter - Optional tick label formatter
   */
  constructor(
    priceRange: PriceRange,
    heightPx: number,
    paddingPx: number = 0,
    minTickSpacingPx: number = 40,
    formatter?: PriceFormatter,
  ) {
    this.priceRange = priceRange;
    this.heightPx = heightPx;
    this.paddingPx = paddingPx;
    this.minTickSpacingPx = minTickSpacingPx;
    this.formatter = formatter || defaultPriceFormatter;
  }

  /**
   * Set the price range
   *
   * @param priceRange - New price range
   */
  public setPriceRange(priceRange: PriceRange): void {
    this.priceRange = priceRange;
  }

  /**
   * Set the height in pixels
   *
   * @param heightPx - New height
   */
  public setHeight(heightPx: number): void {
    this.heightPx = heightPx;
  }

  /**
   * Set the padding in pixels
   *
   * @param paddingPx - New padding
   */
  public setPadding(paddingPx: number): void {
    this.paddingPx = paddingPx;
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
  public setFormatter(formatter: PriceFormatter): void {
    this.formatter = formatter;
  }

  /**
   * Convert price to pixel position
   *
   * Y-axis is inverted (higher prices → lower Y values)
   *
   * @param price - Price value
   * @returns Pixel position
   */
  public scale(price: number): number {
    const { min, max } = this.priceRange;
    const span = max - min;

    if (span === 0) {
      return this.heightPx / 2;
    }

    const availableHeight = this.heightPx - 2 * this.paddingPx;
    const normalizedPrice = (price - min) / span;

    // Invert Y-axis: high prices at top (low Y), low prices at bottom (high Y)
    return this.paddingPx + availableHeight * (1 - normalizedPrice);
  }

  /**
   * Convert pixel position to price
   *
   * @param px - Pixel position
   * @returns Price value
   */
  public invert(px: number): number {
    const { min, max } = this.priceRange;
    const span = max - min;
    const availableHeight = this.heightPx - 2 * this.paddingPx;

    if (availableHeight === 0) {
      return (min + max) / 2;
    }

    // Invert Y-axis: low Y → high price, high Y → low price
    const normalizedY = 1 - (px - this.paddingPx) / availableHeight;

    return min + normalizedY * span;
  }

  /**
   * Generate tick marks for the current configuration
   *
   * @returns Array of tick marks
   */
  public generateTicks(): PriceTick[] {
    const availableHeight = this.heightPx - 2 * this.paddingPx;

    if (availableHeight <= 0) return [];

    const { min, max } = this.priceRange;
    const priceSpan = max - min;

    if (priceSpan <= 0) return [];

    // Calculate maximum number of ticks that can fit
    const maxTicks = Math.floor(availableHeight / this.minTickSpacingPx);

    if (maxTicks <= 0) return [];

    // Find appropriate tick interval
    const interval = this.findNiceInterval(priceSpan, maxTicks);

    // Generate ticks at nice intervals
    const ticks: PriceTick[] = [];

    // Round min price up to next interval
    const firstTick = Math.ceil(min / interval) * interval;

    for (let price = firstTick; price <= max; price += interval) {
      // Avoid floating point errors
      const roundedPrice = Math.round(price / interval) * interval;

      const position = this.scale(roundedPrice);
      const label = this.formatter(roundedPrice);

      ticks.push({ value: roundedPrice, position, label });
    }

    return ticks;
  }

  /**
   * Find a "nice" interval that produces an appropriate number of ticks
   *
   * @param priceSpan - Total price span
   * @param maxTicks - Maximum number of ticks desired
   * @returns Interval value
   */
  private findNiceInterval(priceSpan: number, maxTicks: number): number {
    const minInterval = priceSpan / maxTicks;

    // Find the order of magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(minInterval)));

    // Try nice steps in this magnitude
    for (const step of PRICE_STEPS) {
      const interval = step * magnitude;
      if (interval >= minInterval) {
        return interval;
      }
    }

    // If no step works, use 10x the magnitude
    return 10 * magnitude;
  }

  /**
   * Get the current price range
   */
  public getPriceRange(): PriceRange {
    return { ...this.priceRange };
  }

  /**
   * Get the current height
   */
  public getHeight(): number {
    return this.heightPx;
  }

  /**
   * Get the current padding
   */
  public getPadding(): number {
    return this.paddingPx;
  }
}
