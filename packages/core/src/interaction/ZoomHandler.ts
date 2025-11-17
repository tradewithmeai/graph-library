import type { Viewport } from '../viewport/Viewport';
import type { ChartEvent } from '../events/types';
import type { InteractionOptions } from '../events/types';

/**
 * Handles zoom interactions (wheel zoom)
 */
export class ZoomHandler {
  private viewport: Viewport;
  private options: Required<InteractionOptions>;
  private onUpdate: () => void;
  private minTime: number = 0;
  private maxTime: number = Number.MAX_SAFE_INTEGER;
  private avgCandleDuration: number = 60000; // Default 1 minute

  constructor(viewport: Viewport, options: Required<InteractionOptions>, onUpdate: () => void) {
    this.viewport = viewport;
    this.options = options;
    this.onUpdate = onUpdate;
  }

  /**
   * Set data bounds for clamping
   */
  public setDataBounds(minTime: number, maxTime: number, avgCandleDuration: number): void {
    this.minTime = minTime;
    this.maxTime = maxTime;
    this.avgCandleDuration = avgCandleDuration;
  }

  /**
   * Handle wheel event for zoom
   */
  public onWheel(event: ChartEvent): boolean {
    if (!this.options.enableZoom) return false;

    const wheelEvent = event.originalEvent as WheelEvent;

    // Prevent default to avoid page scroll
    wheelEvent.preventDefault();

    const deltaY = event.deltaY ?? 0;

    // Calculate zoom factor
    // Negative deltaY = scroll up = zoom in
    // Positive deltaY = scroll down = zoom out
    const zoomDirection = -Math.sign(deltaY);
    const zoomIntensity = Math.abs(deltaY) / 100; // Normalize wheel delta
    const baseZoom = 1 + zoomIntensity * 0.1 * this.options.zoomSpeed;
    const zoomFactor = zoomDirection > 0 ? baseZoom : 1 / baseZoom;

    // Zoom centered on pointer X position
    this.viewport.zoom(zoomFactor, event.chartX);

    // Clamp to min/max visible bars
    this.clampZoom();

    this.onUpdate();
    return true;
  }

  /**
   * Clamp zoom to respect min/max visible bars
   */
  private clampZoom(): void {
    const minSpan = this.avgCandleDuration * this.options.minVisibleBars;
    const maxSpan = this.avgCandleDuration * this.options.maxVisibleBars;

    this.viewport.clampTimeRange(this.minTime, this.maxTime, minSpan, maxSpan);
  }

  /**
   * Programmatically zoom in
   */
  public zoomIn(centerX?: number): void {
    const { width } = this.viewport.getDimensions();
    const center = centerX ?? width / 2;
    this.viewport.zoom(1.2, center);
    this.clampZoom();
    this.onUpdate();
  }

  /**
   * Programmatically zoom out
   */
  public zoomOut(centerX?: number): void {
    const { width } = this.viewport.getDimensions();
    const center = centerX ?? width / 2;
    this.viewport.zoom(1 / 1.2, center);
    this.clampZoom();
    this.onUpdate();
  }

  /**
   * Reset zoom to show all data
   */
  public resetZoom(): void {
    this.viewport.setTimeRange({ start: this.minTime, end: this.maxTime });
    this.onUpdate();
  }
}
