import type { IRenderer } from '../renderer/IRenderer';
import type { Viewport } from '../viewport/Viewport';
import type { Crosshair, CrosshairState } from './Crosshair';
import type { LayoutRect } from '../layout';

/**
 * Crosshair visual style
 */
export interface CrosshairStyle {
  /** Line color */
  lineColor: string;

  /** Line width */
  lineWidth: number;

  /** Line dash pattern */
  lineDash: number[];

  /** Highlight color for active candle */
  highlightColor: string;

  /** Highlight opacity */
  highlightOpacity: number;
}

/**
 * Default crosshair style
 */
export const defaultCrosshairStyle: CrosshairStyle = {
  lineColor: '#888888',
  lineWidth: 1,
  lineDash: [4, 4],
  highlightColor: '#ffffff',
  highlightOpacity: 0.1,
};

/**
 * Renders crosshair and active candle highlight
 */
export class CrosshairRenderer {
  private crosshair: Crosshair;
  private viewport: Viewport;
  private style: CrosshairStyle;

  constructor(
    crosshair: Crosshair,
    viewport: Viewport,
    style: CrosshairStyle = defaultCrosshairStyle,
  ) {
    this.crosshair = crosshair;
    this.viewport = viewport;
    this.style = style;
  }

  /**
   * Update style
   */
  public setStyle(style: Partial<CrosshairStyle>): void {
    this.style = { ...this.style, ...style };
  }

  /**
   * Draw crosshair on the chart
   */
  public draw(renderer: IRenderer, chartArea: LayoutRect): void {
    if (!this.crosshair.isVisible()) return;

    const state = this.crosshair.getState();

    // Draw active candle highlight if snapped
    if (state.candle) {
      this.drawCandleHighlight(renderer, state, chartArea);
    }

    // Draw crosshair lines
    this.drawCrosshairLines(renderer, state, chartArea);
  }

  /**
   * Draw vertical and horizontal crosshair lines
   */
  private drawCrosshairLines(
    renderer: IRenderer,
    state: CrosshairState,
    chartArea: LayoutRect,
  ): void {
    const { x, y } = state;
    const { x: chartX, y: chartY, width, height } = chartArea;

    renderer.save();

    // Set up dashed line style
    renderer.setLineDash(this.style.lineDash);

    // Draw vertical line
    if (x >= chartX && x <= chartX + width) {
      renderer.beginPath();
      renderer.moveTo(x, chartY);
      renderer.lineTo(x, chartY + height);
      renderer.stroke(this.style.lineColor, this.style.lineWidth);
    }

    // Draw horizontal line
    if (y >= chartY && y <= chartY + height) {
      renderer.beginPath();
      renderer.moveTo(chartX, y);
      renderer.lineTo(chartX + width, y);
      renderer.stroke(this.style.lineColor, this.style.lineWidth);
    }

    // Reset line dash
    renderer.setLineDash([]);

    renderer.restore();
  }

  /**
   * Draw highlight for the active candle
   */
  private drawCandleHighlight(
    renderer: IRenderer,
    state: CrosshairState,
    chartArea: LayoutRect,
  ): void {
    const { candle } = state;
    if (!candle) return;

    const { y: chartY, width, height } = chartArea;

    // Calculate candle X position and width
    const candleX = this.viewport.xScale(candle.ts);

    // Calculate candle width from the crosshair's series data
    const series = this.crosshair.getSeries();
    const timeSpan = this.viewport.getTimeSpan();
    const visibleCandleCount = series ? Math.max(1, series.getLength()) : 50;
    const avgCandleDuration = timeSpan / visibleCandleCount;
    const candleWidth = Math.max(2, (avgCandleDuration / timeSpan) * width * 0.8);

    const highlightX = candleX - candleWidth / 2;
    const highlightY = chartY;
    const highlightWidth = candleWidth;
    const highlightHeight = height;

    // Draw semi-transparent highlight
    renderer.save();

    // Set opacity
    renderer.setGlobalAlpha(this.style.highlightOpacity);

    renderer.fillRect(
      highlightX,
      highlightY,
      highlightWidth,
      highlightHeight,
      this.style.highlightColor,
    );

    renderer.restore();
  }
}
