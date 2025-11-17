import type { IPlugin, PluginContext } from '../plugins/types';
import { RenderPhase } from '../plugins/types';
import type { Chart } from '../Chart';
import type { Viewport } from '../viewport/Viewport';
import type { IRenderer } from '../renderer/IRenderer';
import type { TimestampMs } from '../data/types';
import type { LayoutRect } from '../layout/LayoutManager';
import { CanvasRenderer } from '../renderer/CanvasRenderer';

/**
 * Shape style configuration
 */
export interface ShapeStyle {
  strokeColor?: string;
  fillColor?: string;
  lineWidth?: number;
  opacity?: number;
}

/**
 * Rectangle shape
 */
export interface Rectangle {
  id: string;
  type: 'rectangle';
  t0: TimestampMs;
  t1: TimestampMs;
  p0: number;
  p1: number;
  style: ShapeStyle;
}

/**
 * Line shape
 */
export interface Line {
  id: string;
  type: 'line';
  t0: TimestampMs;
  t1: TimestampMs;
  price: number;
  style: ShapeStyle;
}

/**
 * Horizontal band shape
 */
export interface HorizontalBand {
  id: string;
  type: 'band';
  p0: number;
  p1: number;
  style: ShapeStyle;
}

/**
 * All supported shapes
 */
export type Shape = Rectangle | Line | HorizontalBand;

/**
 * Default shape style
 */
export const defaultShapeStyle: ShapeStyle = {
  strokeColor: '#2196F3',
  fillColor: 'rgba(33, 150, 243, 0.1)',
  lineWidth: 1,
  opacity: 1.0,
};

/**
 * ShapesOverlayPlugin allows drawing rectangles, lines, and bands on the chart
 */
export class ShapesOverlayPlugin implements IPlugin {
  public readonly name = 'shapes-overlay';
  private chart: Chart | null = null;
  private shapes: Map<string, Shape> = new Map();
  private nextId: number = 0;

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
    this.shapes.clear();
  }

  /**
   * Render hook
   */
  public onRender(context: PluginContext): void {
    // Render shapes during AfterCandles phase
    if (context.phase !== RenderPhase.AfterCandles) return;
    if (!this.chart) return;

    const viewport = this.chart.getViewport();
    if (!viewport) return;

    this.drawShapes(context.renderer, viewport, context.layout.chartArea);
  }

  /**
   * Add a rectangle shape
   */
  public addRect(
    t0: TimestampMs,
    t1: TimestampMs,
    p0: number,
    p1: number,
    style: Partial<ShapeStyle> = {},
  ): string {
    const id = this.generateId();
    const rectangle: Rectangle = {
      id,
      type: 'rectangle',
      t0,
      t1,
      p0,
      p1,
      style: { ...defaultShapeStyle, ...style },
    };
    this.shapes.set(id, rectangle);
    this.requestRedraw();
    return id;
  }

  /**
   * Add a line shape
   */
  public addLine(
    t0: TimestampMs,
    t1: TimestampMs,
    price: number,
    style: Partial<ShapeStyle> = {},
  ): string {
    const id = this.generateId();
    const line: Line = {
      id,
      type: 'line',
      t0,
      t1,
      price,
      style: { ...defaultShapeStyle, ...style },
    };
    this.shapes.set(id, line);
    this.requestRedraw();
    return id;
  }

  /**
   * Add a horizontal band (full width)
   */
  public addBand(p0: number, p1: number, style: Partial<ShapeStyle> = {}): string {
    const id = this.generateId();
    const band: HorizontalBand = {
      id,
      type: 'band',
      p0,
      p1,
      style: { ...defaultShapeStyle, ...style },
    };
    this.shapes.set(id, band);
    this.requestRedraw();
    return id;
  }

  /**
   * Remove a shape by ID
   */
  public removeShape(id: string): boolean {
    const result = this.shapes.delete(id);
    if (result) {
      this.requestRedraw();
    }
    return result;
  }

  /**
   * Clear all shapes
   */
  public clearShapes(): void {
    this.shapes.clear();
    this.requestRedraw();
  }

  /**
   * Get all shapes
   */
  public getShapes(): ReadonlyMap<string, Shape> {
    return this.shapes;
  }

  /**
   * Update shape style
   */
  public updateShapeStyle(id: string, style: Partial<ShapeStyle>): boolean {
    const shape = this.shapes.get(id);
    if (!shape) return false;

    shape.style = { ...shape.style, ...style };
    this.requestRedraw();
    return true;
  }

  /**
   * Draw all shapes
   */
  private drawShapes(renderer: IRenderer, viewport: Viewport, chartArea: LayoutRect): void {
    if (this.shapes.size === 0) return;

    renderer.save();
    renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Translate to chart area
    let ctx: CanvasRenderingContext2D | null = null;
    if (renderer instanceof CanvasRenderer) {
      ctx = renderer.getContext();
      ctx.translate(chartArea.x, chartArea.y);
    }

    // Draw each shape
    for (const shape of this.shapes.values()) {
      this.drawShape(renderer, viewport, shape, ctx);
    }

    // Restore translation
    if (ctx && renderer instanceof CanvasRenderer) {
      ctx.translate(-chartArea.x, -chartArea.y);
    }

    renderer.restore();
  }

  /**
   * Draw a single shape
   */
  private drawShape(
    renderer: IRenderer,
    viewport: Viewport,
    shape: Shape,
    ctx: CanvasRenderingContext2D | null,
  ): void {
    if (shape.type === 'rectangle') {
      this.drawRectangle(renderer, viewport, shape, ctx);
    } else if (shape.type === 'line') {
      this.drawLine(renderer, viewport, shape, ctx);
    } else if (shape.type === 'band') {
      this.drawBand(renderer, viewport, shape, ctx);
    }
  }

  /**
   * Draw rectangle
   */
  private drawRectangle(
    renderer: IRenderer,
    viewport: Viewport,
    rect: Rectangle,
    ctx: CanvasRenderingContext2D | null,
  ): void {
    const x0 = viewport.xScale(rect.t0);
    const x1 = viewport.xScale(rect.t1);
    const y0 = viewport.yScale(rect.p0);
    const y1 = viewport.yScale(rect.p1);

    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const width = Math.abs(x1 - x0);
    const height = Math.abs(y1 - y0);

    // Set opacity
    const prevAlpha = ctx?.globalAlpha ?? 1.0;
    if (ctx && rect.style.opacity !== undefined) {
      ctx.globalAlpha = rect.style.opacity;
    }

    // Fill
    if (rect.style.fillColor) {
      renderer.fillRect(x, y, width, height, rect.style.fillColor);
    }

    // Stroke
    if (rect.style.strokeColor) {
      renderer.strokeRect(x, y, width, height, rect.style.strokeColor, rect.style.lineWidth ?? 1);
    }

    // Restore opacity
    if (ctx) {
      ctx.globalAlpha = prevAlpha;
    }
  }

  /**
   * Draw line
   */
  private drawLine(
    renderer: IRenderer,
    viewport: Viewport,
    line: Line,
    ctx: CanvasRenderingContext2D | null,
  ): void {
    const x0 = viewport.xScale(line.t0);
    const x1 = viewport.xScale(line.t1);
    const y = viewport.yScale(line.price);

    // Set opacity
    const prevAlpha = ctx?.globalAlpha ?? 1.0;
    if (ctx && line.style.opacity !== undefined) {
      ctx.globalAlpha = line.style.opacity;
    }

    renderer.beginPath();
    renderer.moveTo(x0, y);
    renderer.lineTo(x1, y);

    if (line.style.strokeColor) {
      renderer.stroke(line.style.strokeColor, line.style.lineWidth ?? 1);
    }

    // Restore opacity
    if (ctx) {
      ctx.globalAlpha = prevAlpha;
    }
  }

  /**
   * Draw horizontal band
   */
  private drawBand(
    renderer: IRenderer,
    viewport: Viewport,
    band: HorizontalBand,
    ctx: CanvasRenderingContext2D | null,
  ): void {
    const { width } = viewport.getDimensions();
    const y0 = viewport.yScale(band.p0);
    const y1 = viewport.yScale(band.p1);

    const y = Math.min(y0, y1);
    const height = Math.abs(y1 - y0);

    // Set opacity
    const prevAlpha = ctx?.globalAlpha ?? 1.0;
    if (ctx && band.style.opacity !== undefined) {
      ctx.globalAlpha = band.style.opacity;
    }

    // Fill
    if (band.style.fillColor) {
      renderer.fillRect(0, y, width, height, band.style.fillColor);
    }

    // Stroke top and bottom
    if (band.style.strokeColor) {
      renderer.beginPath();
      renderer.moveTo(0, y);
      renderer.lineTo(width, y);
      renderer.stroke(band.style.strokeColor, band.style.lineWidth ?? 1);

      renderer.beginPath();
      renderer.moveTo(0, y + height);
      renderer.lineTo(width, y + height);
      renderer.stroke(band.style.strokeColor, band.style.lineWidth ?? 1);
    }

    // Restore opacity
    if (ctx) {
      ctx.globalAlpha = prevAlpha;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `shape-${this.nextId++}`;
  }

  /**
   * Request chart redraw
   */
  private requestRedraw(): void {
    if (this.chart) {
      this.chart.scheduleRender();
    }
  }
}
