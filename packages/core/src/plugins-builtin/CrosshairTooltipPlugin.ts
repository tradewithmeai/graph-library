import type { IPlugin, PluginContext } from '../plugins/types';
import type { IRenderer } from '../renderer/IRenderer';
import { RenderPhase } from '../plugins/types';
import type { Chart } from '../Chart';
import type { CrosshairState } from '../crosshair/Crosshair';
import type { LayoutRect } from '../layout/LayoutManager';

/**
 * Tooltip style configuration
 */
export interface TooltipStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  font: string;
  padding: number;
  borderRadius: number;
  maxWidth: number;
}

/**
 * Default tooltip style
 */
export const defaultTooltipStyle: TooltipStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderColor: '#666666',
  textColor: '#ffffff',
  font: '12px sans-serif',
  padding: 8,
  borderRadius: 4,
  maxWidth: 200,
};

/**
 * CrosshairTooltipPlugin displays a tooltip with OHLCV data at the crosshair position
 */
export class CrosshairTooltipPlugin implements IPlugin {
  public readonly name = 'crosshair-tooltip';
  private style: TooltipStyle;
  private chart: Chart | null = null;

  constructor(style: Partial<TooltipStyle> = {}) {
    this.style = { ...defaultTooltipStyle, ...style };
  }

  /**
   * Plugin installation hook
   */
  public onInstall(chart: unknown): void {
    this.chart = chart as Chart;
  }

  /**
   * Plugin uninstall hook
   */
  public onUninstall(_chart: unknown): void {
    this.chart = null;
  }

  /**
   * Render hook
   */
  public onRender(context: PluginContext): void {
    // Only render on AfterRender phase
    if (context.phase !== RenderPhase.AfterRender) return;
    if (!this.chart) return;

    const crosshairState = this.chart.getCrosshairState();
    if (!crosshairState || !crosshairState.visible || !crosshairState.candle) {
      return;
    }

    this.drawTooltip(context.renderer, crosshairState, context.layout.chartArea);
  }

  /**
   * Draw tooltip at crosshair position
   */
  private drawTooltip(
    renderer: IRenderer,
    crosshairState: CrosshairState,
    chartArea: LayoutRect,
  ): void {
    const { candle, x, y } = crosshairState;
    if (!candle) return;

    // Format values
    const date = new Date(candle.ts);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const lines = [
      `${dateStr} ${timeStr}`,
      `O: ${candle.open.toFixed(2)}`,
      `H: ${candle.high.toFixed(2)}`,
      `L: ${candle.low.toFixed(2)}`,
      `C: ${candle.close.toFixed(2)}`,
    ];

    if (candle.volume !== undefined) {
      lines.push(`V: ${this.formatVolume(candle.volume)}`);
    }

    // Measure text dimensions
    const lineHeight = 16;
    const textWidth = this.measureTextWidth(renderer, lines);
    const tooltipWidth = textWidth + this.style.padding * 2;
    const tooltipHeight = lines.length * lineHeight + this.style.padding * 2;

    // Position tooltip to avoid going off-screen
    let tooltipX = x + 10;
    let tooltipY = y + 10;

    // Flip to left if would go off right edge
    if (tooltipX + tooltipWidth > chartArea.x + chartArea.width) {
      tooltipX = x - tooltipWidth - 10;
    }

    // Flip to top if would go off bottom edge
    if (tooltipY + tooltipHeight > chartArea.y + chartArea.height) {
      tooltipY = y - tooltipHeight - 10;
    }

    // Clamp to chart area
    tooltipX = Math.max(
      chartArea.x,
      Math.min(tooltipX, chartArea.x + chartArea.width - tooltipWidth),
    );
    tooltipY = Math.max(
      chartArea.y,
      Math.min(tooltipY, chartArea.y + chartArea.height - tooltipHeight),
    );

    renderer.save();

    // Draw background with rounded corners (using simple rect for now)
    renderer.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, this.style.backgroundColor);
    renderer.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, this.style.borderColor, 1);

    // Draw text lines
    for (let i = 0; i < lines.length; i++) {
      const textX = tooltipX + this.style.padding;
      const textY = tooltipY + this.style.padding + i * lineHeight + lineHeight / 2;
      const line = lines[i];
      if (line) {
        renderer.drawText(
          line,
          textX,
          textY,
          this.style.textColor,
          this.style.font,
          'left',
          'middle',
        );
      }
    }

    renderer.restore();
  }

  /**
   * Measure maximum text width
   */
  private measureTextWidth(renderer: IRenderer, lines: string[]): number {
    let maxWidth = 0;
    for (const line of lines) {
      const width = renderer.measureText(line, this.style.font);
      maxWidth = Math.max(maxWidth, width);
    }
    return maxWidth;
  }

  /**
   * Format volume with K/M/B suffixes
   */
  private formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    } else {
      return volume.toFixed(0);
    }
  }

  /**
   * Update tooltip style
   */
  public setStyle(style: Partial<TooltipStyle>): void {
    this.style = { ...this.style, ...style };
  }
}
