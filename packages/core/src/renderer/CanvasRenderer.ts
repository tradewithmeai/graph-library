import type { IRenderer, TextAlign, TextBaseline } from './IRenderer';

/**
 * Canvas 2D renderer implementation with high-DPI support
 *
 * Features:
 * - Automatic device pixel ratio handling
 * - Pixel snapping for crisp lines
 * - Efficient batching of drawing operations
 */
export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private cssWidth: number;
  private cssHeight: number;

  /**
   * Create a new CanvasRenderer
   *
   * @param canvas - HTMLCanvasElement to render to
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    // Get device pixel ratio for high-DPI displays
    this.dpr = window.devicePixelRatio || 1;

    // Initialize with current canvas size
    const rect = canvas.getBoundingClientRect();
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;

    this.updateCanvasSize();
  }

  /**
   * Update canvas size to match CSS size with proper DPI scaling
   *
   * @param width - CSS width in pixels
   * @param height - CSS height in pixels
   */
  public resize(width: number, height: number): void {
    this.cssWidth = width;
    this.cssHeight = height;
    this.updateCanvasSize();
  }

  /**
   * Update the canvas internal size based on CSS size and DPR
   */
  private updateCanvasSize(): void {
    // Set canvas internal size to CSS size * DPR for high-DPI
    this.canvas.width = Math.floor(this.cssWidth * this.dpr);
    this.canvas.height = Math.floor(this.cssHeight * this.dpr);

    // Scale context to account for DPR
    this.ctx.scale(this.dpr, this.dpr);

    // Set canvas CSS size
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
  }

  public pixelRatio(): number {
    return this.dpr;
  }

  public save(): void {
    this.ctx.save();
  }

  public restore(): void {
    this.ctx.restore();
  }

  public translate(x: number, y: number): void {
    this.ctx.translate(x, y);
  }

  public setLineDash(segments: number[]): void {
    this.ctx.setLineDash(segments);
  }

  public setGlobalAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha;
  }

  public setClip(x: number, y: number, width: number, height: number): void {
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();
  }

  public beginPath(): void {
    this.ctx.beginPath();
  }

  public moveTo(x: number, y: number): void {
    this.ctx.moveTo(this.snapToPixel(x), this.snapToPixel(y));
  }

  public lineTo(x: number, y: number): void {
    this.ctx.lineTo(this.snapToPixel(x), this.snapToPixel(y));
  }

  public stroke(color: string, lineWidth: number = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  public fillRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      this.snapToPixel(x),
      this.snapToPixel(y),
      Math.ceil(width),
      Math.ceil(height),
    );
  }

  public strokeRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    lineWidth: number = 1,
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      this.snapToPixel(x),
      this.snapToPixel(y),
      Math.ceil(width),
      Math.ceil(height),
    );
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    font: string = '12px sans-serif',
    align: TextAlign = 'left',
    baseline: TextBaseline = 'alphabetic',
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  }

  public measureText(text: string, font: string = '12px sans-serif'): number {
    this.ctx.font = font;
    return this.ctx.measureText(text).width;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
  }

  public clearRect(x: number, y: number, width: number, height: number): void {
    this.ctx.clearRect(x, y, width, height);
  }

  public getWidth(): number {
    return this.cssWidth;
  }

  public getHeight(): number {
    return this.cssHeight;
  }

  /**
   * Get the underlying canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get the 2D rendering context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Snap coordinate to pixel boundary for crisp lines
   *
   * For 1px lines, coordinates should be at 0.5 offsets (e.g., 10.5)
   * to align with pixel boundaries and avoid anti-aliasing blur.
   *
   * @param value - Coordinate value
   * @returns Snapped coordinate
   */
  private snapToPixel(value: number): number {
    return Math.floor(value) + 0.5;
  }

  /**
   * Snap coordinate to integer pixel for fills
   *
   * @param value - Coordinate value
   * @returns Snapped coordinate
   */
  public snapToIntPixel(value: number): number {
    return Math.floor(value);
  }
}
