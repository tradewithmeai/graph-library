/**
 * SolVX Graph Engine - Core Package
 *
 * A high-performance charting library for financial and data visualization.
 */

// Phase 1: Foundational structure
export { Chart } from './Chart';
export { defaultTheme } from './theme';
export type { ChartOptions, Theme, ColorConfig, Typography, Spacing } from './types';

// Phase 2: Data model and coordinate scaling
export { CandleSeries } from './data';
export type {
  Candle,
  CandleMeta,
  CandleDataView,
  TimestampMs,
  TimeRange,
  PriceRange,
  ViewportPriceConfig,
  ChangeListener,
} from './data';

export { Viewport } from './viewport';
export type { ViewportConfig } from './viewport';

export { TimeAxis, defaultTimeFormatter, PriceAxis, defaultPriceFormatter } from './axis';
export type { TimeTick, TimeFormatter, PriceTick, PriceFormatter } from './axis';

// Phase 3: Rendering engine
export { CanvasRenderer } from './renderer';
export type { IRenderer } from './renderer';

export { LayoutManager } from './layout';
export type { LayoutConfig, LayoutRect, ChartLayout } from './layout';

export { CandleRenderer, defaultCandleStyle } from './drawing';
export type { CandleStyle } from './drawing';

export { PluginManager, RenderPhase } from './plugins';
export type { IPlugin, PluginHook, PluginContext } from './plugins';

// Phase 4: Interaction and event handling
export { EventManager } from './events';
export type {
  EventHandler,
  ChartEvent,
  ChartEventType,
  InteractionOptions,
  WheelMode,
} from './events';
export { InteractionMode, defaultInteractionOptions } from './events';

export { PanHandler } from './interaction';
export { ZoomHandler } from './interaction';
export { ScrollHandler } from './interaction';

export { Crosshair } from './crosshair';
export type { CrosshairState } from './crosshair';
export { CrosshairRenderer, defaultCrosshairStyle } from './crosshair';
export type { CrosshairStyle } from './crosshair';

// Phase 5: Plugin architecture and built-in plugins
export {
  CrosshairTooltipPlugin,
  defaultTooltipStyle,
  MovingAveragePlugin,
  defaultMAConfig,
  ShapesOverlayPlugin,
  defaultShapeStyle,
} from './plugins-builtin';
export type {
  TooltipStyle,
  MovingAverageConfig,
  ShapeStyle,
  Rectangle,
  Line,
  HorizontalBand,
  Shape,
} from './plugins-builtin';

// Phase 6: Live data system
export type { IDataSource, CandleUpdateCallback, CandleBatchCallback } from './data/IDataSource';
export { RandomWalkSource } from './data/RandomWalkSource';
export type { RandomWalkConfig } from './data/RandomWalkSource';
export { ArrayPlaybackSource } from './data/ArrayPlaybackSource';
export type { ArrayPlaybackConfig } from './data/ArrayPlaybackSource';
