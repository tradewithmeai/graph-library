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
