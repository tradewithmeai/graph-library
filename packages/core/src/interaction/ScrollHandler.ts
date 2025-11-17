import type { Viewport } from '../viewport/Viewport';
import type { ChartEvent, WheelMode } from '../events/types';

/**
 * Handles scroll interactions (wheel scroll for time shift)
 */
export class ScrollHandler {
  private viewport: Viewport;
  private wheelMode: WheelMode;
  private onUpdate: () => void;

  constructor(viewport: Viewport, wheelMode: WheelMode, onUpdate: () => void) {
    this.viewport = viewport;
    this.wheelMode = wheelMode;
    this.onUpdate = onUpdate;
  }

  /**
   * Set wheel mode
   */
  public setWheelMode(mode: WheelMode): void {
    this.wheelMode = mode;
  }

  /**
   * Get current wheel mode
   */
  public getWheelMode(): WheelMode {
    return this.wheelMode;
  }

  /**
   * Handle wheel event for scrolling
   */
  public onWheel(event: ChartEvent): boolean {
    if (this.wheelMode === 'zoomX') {
      // Zoom mode is handled by ZoomHandler
      return false;
    }

    const wheelEvent = event.originalEvent as WheelEvent;
    wheelEvent.preventDefault();

    const deltaX = event.deltaX ?? 0;
    const deltaY = event.deltaY ?? 0;

    if (this.wheelMode === 'scrollX') {
      // Pure scroll mode - use deltaY for horizontal scroll
      this.scrollTime(deltaY);
      return true;
    } else if (this.wheelMode === 'blend') {
      // Blend mode - deltaX for scroll, deltaY for zoom (handled by ZoomHandler)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        this.scrollTime(deltaX);
        return true;
      }
      // Let ZoomHandler handle vertical scroll
      return false;
    }

    return false;
  }

  /**
   * Scroll time by the given delta
   */
  private scrollTime(delta: number): void {
    const timeSpan = this.viewport.getTimeSpan();
    const scrollSpeed = 0.01; // 1% of time span per delta unit
    const timeDelta = delta * scrollSpeed * timeSpan;

    this.viewport.pan(timeDelta);
    this.onUpdate();
  }

  /**
   * Programmatically scroll left
   */
  public scrollLeft(amount: number = 0.1): void {
    const timeSpan = this.viewport.getTimeSpan();
    const timeDelta = -amount * timeSpan;
    this.viewport.pan(timeDelta);
    this.onUpdate();
  }

  /**
   * Programmatically scroll right
   */
  public scrollRight(amount: number = 0.1): void {
    const timeSpan = this.viewport.getTimeSpan();
    const timeDelta = amount * timeSpan;
    this.viewport.pan(timeDelta);
    this.onUpdate();
  }
}
