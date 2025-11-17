import type { Viewport } from '../viewport/Viewport';
import type { ChartEvent } from '../events/types';
import { InteractionMode } from '../events/types';

/**
 * Interaction state for panning
 */
interface PanState {
  mode: InteractionMode;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTimeRange: { start: number; end: number };
  startPriceRange: { min: number; max: number };
}

/**
 * Handles pan interactions (drag to move time/price range)
 */
export class PanHandler {
  private viewport: Viewport;
  private state: PanState | null = null;
  private onUpdate: () => void;

  constructor(viewport: Viewport, onUpdate: () => void) {
    this.viewport = viewport;
    this.onUpdate = onUpdate;
  }

  /**
   * Handle pointer down event - start panning
   */
  public onPointerDown(event: ChartEvent): boolean {
    // Only respond to primary button (left click)
    if (event.button !== 0) return false;

    // Determine pan mode based on modifier keys
    const mode = event.altKey ? InteractionMode.PanningPrice : InteractionMode.PanningTime;

    const timeRange = this.viewport.getTimeRange();
    const priceConfig = this.viewport.getPriceConfig();

    this.state = {
      mode,
      startX: event.chartX,
      startY: event.chartY,
      lastX: event.chartX,
      lastY: event.chartY,
      startTimeRange: { start: timeRange.start, end: timeRange.end },
      startPriceRange: { min: priceConfig.min, max: priceConfig.max },
    };

    return true;
  }

  /**
   * Handle pointer move event - perform panning
   */
  public onPointerMove(event: ChartEvent): boolean {
    if (!this.state) return false;

    const deltaX = event.chartX - this.state.lastX;
    const deltaY = event.chartY - this.state.lastY;

    this.state.lastX = event.chartX;
    this.state.lastY = event.chartY;

    if (this.state.mode === InteractionMode.PanningTime) {
      // Pan time only
      const timeSpan = this.viewport.getTimeSpan();
      const { width } = this.viewport.getDimensions();
      const timeDelta = -(deltaX / width) * timeSpan;
      this.viewport.pan(timeDelta);
    } else if (this.state.mode === InteractionMode.PanningPrice) {
      // Pan price only
      const priceSpan = this.viewport.getPriceSpan();
      const { height } = this.viewport.getDimensions();
      // Note: Y is inverted (higher Y = lower price)
      const priceDelta = (deltaY / height) * priceSpan;
      this.viewport.pan(0, priceDelta);
    }

    this.onUpdate();
    return true;
  }

  /**
   * Handle pointer up event - end panning
   */
  public onPointerUp(_event: ChartEvent): boolean {
    if (!this.state) return false;

    this.state = null;
    return true;
  }

  /**
   * Handle pointer cancel event - cancel panning
   */
  public onPointerCancel(_event: ChartEvent): boolean {
    if (!this.state) return false;

    // Restore original viewport state
    this.viewport.setTimeRange(this.state.startTimeRange);
    this.viewport.setPriceConfig({
      ...this.viewport.getPriceConfig(),
      min: this.state.startPriceRange.min,
      max: this.state.startPriceRange.max,
    });

    this.state = null;
    this.onUpdate();
    return true;
  }

  /**
   * Get current interaction mode
   */
  public getMode(): InteractionMode {
    return this.state?.mode ?? InteractionMode.Idle;
  }

  /**
   * Check if currently panning
   */
  public isPanning(): boolean {
    return this.state !== null;
  }

  /**
   * Reset pan state
   */
  public reset(): void {
    this.state = null;
  }
}
