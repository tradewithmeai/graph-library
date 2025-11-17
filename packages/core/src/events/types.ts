/**
 * Normalized chart event type
 */
export type ChartEventType =
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'pointercancel'
  | 'wheel'
  | 'mouseleave'
  | 'dblclick'
  | 'click';

/**
 * Normalized chart event containing coordinate information
 * and modifier keys
 */
export interface ChartEvent {
  /** Event type */
  type: ChartEventType;

  /** Client X coordinate (relative to viewport) */
  clientX: number;

  /** Client Y coordinate (relative to viewport) */
  clientY: number;

  /** Chart X coordinate (relative to canvas element) */
  chartX: number;

  /** Chart Y coordinate (relative to canvas element) */
  chartY: number;

  /** Wheel delta X (for wheel events) */
  deltaX?: number;

  /** Wheel delta Y (for wheel events) */
  deltaY?: number;

  /** Pointer button (0 = primary, 1 = middle, 2 = secondary) */
  button?: number;

  /** Alt key pressed */
  altKey: boolean;

  /** Ctrl key pressed */
  ctrlKey: boolean;

  /** Shift key pressed */
  shiftKey: boolean;

  /** Meta key pressed */
  metaKey: boolean;

  /** Original DOM event */
  originalEvent: Event;
}

/**
 * Interaction mode
 */
export enum InteractionMode {
  Idle = 'idle',
  PanningTime = 'panning-time',
  PanningPrice = 'panning-price',
}

/**
 * Wheel behavior mode
 */
export type WheelMode = 'zoomX' | 'scrollX' | 'blend';

/**
 * Chart options for interaction
 */
export interface InteractionOptions {
  /** Enable pan interaction */
  enablePan?: boolean;

  /** Enable zoom interaction */
  enableZoom?: boolean;

  /** Enable crosshair */
  enableCrosshair?: boolean;

  /** Wheel behavior mode */
  wheelMode?: WheelMode;

  /** Minimum visible bars (zoom limit) */
  minVisibleBars?: number;

  /** Maximum visible bars (zoom limit) */
  maxVisibleBars?: number;

  /** Zoom speed multiplier */
  zoomSpeed?: number;
}

/**
 * Default interaction options
 */
export const defaultInteractionOptions: Required<InteractionOptions> = {
  enablePan: true,
  enableZoom: true,
  enableCrosshair: true,
  wheelMode: 'zoomX',
  minVisibleBars: 10,
  maxVisibleBars: 1000,
  zoomSpeed: 1.0,
};
