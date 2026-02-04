/**
 * Text alignment options (renderer-agnostic)
 */
export type TextAlign = 'left' | 'right' | 'center' | 'start' | 'end';

/**
 * Text baseline options (renderer-agnostic)
 */
export type TextBaseline = 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';

/**
 * Abstract renderer interface for drawing operations
 *
 * Provides a unified API for rendering graphics, allowing for
 * different backend implementations (Canvas 2D, WebGL, etc.)
 */
export interface IRenderer {
  /**
   * Get the device pixel ratio
   */
  pixelRatio(): number;

  /**
   * Resize the rendering surface
   *
   * @param width - CSS width in pixels
   * @param height - CSS height in pixels
   */
  resize(width: number, height: number): void;

  /**
   * Save the current rendering state
   */
  save(): void;

  /**
   * Restore the previously saved rendering state
   */
  restore(): void;

  /**
   * Set a clipping region
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width of clip region
   * @param height - Height of clip region
   */
  setClip(x: number, y: number, width: number, height: number): void;

  /**
   * Apply a translation transform
   *
   * @param x - X offset
   * @param y - Y offset
   */
  translate(x: number, y: number): void;

  /**
   * Set the line dash pattern
   *
   * @param segments - Array of dash/gap lengths. Empty array for solid lines.
   */
  setLineDash(segments: number[]): void;

  /**
   * Set the global opacity for subsequent draw operations
   *
   * @param alpha - Opacity value from 0 (transparent) to 1 (opaque)
   */
  setGlobalAlpha(alpha: number): void;

  /**
   * Begin a new path
   */
  beginPath(): void;

  /**
   * Move to a point without drawing
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  moveTo(x: number, y: number): void;

  /**
   * Draw a line to a point
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  lineTo(x: number, y: number): void;

  /**
   * Stroke the current path
   *
   * @param color - Stroke color
   * @param lineWidth - Line width in pixels
   */
  stroke(color: string, lineWidth?: number): void;

  /**
   * Fill a rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Fill color
   */
  fillRect(x: number, y: number, width: number, height: number, color: string): void;

  /**
   * Stroke a rectangle
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   * @param color - Stroke color
   * @param lineWidth - Line width in pixels
   */
  strokeRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    lineWidth?: number,
  ): void;

  /**
   * Draw text
   *
   * @param text - Text to draw
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param color - Text color
   * @param font - Font specification
   * @param align - Text alignment
   * @param baseline - Text baseline
   */
  drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    font?: string,
    align?: TextAlign,
    baseline?: TextBaseline,
  ): void;

  /**
   * Measure text width
   *
   * @param text - Text to measure
   * @param font - Font specification
   * @returns Text width in pixels
   */
  measureText(text: string, font?: string): number;

  /**
   * Clear the entire rendering surface
   */
  clear(): void;

  /**
   * Clear a specific region
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Width
   * @param height - Height
   */
  clearRect(x: number, y: number, width: number, height: number): void;

  /**
   * Get the rendering surface width in CSS pixels
   */
  getWidth(): number;

  /**
   * Get the rendering surface height in CSS pixels
   */
  getHeight(): number;
}
