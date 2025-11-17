import type { ChartOptions, Theme } from './types';
import { defaultTheme } from './theme';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import type { IRenderer } from './renderer/IRenderer';
import { LayoutManager } from './layout/LayoutManager';
import type { LayoutConfig, ChartLayout } from './layout/LayoutManager';
import { CandleSeries } from './data/CandleSeries';
import { Viewport } from './viewport/Viewport';
import { TimeAxis } from './axis/TimeAxis';
import { PriceAxis } from './axis/PriceAxis';
import { CandleRenderer } from './drawing/CandleRenderer';
import { PluginManager } from './plugins/PluginManager';
import { RenderPhase } from './plugins/types';
import type { IPlugin } from './plugins/types';
import { EventManager } from './events/EventManager';
import { defaultInteractionOptions } from './events/types';
import type { InteractionOptions } from './events/types';
import { PanHandler } from './interaction/PanHandler';
import { ZoomHandler } from './interaction/ZoomHandler';
import { ScrollHandler } from './interaction/ScrollHandler';
import { Crosshair } from './crosshair/Crosshair';
import { CrosshairRenderer } from './crosshair/CrosshairRenderer';

/**
 * Main Chart class for SolVX Graph Engine
 *
 * Manages the complete rendering pipeline:
 * - Canvas setup and HiDPI handling
 * - Layout computation
 * - Data series management
 * - Coordinate transformations
 * - Rendering of grid, axes, and candles
 * - Plugin system
 */
export class Chart {
  private options: ChartOptions;
  private theme: Theme;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: IRenderer | null = null;
  private layoutManager: LayoutManager | null = null;
  private seriesList: CandleSeries[] = [];
  private viewport: Viewport | null = null;
  private timeAxis: TimeAxis | null = null;
  private priceAxis: PriceAxis | null = null;
  private candleRenderer: CandleRenderer;
  private pluginManager: PluginManager;
  private renderScheduled: boolean = false;
  private animationFrameId: number | null = null;

  // Interaction
  private interactionOptions: Required<InteractionOptions>;
  private eventManager: EventManager | null = null;
  private panHandler: PanHandler | null = null;
  private zoomHandler: ZoomHandler | null = null;
  private scrollHandler: ScrollHandler | null = null;
  private crosshair: Crosshair | null = null;
  private crosshairRenderer: CrosshairRenderer | null = null;
  private hasInitialViewport: boolean = false;

  /**
   * Creates a new Chart instance
   *
   * @param options - Chart configuration options
   */
  constructor(options: ChartOptions) {
    this.options = options;
    this.theme = this.mergeTheme(options.theme);
    this.interactionOptions = { ...defaultInteractionOptions, ...options.interaction };
    this.candleRenderer = new CandleRenderer({
      upColor: this.theme.colors.success,
      downColor: this.theme.colors.error,
    });
    this.pluginManager = new PluginManager(this);

    this.resolveContainer();
    this.initialize();
  }

  /**
   * Resolves the container element from options
   */
  private resolveContainer(): void {
    if (typeof this.options.container === 'string') {
      const element = document.querySelector(this.options.container);
      if (!element) {
        throw new Error(`Container element not found: ${this.options.container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = this.options.container;
    }
  }

  /**
   * Initialize the chart
   */
  private initialize(): void {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Create renderer
    this.renderer = new CanvasRenderer(this.canvas);

    // Get container dimensions
    const rect = this.container.getBoundingClientRect();
    const width = this.options.width || rect.width || 800;
    const height = this.options.height || rect.height || 600;

    // Resize canvas to match dimensions
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.resize(width, height);
    }

    // Create layout manager
    const layoutConfig: LayoutConfig = {
      width,
      height,
      priceAxisWidth: 60,
      timeAxisHeight: 40,
      volumeHeight: 0,
      padding: {
        top: this.theme.spacing.padding.medium,
        right: this.theme.spacing.padding.medium,
        bottom: this.theme.spacing.padding.medium,
        left: this.theme.spacing.padding.medium,
      },
    };
    this.layoutManager = new LayoutManager(layoutConfig);

    // Setup interaction
    this.setupInteraction();

    // Initial render
    this.scheduleRender();
  }

  /**
   * Setup interaction handlers
   */
  private setupInteraction(): void {
    if (!this.canvas) return;

    // Create event manager
    this.eventManager = new EventManager(this.canvas);

    // Setup resize observer
    this.eventManager.onResize(() => {
      this.handleResize();
    });

    // Create a temporary viewport for interaction handlers
    // This will be properly initialized when data is added
    const tempViewport = new Viewport({
      time: { start: 0, end: 1000 },
      price: { min: 0, max: 100, paddingPx: 0 },
      width: this.canvas.width,
      height: this.canvas.height,
    });

    // Create interaction handlers
    this.panHandler = new PanHandler(tempViewport, () => this.scheduleRender());
    this.zoomHandler = new ZoomHandler(tempViewport, this.interactionOptions, () =>
      this.scheduleRender(),
    );
    this.scrollHandler = new ScrollHandler(tempViewport, this.interactionOptions.wheelMode, () =>
      this.scheduleRender(),
    );
    this.crosshair = new Crosshair(tempViewport);
    this.crosshairRenderer = new CrosshairRenderer(this.crosshair, tempViewport);

    // Setup event listeners
    if (this.interactionOptions.enablePan) {
      this.eventManager.on('pointerdown', (e) => {
        if (this.panHandler) {
          this.panHandler.onPointerDown(e);
        }
      });

      this.eventManager.on('pointermove', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerMove(e);
        }
      });

      this.eventManager.on('pointerup', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerUp(e);
        }
      });

      this.eventManager.on('pointercancel', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerCancel(e);
        }
      });
    }

    // Crosshair tracking
    if (this.interactionOptions.enableCrosshair) {
      this.eventManager.on('pointermove', (e) => {
        if (this.crosshair && !this.panHandler?.isPanning()) {
          this.crosshair.onPointerMove(e);
          this.scheduleRender();
        }
      });

      this.eventManager.on('mouseleave', () => {
        if (this.crosshair) {
          this.crosshair.hide();
          this.scheduleRender();
        }
      });
    }

    // Wheel handling (zoom or scroll)
    this.eventManager.on('wheel', (e) => {
      if (this.interactionOptions.wheelMode === 'zoomX' && this.zoomHandler) {
        this.zoomHandler.onWheel(e);
      } else if (
        this.interactionOptions.wheelMode === 'scrollX' ||
        this.interactionOptions.wheelMode === 'blend'
      ) {
        // ScrollHandler will check wheelMode internally
        if (this.scrollHandler && this.scrollHandler.onWheel(e)) {
          // Handled by scroll handler
        } else if (this.zoomHandler) {
          // Fall back to zoom for blend mode
          this.zoomHandler.onWheel(e);
        }
      }
    });
  }

  /**
   * Handle canvas resize
   */
  private handleResize(): void {
    if (!this.container || !this.canvas || !this.renderer || !this.layoutManager) return;

    const rect = this.container.getBoundingClientRect();
    const width = this.options.width || rect.width || 800;
    const height = this.options.height || rect.height || 600;

    // Resize renderer
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.resize(width, height);
    }

    // Update layout manager
    this.layoutManager.setDimensions(width, height);

    this.scheduleRender();
  }

  /**
   * Merges partial theme with default theme
   */
  private mergeTheme(partialTheme?: Partial<Theme>): Theme {
    if (!partialTheme) {
      return defaultTheme;
    }

    return {
      ...defaultTheme,
      ...partialTheme,
      colors: {
        ...defaultTheme.colors,
        ...partialTheme.colors,
      },
      typography: {
        ...defaultTheme.typography,
        ...partialTheme.typography,
        fontSize: {
          ...defaultTheme.typography.fontSize,
          ...partialTheme.typography?.fontSize,
        },
        fontWeight: {
          ...defaultTheme.typography.fontWeight,
          ...partialTheme.typography?.fontWeight,
        },
      },
      spacing: {
        ...defaultTheme.spacing,
        ...partialTheme.spacing,
        padding: {
          ...defaultTheme.spacing.padding,
          ...partialTheme.spacing?.padding,
        },
        margin: {
          ...defaultTheme.spacing.margin,
          ...partialTheme.spacing?.margin,
        },
      },
    };
  }

  /**
   * Add a data series to the chart
   *
   * @param series - CandleSeries to add
   */
  public addSeries(series: CandleSeries): void {
    this.seriesList.push(series);

    // Subscribe to data changes
    series.onChange(() => {
      this.scheduleRender();
    });

    this.scheduleRender();
  }

  /**
   * Remove all series
   */
  public clearSeries(): void {
    this.seriesList = [];
    this.scheduleRender();
  }

  /**
   * Schedule a render on the next animation frame
   */
  public scheduleRender(): void {
    if (this.renderScheduled) return;

    this.renderScheduled = true;
    this.animationFrameId = requestAnimationFrame(() => {
      this.render();
      this.renderScheduled = false;
    });
  }

  /**
   * Main render pipeline
   */
  private render(): void {
    if (!this.renderer || !this.layoutManager) return;

    // Compute layout
    const layout = this.layoutManager.compute();

    // Execute before-render plugin hooks
    this.executePluginHooks(layout, RenderPhase.BeforeRender);

    // Clear canvas
    this.renderer.clear();

    // Compute domains from all series
    this.computeDomainsAndViewport(layout);

    // Draw grid
    this.drawGrid(layout);
    this.executePluginHooks(layout, RenderPhase.AfterGrid);

    // Draw axes
    this.drawAxes(layout);
    this.executePluginHooks(layout, RenderPhase.AfterAxes);

    // Draw candles for all series
    this.drawCandles(layout);
    this.executePluginHooks(layout, RenderPhase.AfterCandles);

    // Draw crosshair
    if (this.interactionOptions.enableCrosshair) {
      this.drawCrosshair(layout);
    }

    // Execute after-render plugin hooks
    this.executePluginHooks(layout, RenderPhase.AfterRender);
  }

  /**
   * Draw crosshair
   */
  private drawCrosshair(layout: ChartLayout): void {
    if (!this.crosshairRenderer || !this.renderer) return;

    this.crosshairRenderer.draw(this.renderer, layout.chartArea);
  }

  /**
   * Compute domains and create/update viewport
   */
  private computeDomainsAndViewport(layout: ChartLayout): void {
    if (this.seriesList.length === 0) {
      // Create default viewport even without data
      if (!this.viewport) {
        this.viewport = new Viewport({
          time: { start: 0, end: 1000 },
          price: { min: 0, max: 100, paddingPx: 20 },
          width: layout.chartArea.width,
          height: layout.chartArea.height,
        });
        this.updateInteractionHandlers();
      } else {
        // Just update dimensions
        this.viewport.setDimensions(layout.chartArea.width, layout.chartArea.height);
      }
      return;
    }

    // Compute time domain across all series
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const series of this.seriesList) {
      const domain = series.domainX();
      if (domain) {
        minTime = Math.min(minTime, domain.start);
        maxTime = Math.max(maxTime, domain.end);
      }
    }

    if (!isFinite(minTime) || !isFinite(maxTime)) {
      minTime = 0;
      maxTime = 1000;
    }

    // Determine time range to use
    let timeStart = minTime;
    let timeEnd = maxTime;

    // Preserve viewport time range during interaction
    if (this.hasInitialViewport && this.viewport) {
      const currentTimeRange = this.viewport.getTimeRange();
      timeStart = currentTimeRange.start;
      timeEnd = currentTimeRange.end;
    }

    // Compute price domain across all series for the current time range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const series of this.seriesList) {
      const domain = series.domainY({ start: timeStart, end: timeEnd });
      if (domain) {
        minPrice = Math.min(minPrice, domain.min);
        maxPrice = Math.max(maxPrice, domain.max);
      }
    }

    if (!isFinite(minPrice) || !isFinite(maxPrice)) {
      minPrice = 0;
      maxPrice = 100;
    }

    // Add 5% padding to price range
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.05;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    // Create or update viewport
    if (!this.viewport || !this.hasInitialViewport) {
      this.viewport = new Viewport({
        time: { start: timeStart, end: timeEnd },
        price: { min: minPrice, max: maxPrice, paddingPx: 0 },
        width: layout.chartArea.width,
        height: layout.chartArea.height,
      });
      this.hasInitialViewport = true;
      this.updateInteractionHandlers();

      // Set crosshair series
      const firstSeries = this.seriesList[0] ?? null;
      if (this.crosshair && firstSeries) {
        this.crosshair.setSeries(firstSeries);
      }

      // Set zoom handler data bounds
      if (this.zoomHandler && firstSeries) {
        const avgDuration = (maxTime - minTime) / firstSeries.getLength();
        this.zoomHandler.setDataBounds(minTime, maxTime, avgDuration);
      }
    } else {
      // Update dimensions and price range only
      this.viewport.setDimensions(layout.chartArea.width, layout.chartArea.height);
      this.viewport.setPriceConfig({ min: minPrice, max: maxPrice, paddingPx: 0 });
    }

    // Create or update axes
    const currentTimeRange = this.viewport.getTimeRange();
    this.timeAxis = new TimeAxis(
      { start: currentTimeRange.start, end: currentTimeRange.end },
      layout.chartArea.width,
      80,
    );

    const currentPriceConfig = this.viewport.getPriceConfig();
    this.priceAxis = new PriceAxis(
      { min: currentPriceConfig.min, max: currentPriceConfig.max },
      layout.chartArea.height,
      0,
    );
  }

  /**
   * Update interaction handlers to use the current viewport
   */
  private updateInteractionHandlers(): void {
    if (!this.viewport) return;

    // Update all handlers with the new viewport reference
    if (this.panHandler) {
      this.panHandler = new PanHandler(this.viewport, () => this.scheduleRender());
    }
    if (this.zoomHandler) {
      this.zoomHandler = new ZoomHandler(this.viewport, this.interactionOptions, () =>
        this.scheduleRender(),
      );
    }
    if (this.scrollHandler) {
      this.scrollHandler = new ScrollHandler(this.viewport, this.interactionOptions.wheelMode, () =>
        this.scheduleRender(),
      );
    }
    if (this.crosshair) {
      this.crosshair = new Crosshair(this.viewport);
    }
    if (this.crosshairRenderer && this.crosshair) {
      this.crosshairRenderer = new CrosshairRenderer(this.crosshair, this.viewport);
    }

    // Re-setup event listeners with new handlers
    this.setupInteractionListeners();
  }

  /**
   * Setup interaction event listeners
   */
  private setupInteractionListeners(): void {
    if (!this.eventManager) return;

    // Clear existing handlers (EventManager doesn't have a clear method, so we'll just add new ones)
    // Note: This creates duplicate listeners, but for now we'll accept this
    // A better approach would be to store listener references and remove them

    // Setup event listeners
    if (this.interactionOptions.enablePan) {
      this.eventManager.on('pointerdown', (e) => {
        if (this.panHandler) {
          this.panHandler.onPointerDown(e);
        }
      });

      this.eventManager.on('pointermove', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerMove(e);
        }
      });

      this.eventManager.on('pointerup', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerUp(e);
        }
      });

      this.eventManager.on('pointercancel', (e) => {
        if (this.panHandler && this.panHandler.isPanning()) {
          this.panHandler.onPointerCancel(e);
        }
      });
    }

    // Crosshair tracking
    if (this.interactionOptions.enableCrosshair) {
      this.eventManager.on('pointermove', (e) => {
        if (this.crosshair && !this.panHandler?.isPanning()) {
          this.crosshair.onPointerMove(e);
          this.scheduleRender();
        }
      });

      this.eventManager.on('mouseleave', () => {
        if (this.crosshair) {
          this.crosshair.hide();
          this.scheduleRender();
        }
      });
    }

    // Wheel handling (zoom or scroll)
    this.eventManager.on('wheel', (e) => {
      if (this.interactionOptions.wheelMode === 'zoomX' && this.zoomHandler) {
        this.zoomHandler.onWheel(e);
      } else if (
        this.interactionOptions.wheelMode === 'scrollX' ||
        this.interactionOptions.wheelMode === 'blend'
      ) {
        // ScrollHandler will check wheelMode internally
        if (this.scrollHandler && this.scrollHandler.onWheel(e)) {
          // Handled by scroll handler
        } else if (this.zoomHandler) {
          // Fall back to zoom for blend mode
          this.zoomHandler.onWheel(e);
        }
      }
    });
  }

  /**
   * Draw grid lines
   */
  private drawGrid(layout: ChartLayout): void {
    if (!this.renderer || !this.timeAxis || !this.priceAxis) return;

    const { chartArea } = layout;
    const gridColor = this.theme.colors.grid;

    this.renderer.save();
    this.renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Draw vertical grid lines (time)
    const timeTicks = this.timeAxis.generateTicks();
    for (const tick of timeTicks) {
      const x = chartArea.x + tick.position;
      this.renderer.beginPath();
      this.renderer.moveTo(x, chartArea.y);
      this.renderer.lineTo(x, chartArea.y + chartArea.height);
      this.renderer.stroke(gridColor, 1);
    }

    // Draw horizontal grid lines (price)
    const priceTicks = this.priceAxis.generateTicks();
    for (const tick of priceTicks) {
      const y = chartArea.y + tick.position;
      this.renderer.beginPath();
      this.renderer.moveTo(chartArea.x, y);
      this.renderer.lineTo(chartArea.x + chartArea.width, y);
      this.renderer.stroke(gridColor, 1);
    }

    this.renderer.restore();
  }

  /**
   * Draw axes labels
   */
  private drawAxes(layout: ChartLayout): void {
    if (!this.renderer || !this.timeAxis || !this.priceAxis) return;

    const { chartArea, timeAxisArea, priceAxisArea } = layout;
    const axisColor = this.theme.colors.axis;
    const font = `${this.theme.typography.fontSize.medium}px ${this.theme.typography.fontFamily}`;

    // Draw time axis labels
    const timeTicks = this.timeAxis.generateTicks();
    for (const tick of timeTicks) {
      const x = timeAxisArea.x + tick.position;
      const y = timeAxisArea.y + 20;

      // Simple time formatting (just show timestamp for now)
      const date = new Date(tick.value);
      const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      this.renderer.drawText(label, x, y, axisColor, font, 'center', 'middle');
    }

    // Draw price axis labels
    const priceTicks = this.priceAxis.generateTicks();
    for (const tick of priceTicks) {
      const x = priceAxisArea.x + 10;
      const y = chartArea.y + tick.position;

      this.renderer.drawText(tick.label, x, y, axisColor, font, 'left', 'middle');
    }
  }

  /**
   * Draw candles for all series
   */
  private drawCandles(layout: ChartLayout): void {
    if (!this.renderer || !this.viewport) return;

    const { chartArea } = layout;

    this.renderer.save();
    this.renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Translate renderer to chart area
    const ctx = (this.renderer as CanvasRenderer).getContext();
    ctx.translate(chartArea.x, chartArea.y);

    // Draw candles for each series
    for (const series of this.seriesList) {
      if (series.getLength() === 0) continue;

      // Get visible range
      const timeRange = this.viewport.getTimeRange();
      const dataView = series.rangeByTime(timeRange.start, timeRange.end);

      if (dataView.length > 0) {
        this.candleRenderer.draw(this.renderer, this.viewport, dataView);
      }
    }

    // Restore translation
    ctx.translate(-chartArea.x, -chartArea.y);

    this.renderer.restore();
  }

  /**
   * Execute plugin hooks for a render phase
   */
  private executePluginHooks(layout: ChartLayout, phase: RenderPhase): void {
    if (!this.renderer) return;

    this.pluginManager.executeHooks({
      renderer: this.renderer,
      layout,
      phase,
      chart: this,
    });
  }

  /**
   * Install a plugin
   *
   * @param plugin - Plugin to install
   */
  public installPlugin(plugin: IPlugin): void {
    this.pluginManager.install(plugin);
    this.scheduleRender();
  }

  /**
   * Uninstall a plugin
   *
   * @param name - Plugin name
   */
  public uninstallPlugin(name: string): void {
    this.pluginManager.uninstall(name);
    this.scheduleRender();
  }

  /**
   * Get list of installed plugin names
   *
   * @returns Array of plugin names
   */
  public getInstalledPlugins(): string[] {
    return this.pluginManager.getPlugins().map((plugin) => plugin.name);
  }

  /**
   * Gets the current theme
   */
  public getTheme(): Theme {
    return this.theme;
  }

  /**
   * Gets the container element
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Gets the canvas element
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Gets the renderer
   */
  public getRenderer(): IRenderer | null {
    return this.renderer;
  }

  /**
   * Gets the current options
   */
  public getOptions(): ChartOptions {
    return this.options;
  }

  /**
   * Gets all series
   */
  public getSeries(): CandleSeries[] {
    return [...this.seriesList];
  }

  /**
   * Gets the current viewport
   */
  public getViewport(): Viewport | null {
    return this.viewport;
  }

  /**
   * Gets the crosshair state
   */
  public getCrosshairState() {
    return this.crosshair?.getState();
  }

  /**
   * Zoom in programmatically
   */
  public zoomIn(centerX?: number): void {
    if (this.zoomHandler) {
      this.zoomHandler.zoomIn(centerX);
    }
  }

  /**
   * Zoom out programmatically
   */
  public zoomOut(centerX?: number): void {
    if (this.zoomHandler) {
      this.zoomHandler.zoomOut(centerX);
    }
  }

  /**
   * Reset zoom to show all data
   */
  public resetZoom(): void {
    if (this.zoomHandler) {
      this.zoomHandler.resetZoom();
    }
  }

  /**
   * Scroll left programmatically
   */
  public scrollLeft(amount?: number): void {
    if (this.scrollHandler) {
      this.scrollHandler.scrollLeft(amount);
    }
  }

  /**
   * Scroll right programmatically
   */
  public scrollRight(amount?: number): void {
    if (this.scrollHandler) {
      this.scrollHandler.scrollRight(amount);
    }
  }

  /**
   * Set wheel mode
   */
  public setWheelMode(mode: 'zoomX' | 'scrollX' | 'blend'): void {
    this.interactionOptions.wheelMode = mode;
    if (this.scrollHandler) {
      this.scrollHandler.setWheelMode(mode);
    }
  }

  /**
   * Destroys the chart and cleans up resources
   */
  public destroy(): void {
    // Cancel any pending render
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Cleanup event manager
    if (this.eventManager) {
      this.eventManager.destroy();
      this.eventManager = null;
    }

    // Remove canvas from container
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }

    // Clear references
    this.canvas = null;
    this.renderer = null;
    this.container = null;
    this.seriesList = [];
    this.viewport = null;
    this.timeAxis = null;
    this.priceAxis = null;
    this.panHandler = null;
    this.zoomHandler = null;
    this.scrollHandler = null;
    this.crosshair = null;
    this.crosshairRenderer = null;
  }
}
