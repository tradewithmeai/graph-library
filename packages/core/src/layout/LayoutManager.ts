/**
 * Rectangle definition
 */
export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Complete layout configuration
 */
export interface ChartLayout {
  /**
   * Main chart area where candles are drawn
   */
  chartArea: LayoutRect;

  /**
   * Time axis area (bottom)
   */
  timeAxisArea: LayoutRect;

  /**
   * Price axis area (right)
   */
  priceAxisArea: LayoutRect;

  /**
   * Optional volume area (below main chart, above time axis)
   */
  volumeArea?: LayoutRect;

  /**
   * Total canvas dimensions
   */
  total: LayoutRect;
}

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  /**
   * Total width
   */
  width: number;

  /**
   * Total height
   */
  height: number;

  /**
   * Price axis width
   */
  priceAxisWidth: number;

  /**
   * Time axis height
   */
  timeAxisHeight: number;

  /**
   * Volume area height (0 to disable)
   */
  volumeHeight: number;

  /**
   * Padding around the chart
   */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * LayoutManager computes the layout rectangles for all chart components
 *
 * Layout structure:
 * +----------------------------------+
 * |           (padding top)          |
 * +-----+--------------------+-------+
 * |  p  |                    | price |
 * |  a  |    Chart Area      | axis  |
 * |  d  |                    |       |
 * +-----+--------------------+-------+
 * |     |   Volume (opt)     |       |
 * +-----+--------------------+-------+
 * |     |    Time Axis       |       |
 * +-----+--------------------+-------+
 * |         (padding bottom)         |
 * +----------------------------------+
 */
export class LayoutManager {
  private config: LayoutConfig;

  /**
   * Create a new LayoutManager
   *
   * @param config - Layout configuration
   */
  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Update the layout configuration
   *
   * @param config - New configuration
   */
  public setConfig(config: LayoutConfig): void {
    this.config = config;
  }

  /**
   * Compute the complete layout
   *
   * @returns Complete chart layout
   */
  public compute(): ChartLayout {
    const { width, height, priceAxisWidth, timeAxisHeight, volumeHeight, padding } = this.config;

    // Available space after padding
    const availableWidth = width - padding.left - padding.right;
    const availableHeight = height - padding.top - padding.bottom;

    // Chart area takes remaining space after axes
    const chartWidth = availableWidth - priceAxisWidth;
    const chartHeight = availableHeight - timeAxisHeight - volumeHeight;

    // Main chart area
    const chartArea: LayoutRect = {
      x: padding.left,
      y: padding.top,
      width: Math.max(0, chartWidth),
      height: Math.max(0, chartHeight),
    };

    // Time axis area (bottom)
    const timeAxisArea: LayoutRect = {
      x: padding.left,
      y: padding.top + chartHeight + volumeHeight,
      width: Math.max(0, chartWidth),
      height: timeAxisHeight,
    };

    // Price axis area (right)
    const priceAxisArea: LayoutRect = {
      x: padding.left + chartWidth,
      y: padding.top,
      width: priceAxisWidth,
      height: Math.max(0, chartHeight),
    };

    // Volume area (optional, between chart and time axis)
    let volumeArea: LayoutRect | undefined;
    if (volumeHeight > 0) {
      volumeArea = {
        x: padding.left,
        y: padding.top + chartHeight,
        width: Math.max(0, chartWidth),
        height: volumeHeight,
      };
    }

    // Total area
    const total: LayoutRect = {
      x: 0,
      y: 0,
      width,
      height,
    };

    return {
      chartArea,
      timeAxisArea,
      priceAxisArea,
      volumeArea,
      total,
    };
  }

  /**
   * Get the current configuration
   */
  public getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
