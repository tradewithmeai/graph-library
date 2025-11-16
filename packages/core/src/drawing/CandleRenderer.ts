import type { IRenderer } from '../renderer/IRenderer';
import type { CandleDataView } from '../data';
import type { Viewport } from '../viewport/Viewport';

/**
 * Candle visual style configuration
 */
export interface CandleStyle {
  /**
   * Color for bullish (close > open) candles
   */
  upColor: string;

  /**
   * Color for bearish (close < open) candles
   */
  downColor: string;

  /**
   * Wick (line) width in pixels
   */
  wickWidth: number;

  /**
   * Minimum body width in pixels (when zoomed out)
   */
  minBodyWidth: number;

  /**
   * Maximum body width in pixels (when zoomed in)
   */
  maxBodyWidth: number;

  /**
   * Spacing between candles as fraction of candle width (0-1)
   */
  spacing: number;
}

/**
 * Default candle style
 */
export const defaultCandleStyle: CandleStyle = {
  upColor: '#10b981', // Green
  downColor: '#ef4444', // Red
  wickWidth: 1,
  minBodyWidth: 1,
  maxBodyWidth: 20,
  spacing: 0.2,
};

/**
 * CandleRenderer handles drawing of candlestick charts
 *
 * Features:
 * - Efficient rendering of only visible candles
 * - Proper wick and body geometry
 * - Pixel-perfect alignment
 * - High-DPI support
 */
export class CandleRenderer {
  private style: CandleStyle;

  /**
   * Create a new CandleRenderer
   *
   * @param style - Candle visual style (optional)
   */
  constructor(style?: Partial<CandleStyle>) {
    this.style = { ...defaultCandleStyle, ...style };
  }

  /**
   * Update the candle style
   *
   * @param style - New style (partial)
   */
  public setStyle(style: Partial<CandleStyle>): void {
    this.style = { ...this.style, ...style };
  }

  /**
   * Get the current style
   */
  public getStyle(): CandleStyle {
    return { ...this.style };
  }

  /**
   * Draw candles for a data view
   *
   * @param renderer - Renderer instance
   * @param viewport - Viewport for coordinate transformation
   * @param dataView - Candle data to render
   */
  public draw(renderer: IRenderer, viewport: Viewport, dataView: CandleDataView): void {
    if (dataView.length === 0) return;

    const { upColor, downColor, wickWidth, minBodyWidth, maxBodyWidth, spacing } = this.style;

    // Calculate candle width based on time span and available pixels
    const timeSpan = viewport.getTimeSpan();
    const width = viewport.getDimensions().width;

    if (timeSpan === 0 || width === 0) return;

    // Approximate candle width: pixels per time unit * average candle duration
    const avgCandleDuration = timeSpan / dataView.length;
    const rawBodyWidth = (avgCandleDuration / timeSpan) * width;

    // Apply spacing and clamp to min/max
    const bodyWidth = Math.max(minBodyWidth, Math.min(maxBodyWidth, rawBodyWidth * (1 - spacing)));

    // Draw each visible candle
    for (let i = 0; i < dataView.length; i++) {
      const ts = dataView.ts[i];
      const open = dataView.open[i];
      const high = dataView.high[i];
      const low = dataView.low[i];
      const close = dataView.close[i];

      if (
        ts === undefined ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined
      ) {
        continue;
      }

      // Convert to pixel coordinates
      const x = viewport.xScale(ts);
      const yOpen = viewport.yScale(open);
      const yClose = viewport.yScale(close);
      const yHigh = viewport.yScale(high);
      const yLow = viewport.yScale(low);

      // Determine candle color
      const color = close >= open ? upColor : downColor;

      // Draw wick (high-low line)
      const wickX = Math.floor(x);
      renderer.beginPath();
      renderer.moveTo(wickX, yHigh);
      renderer.lineTo(wickX, yLow);
      renderer.stroke(color, wickWidth);

      // Draw body (open-close rectangle)
      const bodyX = Math.floor(x - bodyWidth / 2);
      const bodyY = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);

      // If body height is very small (doji), draw a horizontal line
      if (bodyHeight < 1) {
        renderer.beginPath();
        renderer.moveTo(bodyX, bodyY);
        renderer.lineTo(bodyX + bodyWidth, bodyY);
        renderer.stroke(color, wickWidth);
      } else {
        renderer.fillRect(bodyX, bodyY, bodyWidth, bodyHeight, color);
      }
    }
  }
}
