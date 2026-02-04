import type { IRenderer } from '../renderer/IRenderer';
import type { CandleDataView } from '../data';
import type { CandleMeta } from '../data/types';
import type { Viewport } from '../viewport/Viewport';

/**
 * Per-candle draw callback for custom rendering or styling
 */
export type OnDrawCandle = (info: {
  index: number;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  meta?: CandleMeta;
  x: number;
  yOpen: number;
  yClose: number;
  yHigh: number;
  yLow: number;
  bodyWidth: number;
  color: string;
  renderer: IRenderer;
}) => void;

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
  private onDrawCandle: OnDrawCandle | null = null;

  /**
   * Create a new CandleRenderer
   *
   * @param style - Candle visual style (optional)
   */
  constructor(style?: Partial<CandleStyle>) {
    this.style = { ...defaultCandleStyle, ...style };
  }

  /**
   * Set a per-candle draw callback
   */
  public setOnDrawCandle(callback: OnDrawCandle | null): void {
    this.onDrawCandle = callback;
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

    // Compute actual candle interval from timestamps for stable width
    let avgCandleDuration: number;
    if (dataView.length >= 2) {
      const firstTs = dataView.ts[0]!;
      const lastTs = dataView.ts[dataView.length - 1]!;
      avgCandleDuration = (lastTs - firstTs) / (dataView.length - 1);
    } else {
      avgCandleDuration = timeSpan;
    }
    const rawBodyWidth = (avgCandleDuration / timeSpan) * width;

    // Apply spacing and clamp to min/max
    const bodyWidth = Math.max(minBodyWidth, Math.min(maxBodyWidth, rawBodyWidth * (1 - spacing)));

    // Pre-compute all candle geometries for batched drawing
    const n = dataView.length;
    const xs = new Float64Array(n);
    const yOpens = new Float64Array(n);
    const yCloses = new Float64Array(n);
    const yHighs = new Float64Array(n);
    const yLows = new Float64Array(n);
    const isUp = new Uint8Array(n); // 1 = up, 0 = down

    for (let i = 0; i < n; i++) {
      const ts = dataView.ts[i];
      const open = dataView.open[i];
      const close = dataView.close[i];
      const high = dataView.high[i];
      const low = dataView.low[i];

      if (
        ts === undefined ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined
      ) {
        continue;
      }

      xs[i] = viewport.xScale(ts);
      yOpens[i] = viewport.yScale(open);
      yCloses[i] = viewport.yScale(close);
      yHighs[i] = viewport.yScale(high);
      yLows[i] = viewport.yScale(low);
      isUp[i] = close >= open ? 1 : 0;
    }

    // Batch 1: Draw all up-color wicks in a single path
    renderer.beginPath();
    for (let i = 0; i < n; i++) {
      if (!isUp[i]) continue;
      const wickX = Math.floor(xs[i]!);
      renderer.moveTo(wickX, yHighs[i]!);
      renderer.lineTo(wickX, yLows[i]!);
    }
    renderer.stroke(upColor, wickWidth);

    // Batch 2: Draw all down-color wicks in a single path
    renderer.beginPath();
    for (let i = 0; i < n; i++) {
      if (isUp[i]) continue;
      const wickX = Math.floor(xs[i]!);
      renderer.moveTo(wickX, yHighs[i]!);
      renderer.lineTo(wickX, yLows[i]!);
    }
    renderer.stroke(downColor, wickWidth);

    // Batch 3: Draw all up-color bodies
    for (let i = 0; i < n; i++) {
      if (!isUp[i]) continue;
      const bodyX = Math.floor(xs[i]! - bodyWidth / 2);
      const bodyY = Math.min(yOpens[i]!, yCloses[i]!);
      const bodyHeight = Math.abs(yCloses[i]! - yOpens[i]!);

      if (bodyHeight < 1) {
        renderer.beginPath();
        renderer.moveTo(bodyX, bodyY);
        renderer.lineTo(bodyX + bodyWidth, bodyY);
        renderer.stroke(upColor, wickWidth);
      } else {
        renderer.fillRect(bodyX, bodyY, bodyWidth, bodyHeight, upColor);
      }
    }

    // Batch 4: Draw all down-color bodies
    for (let i = 0; i < n; i++) {
      if (isUp[i]) continue;
      const bodyX = Math.floor(xs[i]! - bodyWidth / 2);
      const bodyY = Math.min(yOpens[i]!, yCloses[i]!);
      const bodyHeight = Math.abs(yCloses[i]! - yOpens[i]!);

      if (bodyHeight < 1) {
        renderer.beginPath();
        renderer.moveTo(bodyX, bodyY);
        renderer.lineTo(bodyX + bodyWidth, bodyY);
        renderer.stroke(downColor, wickWidth);
      } else {
        renderer.fillRect(bodyX, bodyY, bodyWidth, bodyHeight, downColor);
      }
    }

    // Invoke per-candle callback if set
    if (this.onDrawCandle) {
      for (let i = 0; i < n; i++) {
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
        )
          continue;

        this.onDrawCandle({
          index: i,
          ts,
          open,
          high,
          low,
          close,
          meta: dataView.meta?.[i],
          x: xs[i]!,
          yOpen: yOpens[i]!,
          yClose: yCloses[i]!,
          yHigh: yHighs[i]!,
          yLow: yLows[i]!,
          bodyWidth,
          color: isUp[i] ? upColor : downColor,
          renderer,
        });
      }
    }
  }
}
