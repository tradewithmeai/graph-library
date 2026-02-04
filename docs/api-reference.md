# API Reference

Complete API documentation for SolVX Graph Engine.

## Chart

The main chart class that orchestrates all components.

### Constructor

```typescript
constructor(options: ChartOptions)
```

### ChartOptions

```typescript
interface ChartOptions {
  container: HTMLElement | string; // Container element or CSS selector
  width?: number; // Chart width (default: container width)
  height?: number; // Chart height (default: 600)
  theme?: Partial<Theme>; // Custom theme (default: defaultTheme)
  interaction?: InteractionOptions; // Interaction configuration
}
```

### Methods

#### Data Management

```typescript
addSeries(series: CandleSeries): void
```

Add a data series to the chart.

```typescript
getSeries(): CandleSeries[]
```

Get all data series.

```typescript
clearSeries(): void
```

Remove all data series.

#### Live Data

```typescript
connectDataSource(series: CandleSeries, dataSource: IDataSource): void
```

Connect a live data source to a series.

```typescript
disconnectDataSource(series: CandleSeries): void
```

Disconnect a data source from a series.

```typescript
disconnectAllDataSources(): void
```

Disconnect all data sources.

#### Plugins

```typescript
installPlugin(plugin: IPlugin): void
```

Install a plugin.

```typescript
uninstallPlugin(name: string): void
```

Uninstall a plugin by name.

```typescript
getInstalledPlugins(): string[]
```

Get names of all installed plugins.

#### State Access

```typescript
getViewport(): Viewport
```

Get the viewport instance.

```typescript
getCrosshairState(): CrosshairState | null
```

Get current crosshair state.

```typescript
getContainer(): HTMLElement | null
```

Get the chart container element.

```typescript
getTheme(): Theme
```

Get the current theme.

```typescript
setTheme(theme: Partial<Theme>): void
```

Update the theme at runtime.

#### Events

```typescript
on(type: ChartEventType, handler: EventHandler): void
```

Register an event handler (`'pointerdown'`, `'pointermove'`, `'pointerup'`, `'wheel'`, `'click'`, `'dblclick'`, `'mouseleave'`).

```typescript
off(type: ChartEventType, handler: EventHandler): void
```

Unregister an event handler.

#### Series

```typescript
setSeriesOpacity(index: number, opacity: number): void
```

Set rendering opacity (0-1) for a series by index.

#### Rendering

```typescript
scheduleRender(): void
```

Schedule a render on the next animation frame.

```typescript
resize(width: number, height: number): void
```

Resize the chart.

#### Lifecycle

```typescript
destroy(): void
```

Clean up and destroy the chart.

---

## CandleSeries

High-performance candle data storage using typed arrays.

### Constructor

```typescript
constructor(candles?: Candle[])
```

### Methods

#### Data Access

```typescript
getLength(): number
```

Get number of candles.

```typescript
getCandle(index: number): Candle | null
```

Get candle at index.

```typescript
getTimestamp(index: number): number
```

Get timestamp at index.

```typescript
toArray(): Candle[]
```

Convert to regular array.

#### Queries

```typescript
firstIndexAtOrAfter(timestamp: number): number
```

Binary search for first index >= timestamp.

```typescript
lastIndexAtOrBefore(timestamp: number): number
```

Binary search for last index <= timestamp.

```typescript
rangeByIndex(start: number, end: number): CandleDataView
```

Get view of data by index range.

```typescript
rangeByTime(start: number, end: number): CandleDataView
```

Get view of data by time range.

```typescript
domainX(): TimeRange | null
```

Get time domain (min/max timestamps).

```typescript
domainY(xRange?: TimeRange): PriceRange | null
```

Get price domain (min/max prices), optionally constrained by time range.

#### Data Modification

```typescript
setData(candles: Candle[]): void
```

Replace all data.

```typescript
updateOrAppend(candle: Candle): void
```

Smart update/append based on timestamp.

```typescript
updateLastCandle(candle: Candle): void
```

Update the last candle.

```typescript
appendCandle(candle: Candle): void
```

Append a new candle.

```typescript
clear(): void
```

Remove all data.

#### Subscriptions

```typescript
onChange(listener: () => void): () => void
```

Subscribe to data changes. Returns unsubscribe function.

---

## Viewport

Manages coordinate transformations between data and pixel space.

### Constructor

```typescript
constructor(config: ViewportConfig)
```

### ViewportConfig

```typescript
interface ViewportConfig {
  time: TimeRange; // { start: number, end: number }
  price: ViewportPriceConfig; // { min: number, max: number, paddingPx: number }
  width: number; // Viewport width in pixels
  height: number; // Viewport height in pixels
}
```

### Methods

#### Transformations

```typescript
xScale(timestamp: number): number
```

Convert timestamp to X pixel coordinate.

```typescript
yScale(price: number): number
```

Convert price to Y pixel coordinate.

```typescript
invX(pixels: number): number
```

Convert X pixels to timestamp.

```typescript
invY(pixels: number): number
```

Convert Y pixels to price.

#### Navigation

```typescript
pan(timeDelta: number, priceDelta?: number): void
```

Pan the viewport.

```typescript
zoom(factor: number, centerX: number): void
```

Zoom the viewport around a center point.

#### Configuration

```typescript
setTimeRange(range: TimeRange): void
```

Update time range.

```typescript
setPriceConfig(config: ViewportPriceConfig): void
```

Update price configuration.

```typescript
setDimensions(width: number, height: number): void
```

Update viewport dimensions.

#### Queries

```typescript
getTimeRange(): TimeRange
```

Get current time range.

```typescript
getPriceConfig(): ViewportPriceConfig
```

Get current price configuration.

```typescript
getDimensions(): { width: number; height: number }
```

Get viewport dimensions.

```typescript
getTimeSpan(): number
```

Get time span in milliseconds.

```typescript
getPriceSpan(): number
```

Get price span.

---

## Data Sources

### IDataSource

```typescript
interface IDataSource {
  id?: string;
  subscribe(callback: CandleUpdateCallback): () => void;
  subscribeBatch?(callback: CandleBatchCallback): () => void;
  fetchRange?(startTime: number, endTime: number): Promise<Candle[]>;
  start?(): void;
  stop?(): void;
}
```

### RandomWalkSource

```typescript
constructor(config?: RandomWalkConfig)
```

```typescript
interface RandomWalkConfig {
  initialPrice?: number; // Default: 100
  volatility?: number; // Default: 1
  interval?: number; // Default: 1000 (ms)
  candleDuration?: number; // Default: 5000 (ms)
  baseVolume?: number; // Default: 100000
  id?: string;
}
```

#### Methods

```typescript
start(): void
stop(): void
getCurrentCandle(): Candle | null
updateConfig(config: Partial<RandomWalkConfig>): void
```

### ArrayPlaybackSource

```typescript
constructor(config: ArrayPlaybackConfig)
```

```typescript
interface ArrayPlaybackConfig {
  data: Candle[]; // Required: data to play back
  speed?: number; // Default: 1 (real-time)
  loop?: boolean; // Default: false
  fixedInterval?: number; // Override time-based intervals
  id?: string;
}
```

#### Methods

```typescript
start(): void
stop(): void
reset(): void
setSpeed(speed: number): void
getSpeed(): number
getProgress(): number
isComplete(): boolean
getCurrentIndex(): number
getTotalCandles(): number
```

---

## Plugins

### IPlugin

```typescript
interface IPlugin {
  name: string;
  onInstall?(chart: unknown): void;
  onUninstall?(chart: unknown): void;
  onRender?(context: PluginContext): void;
  onEvent?(event: ChartEvent): void;
}
```

### PluginContext

```typescript
interface PluginContext {
  renderer: IRenderer;
  layout: ChartLayout;
  phase: RenderPhase;
  chart: unknown;
}
```

### RenderPhase

```typescript
enum RenderPhase {
  BeforeRender,
  AfterGrid,
  AfterAxes,
  AfterCandles,
  AfterRender,
}
```

### CrosshairTooltipPlugin

```typescript
constructor(style?: Partial<TooltipStyle>)
```

```typescript
interface TooltipStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  padding: number;
  font: string;
}
```

### MovingAveragePlugin

```typescript
constructor(config?: Partial<MovingAverageConfig>, id?: string)
```

```typescript
interface MovingAverageConfig {
  period: number; // Default: 20
  source: 'open' | 'high' | 'low' | 'close'; // Default: 'close'
  color: string; // Default: '#2196F3'
  lineWidth: number; // Default: 2
}
```

### ShapesOverlayPlugin

```typescript
constructor();
```

#### Methods

```typescript
addRect(t0: number, t1: number, p0: number, p1: number, style?: Partial<ShapeStyle>): string
addLine(t0: number, t1: number, price: number, style?: Partial<ShapeStyle>): string
addBand(p0: number, p1: number, style?: Partial<ShapeStyle>): string
removeShape(id: string): boolean
clearShapes(): void
updateShapeStyle(id: string, style: Partial<ShapeStyle>): boolean
```

```typescript
interface ShapeStyle {
  strokeColor?: string;
  fillColor?: string;
  lineWidth?: number;
  opacity?: number;
}
```

---

## Types

### Candle

```typescript
interface Candle {
  ts: number; // Timestamp (ms)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  meta?: CandleMeta;
}
```

### TimeRange

```typescript
interface TimeRange {
  start: number; // Timestamp (ms)
  end: number; // Timestamp (ms)
}
```

### PriceRange

```typescript
interface PriceRange {
  min: number;
  max: number;
}
```

### CrosshairState

```typescript
interface CrosshairState {
  x: number;
  y: number;
  candle: Candle | null;
  candleIndex: number;
  time: number;
  price: number;
  visible: boolean;
}
```

### Theme

```typescript
interface Theme {
  colors: ColorConfig;
  typography: Typography;
  spacing: Spacing;
  borderRadius: number;
  strokeWidth: number;
}
```

See the [source code](https://github.com/tradewithmeai/graph-library/blob/main/packages/core/src/types.ts) for complete theme interface definitions.

---

## React

### SolVXChart Component

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';

<SolVXChart
  width={800}
  height={400}
  theme={customTheme}
  onChartReady={(chart) => {
    // Chart initialization
  }}
/>;
```

#### Props

```typescript
interface SolVXChartProps {
  width?: number;
  height?: number;
  theme?: Theme;
  onChartReady?: (chart: Chart) => void;
}
```
