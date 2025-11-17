import type { ChartEvent, ChartEventType } from './types';

/**
 * Event handler callback
 */
export type EventHandler = (event: ChartEvent) => void;

/**
 * Manages event capture and normalization for the chart canvas
 */
export class EventManager {
  private canvas: HTMLCanvasElement;
  private handlers: Map<ChartEventType, Set<EventHandler>>;
  private resizeObserver: ResizeObserver | null = null;
  private resizeCallbacks: Set<() => void> = new Set();
  private boundListeners: Map<string, (e: Event) => void> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.handlers = new Map();
    this.setupEventListeners();
    this.setupResizeObserver();
  }

  /**
   * Register an event handler
   */
  public on(type: ChartEventType, handler: EventHandler): void {
    let handlers = this.handlers.get(type);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(type, handlers);
    }
    handlers.add(handler);
  }

  /**
   * Unregister an event handler
   */
  public off(type: ChartEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Register a resize callback
   */
  public onResize(callback: () => void): void {
    this.resizeCallbacks.add(callback);
  }

  /**
   * Unregister a resize callback
   */
  public offResize(callback: () => void): void {
    this.resizeCallbacks.delete(callback);
  }

  /**
   * Setup event listeners on the canvas
   */
  private setupEventListeners(): void {
    const events: Array<{ type: string; chartType: ChartEventType }> = [
      { type: 'pointerdown', chartType: 'pointerdown' },
      { type: 'pointermove', chartType: 'pointermove' },
      { type: 'pointerup', chartType: 'pointerup' },
      { type: 'pointercancel', chartType: 'pointercancel' },
      { type: 'wheel', chartType: 'wheel' },
      { type: 'mouseleave', chartType: 'mouseleave' },
      { type: 'dblclick', chartType: 'dblclick' },
      { type: 'click', chartType: 'click' },
    ];

    for (const { type, chartType } of events) {
      const listener = (e: Event) => {
        const chartEvent = this.normalizeEvent(e, chartType);
        this.dispatch(chartType, chartEvent);
      };

      this.boundListeners.set(type, listener);

      if (type === 'wheel') {
        this.canvas.addEventListener(type, listener, { passive: false });
      } else {
        this.canvas.addEventListener(type, listener);
      }
    }
  }

  /**
   * Setup resize observer
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      for (const callback of this.resizeCallbacks) {
        callback();
      }
    });
    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Normalize a DOM event to ChartEvent
   */
  private normalizeEvent(event: Event, type: ChartEventType): ChartEvent {
    const rect = this.canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    let button: number | undefined;
    let deltaX: number | undefined;
    let deltaY: number | undefined;
    let altKey = false;
    let ctrlKey = false;
    let shiftKey = false;
    let metaKey = false;

    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
      button = event.button;
      altKey = event.altKey;
      ctrlKey = event.ctrlKey;
      shiftKey = event.shiftKey;
      metaKey = event.metaKey;
    } else if (event instanceof WheelEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
      deltaX = event.deltaX;
      deltaY = event.deltaY;
      altKey = event.altKey;
      ctrlKey = event.ctrlKey;
      shiftKey = event.shiftKey;
      metaKey = event.metaKey;
    }

    const chartX = clientX - rect.left;
    const chartY = clientY - rect.top;

    return {
      type,
      clientX,
      clientY,
      chartX,
      chartY,
      deltaX,
      deltaY,
      button,
      altKey,
      ctrlKey,
      shiftKey,
      metaKey,
      originalEvent: event,
    };
  }

  /**
   * Dispatch event to handlers
   */
  private dispatch(type: ChartEventType, event: ChartEvent): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  /**
   * Cleanup event listeners and observers
   */
  public destroy(): void {
    // Remove event listeners
    for (const [type, listener] of this.boundListeners) {
      this.canvas.removeEventListener(type, listener);
    }
    this.boundListeners.clear();

    // Clear handlers
    this.handlers.clear();

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear resize callbacks
    this.resizeCallbacks.clear();
  }
}
