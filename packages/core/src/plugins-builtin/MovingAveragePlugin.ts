import type { IPlugin, PluginContext } from '../plugins/types';
import { RenderPhase } from '../plugins/types';
import type { Chart } from '../Chart';
import type { CandleSeries } from '../data/CandleSeries';
import type { Viewport } from '../viewport/Viewport';
import type { IRenderer } from '../renderer/IRenderer';
import type { LayoutRect } from '../layout/LayoutManager';

/**
 * Moving average configuration
 */
export interface MovingAverageConfig {
  /** Period for the moving average */
  period: number;

  /** Source field to calculate MA from */
  source: 'open' | 'high' | 'low' | 'close';

  /** Line color */
  color: string;

  /** Line width */
  lineWidth: number;
}

/**
 * Default MA configuration
 */
export const defaultMAConfig: MovingAverageConfig = {
  period: 20,
  source: 'close',
  color: '#2196F3',
  lineWidth: 2,
};

/**
 * Moving average data point
 */
interface MAPoint {
  ts: number;
  value: number;
}

/**
 * MovingAveragePlugin calculates and draws simple moving averages
 */
export class MovingAveragePlugin implements IPlugin {
  public readonly name: string;
  private config: MovingAverageConfig;
  private chart: Chart | null = null;
  private maData: MAPoint[] = [];
  private lastSeriesLength: number = 0;

  constructor(config: Partial<MovingAverageConfig> = {}, name?: string) {
    this.config = { ...defaultMAConfig, ...config };
    this.name = name || `ma-${this.config.period}`;
  }

  /**
   * Plugin installation hook
   */
  public onInstall(chart: unknown): void {
    this.chart = chart as Chart;
    this.calculateMA();
  }

  /**
   * Plugin uninstall hook
   */
  public onUninstall(_chart: unknown): void {
    this.chart = null;
    this.maData = [];
  }

  /**
   * Render hook
   */
  public onRender(context: PluginContext): void {
    // Render MA during AfterCandles phase
    if (context.phase !== RenderPhase.AfterCandles) return;
    if (!this.chart) return;

    // Check if we need to recalculate (series data changed)
    const series = this.chart.getSeries();
    if (series.length > 0 && series[0]) {
      const currentLength = series[0].getLength();
      if (currentLength !== this.lastSeriesLength) {
        this.calculateMA();
        this.lastSeriesLength = currentLength;
      }
    }

    const viewport = this.chart.getViewport();
    if (!viewport) return;

    this.drawMA(context.renderer, viewport, context.layout.chartArea);
  }

  /**
   * Calculate moving average from series data
   */
  private calculateMA(): void {
    if (!this.chart) return;

    const series = this.chart.getSeries();
    if (series.length === 0 || !series[0]) {
      this.maData = [];
      return;
    }

    const candleSeries = series[0];
    const length = candleSeries.getLength();
    const period = this.config.period;

    if (length < period) {
      this.maData = [];
      return;
    }

    this.maData = [];
    const sourceData = this.getSourceData(candleSeries);

    // Calculate SMA for each position where we have enough data
    for (let i = period - 1; i < length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        const value = sourceData[i - j];
        if (value !== undefined) {
          sum += value;
        }
      }
      const avg = sum / period;

      this.maData.push({
        ts: candleSeries.getTimestamp(i),
        value: avg,
      });
    }
  }

  /**
   * Get source data array from candle series
   */
  private getSourceData(series: CandleSeries): number[] {
    const length = series.getLength();
    const data: number[] = [];

    for (let i = 0; i < length; i++) {
      const candle = series.getCandle(i);
      if (candle) {
        data.push(candle[this.config.source]);
      }
    }

    return data;
  }

  /**
   * Draw MA line
   */
  private drawMA(renderer: IRenderer, viewport: Viewport, chartArea: LayoutRect): void {
    if (this.maData.length === 0) return;

    renderer.save();
    renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Translate to chart area
    renderer.translate(chartArea.x, chartArea.y);

    // Get visible range
    const timeRange = viewport.getTimeRange();

    // Find first and last visible MA points
    let startIdx = 0;
    let endIdx = this.maData.length - 1;

    for (let i = 0; i < this.maData.length; i++) {
      const point = this.maData[i];
      if (point && point.ts >= timeRange.start) {
        startIdx = Math.max(0, i - 1);
        break;
      }
    }

    for (let i = this.maData.length - 1; i >= 0; i--) {
      const point = this.maData[i];
      if (point && point.ts <= timeRange.end) {
        endIdx = Math.min(this.maData.length - 1, i + 1);
        break;
      }
    }

    if (startIdx > endIdx) {
      renderer.translate(-chartArea.x, -chartArea.y);
      renderer.restore();
      return;
    }

    // Draw polyline
    renderer.beginPath();

    let isFirst = true;
    for (let i = startIdx; i <= endIdx; i++) {
      const point = this.maData[i];
      if (!point) continue;

      const x = viewport.xScale(point.ts);
      const y = viewport.yScale(point.value);

      if (isFirst) {
        renderer.moveTo(x, y);
        isFirst = false;
      } else {
        renderer.lineTo(x, y);
      }
    }

    renderer.stroke(this.config.color, this.config.lineWidth);

    // Restore translation
    renderer.translate(-chartArea.x, -chartArea.y);

    renderer.restore();
  }

  /**
   * Update MA configuration
   */
  public setConfig(config: Partial<MovingAverageConfig>): void {
    this.config = { ...this.config, ...config };
    this.calculateMA();
  }

  /**
   * Get current configuration
   */
  public getConfig(): MovingAverageConfig {
    return { ...this.config };
  }

  /**
   * Get calculated MA data
   */
  public getData(): ReadonlyArray<MAPoint> {
    return this.maData;
  }
}
