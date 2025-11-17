# Architecture Overview

SolVX Graph Engine is built with a modular, layered architecture designed for performance, extensibility, and maintainability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│  (Your code, React components, event handlers)           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                     Chart (Facade)                       │
│  Orchestrates all subsystems, manages lifecycle          │
└───┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┘
    │      │      │      │      │      │      │
┌───┴──┐ ┌─┴───┐ ┌┴────┐ ┌┴────┐ ┌┴───┐ ┌┴───┐ ┌┴────────┐
│ Data │ │Rend-│ │Inter│ │Plug-│ │View│ │Axis│ │Crosshair│
│Series│ │erer │ │actio│ │ins │ │port│ │    │ │         │
│      │ │     │ │n    │ │     │ │    │ │    │ │         │
└──────┘ └─────┘ └─────┘ └─────┘ └────┘ └────┘ └─────────┘
```

## Core Components

### 1. Data Layer

**CandleSeries**

- Stores OHLCV data in typed arrays (`Float64Array`)
- Columnar storage for cache efficiency
- Binary search for time-based queries
- Live update support (`updateOrAppend`)

**IDataSource**

- Interface for live and historical data
- Implementations: `RandomWalkSource`, `ArrayPlaybackSource`
- Subscription-based push model

### 2. Coordinate System

**Viewport**

- Manages time/price to pixel transformations
- Bidirectional scaling: `xScale`, `yScale`, `invX`, `invY`
- Pan and zoom operations
- Visible range calculation

**LayoutManager**

- Computes layout rectangles for all chart components
- Defines chart area, time axis, price axis, volume area
- Handles padding and responsive sizing

### 3. Rendering Pipeline

**CanvasRenderer**

- Hardware-accelerated Canvas 2D rendering
- HiDPI support with device pixel ratio handling
- Pixel snapping for crisp lines
- Batched drawing operations

**CandleRenderer**

- Draws candlesticks with configurable styles
- Optimized for visible range only
- Supports bullish/bearish color schemes

**Render Phases**

```typescript
enum RenderPhase {
  BeforeRender, // Setup, clear canvas
  AfterGrid, // After grid lines drawn
  AfterAxes, // After axes drawn
  AfterCandles, // After candles drawn
  AfterRender, // Final overlay phase
}
```

### 4. Interaction System

**EventManager**

- Normalizes browser events to chart events
- Handles mouse, touch, and wheel events
- Provides unified `ChartEvent` interface

**Interaction Handlers**

- `PanHandler`: Click-and-drag panning
- `ZoomHandler`: Pinch-to-zoom, double-click zoom
- `ScrollHandler`: Mousewheel navigation
- `Crosshair`: Pointer tracking with candle snapping

### 5. Plugin System

**PluginManager**

- Manages plugin lifecycle
- Executes plugin hooks at each render phase
- Supports dynamic install/uninstall

**IPlugin Interface**

```typescript
interface IPlugin {
  name: string;
  onInstall?(chart: unknown): void;
  onUninstall?(chart: unknown): void;
  onRender?(context: PluginContext): void;
}
```

**Built-in Plugins**

- `CrosshairTooltipPlugin`: OHLCV tooltip
- `MovingAveragePlugin`: Technical indicator overlay
- `ShapesOverlayPlugin`: Rectangles, lines, bands

## Data Flow

### Static Data Flow

```
candleData[]
     │
     ├──> CandleSeries.setData()
     │
     ├──> Series stored in typed arrays
     │
     ├──> Chart.addSeries(series)
     │
     ├──> scheduleRender() (rAF)
     │
     ├──> render()
     │    ├── updateViewport()
     │    ├── drawGrid()
     │    ├── drawAxes()
     │    ├── drawCandles()
     │    └── executePluginHooks()
     │
     └──> Canvas updated
```

### Live Data Flow

```
IDataSource
     │
     ├──> subscribe(callback)
     │
     ├──> candle update emitted
     │
     ├──> series.updateOrAppend(candle)
     │    ├── Check if ts matches last candle
     │    ├──> Update: modify last candle
     │    └──> Append: add new candle
     │
     ├──> notifyListeners()
     │
     ├──> scheduleRender() (rAF coalescing)
     │
     └──> render() at 60 FPS
```

## Performance Optimizations

### Memory Efficiency

- **Typed Arrays**: `Float64Array` for numeric data (50% memory savings vs regular arrays)
- **Columnar Storage**: Better cache locality for time-series access patterns
- **View-based Access**: `subarray()` instead of copies where possible

### Rendering Efficiency

- **Visible Range Only**: Only render candles in viewport
- **rAF Coalescing**: Multiple updates batched into single render frame
- **Dirty Region Tracking**: Minimal redraws (implicit via rAF)

### Computational Efficiency

- **Binary Search**: O(log n) time-based queries
- **Amortized Growth**: 1.5x array growth factor minimizes reallocations
- **Lazy Computation**: Plugin calculations only when needed

## Extension Points

### Custom Plugins

```typescript
class CustomPlugin implements IPlugin {
  name = 'custom';

  onRender(context: PluginContext): void {
    if (context.phase !== RenderPhase.AfterCandles) return;

    const { renderer, layout, chart } = context;
    // Custom rendering logic here
  }
}
```

### Custom Data Sources

```typescript
class WebSocketSource implements IDataSource {
  subscribe(callback: CandleUpdateCallback) {
    const ws = new WebSocket('wss://api.example.com/candles');
    ws.onmessage = (event) => {
      const candle = JSON.parse(event.data);
      callback(candle);
    };
    return () => ws.close();
  }
}
```

### Custom Themes

Fully typed theme system with color, typography, and spacing configurations. See [Core Concepts](/core-concepts) for details.

## Next Steps

- Learn about [Core Concepts](/core-concepts) for in-depth understanding
- Explore [Plugins & Extensions](/plugins-and-extensions) for customization
- Check [API Reference](/api-reference) for complete API documentation
