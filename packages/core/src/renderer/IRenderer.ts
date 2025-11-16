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
    align?: CanvasTextAlign,
    baseline?: CanvasTextBaseline,
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
   * Clear the entire canvas
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
   * Get the canvas width in CSS pixels
   */
  getWidth(): number;

  /**
   * Get the canvas height in CSS pixels
   */
  getHeight(): number;
}
