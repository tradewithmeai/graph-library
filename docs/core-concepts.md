# Core Concepts

Understanding these core concepts will help you get the most out of SolVX Graph Engine.

## Data Model

### Candle Structure

```typescript
interface Candle {
  ts: number; // Timestamp in milliseconds
  open: number; // Opening price
  high: number; // Highest price
  low: number; // Lowest price
  close: number; // Closing price
  volume?: number; // Trading volume (optional)
  meta?: CandleMeta; // Additional metadata (optional)
}
```

### CandleSeries

Stores candle data in columnar format using typed arrays:

```typescript
const series = new CandleSeries(candleData);

// Query methods
series.getLength(); // Number of candles
series.getCandle(index); // Get candle at index
series.domainX(); // Time range {start, end}
series.domainY(); // Price range {min, max}
series.rangeByTime(start, end); // Get candles in time range

// Live update methods
series.updateOrAppend(candle); // Smart update/append
series.appendCandle(candle); // Force append
series.updateLastCandle(candle); // Update last candle only
series.clear(); // Remove all data
```

## Coordinate Transformations

### Viewport

The `Viewport` manages bidirectional transformations between data space and pixel space:

```typescript
const viewport = new Viewport({
  time: { start: 1609459200000, end: 1609545600000 },
  price: { min: 95, max: 110, paddingPx: 20 },
  width: 800,
  height: 400,
});

// Data to pixels
const x = viewport.xScale(timestamp); // timestamp → x pixels
const y = viewport.yScale(price); // price → y pixels

// Pixels to data
const ts = viewport.invX(xPixels); // x pixels → timestamp
const price = viewport.invY(yPixels); // y pixels → price

// Navigation
viewport.pan(timeDelta, priceDelta);
viewport.zoom(factor, centerX);
```

## Rendering System

### Render Loop

The chart uses `requestAnimationFrame` for smooth 60 FPS rendering:

```typescript
// Updates are coalesced - multiple calls result in single render
chart.scheduleRender();  // Request render on next frame

// Rendering happens in phases:
1. BeforeRender  - Clear canvas, setup
2. AfterGrid     - Grid lines drawn
3. AfterAxes     - Axes drawn
4. AfterCandles  - Candles drawn
5. AfterRender   - Final overlays
```

### Canvas Renderer

Hardware-accelerated 2D rendering with HiDPI support:

```typescript
const renderer = new CanvasRenderer(canvas);

// Drawing primitives
renderer.fillRect(x, y, width, height, color);
renderer.strokeRect(x, y, width, height, color, lineWidth);
renderer.drawText(text, x, y, color, font);
renderer.beginPath();
renderer.moveTo(x, y);
renderer.lineTo(x, y);
renderer.stroke(color, lineWidth);
```

## Interaction System

### Event Handling

```typescript
// Built-in interactions
const chart = new Chart({
  container,
  width: 800,
  height: 400,
  interactions: {
    pan: true, // Enable panning
    zoom: true, // Enable zoom
    scroll: true, // Enable mousewheel
    crosshair: true, // Enable crosshair
    wheelMode: 'zoom', // 'zoom' | 'scroll'
  },
});

// Custom event handling
chart.on('click', (event: ChartEvent) => {
  console.log('Clicked at', event.chartX, event.chartY);
});
```

### Crosshair State

```typescript
interface CrosshairState {
  x: number; // X position in pixels
  y: number; // Y position in pixels
  candle: Candle | null; // Snapped candle (if any)
  candleIndex: number; // Index of snapped candle
  time: number; // Timestamp at cursor
  price: number; // Price at cursor
  visible: boolean; // Is crosshair visible
}

const state = chart.getCrosshairState();
```

## Plugin System

### Plugin Interface

```typescript
interface IPlugin {
  name: string; // Unique plugin identifier

  // Lifecycle hooks
  onInstall?(chart: unknown): void;
  onUninstall?(chart: unknown): void;

  // Rendering hook
  onRender?(context: PluginContext): void;
}

interface PluginContext {
  renderer: IRenderer; // Canvas renderer
  layout: ChartLayout; // Layout rectangles
  phase: RenderPhase; // Current render phase
  chart: unknown; // Chart instance
}
```

### Creating Custom Plugins

```typescript
class MyPlugin implements IPlugin {
  public readonly name = 'my-plugin';

  public onInstall(chart: unknown): void {
    console.log('Plugin installed');
  }

  public onRender(context: PluginContext): void {
    // Only render in specific phase
    if (context.phase !== RenderPhase.AfterCandles) return;

    const { renderer, layout } = context;
    const { chartArea } = layout;

    // Custom rendering
    renderer.save();
    renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Draw something
    renderer.fillRect(chartArea.x + 10, chartArea.y + 10, 100, 50, 'rgba(255, 0, 0, 0.5)');

    renderer.restore();
  }

  public onUninstall(): void {
    console.log('Plugin uninstalled');
  }
}

// Usage
chart.installPlugin(new MyPlugin());
```

## Live Data System

### Data Source Interface

```typescript
interface IDataSource {
  id?: string;

  // Subscribe to updates
  subscribe(callback: CandleUpdateCallback): () => void;

  // Optional batch subscription
  subscribeBatch?(callback: CandleBatchCallback): () => void;

  // Optional historical data fetch
  fetchRange?(startTime: number, endTime: number): Promise<Candle[]>;

  // Optional lifecycle
  start?(): void;
  stop?(): void;
}
```

### Using Data Sources

```typescript
// Random walk source (for testing)
const randomSource = new RandomWalkSource({
  initialPrice: 100,
  volatility: 1.5,
  interval: 250, // Update every 250ms
  candleDuration: 5000, // 5-second candles
});

// Array playback source (for backtesting)
const playbackSource = new ArrayPlaybackSource({
  data: historicalCandles,
  speed: 2, // 2x speed
  loop: false,
});

// Connect to chart
chart.connectDataSource(series, randomSource);

// Disconnect when done
chart.disconnectDataSource(series);
```

### Custom Data Source Example

```typescript
class WebSocketDataSource implements IDataSource {
  private ws: WebSocket;
  private subscribers = new Set<CandleUpdateCallback>();

  constructor(private url: string) {}

  subscribe(callback: CandleUpdateCallback) {
    this.subscribers.add(callback);

    if (this.subscribers.size === 1) {
      this.start();
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  start() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => {
      const candle: Candle = JSON.parse(event.data);
      for (const callback of this.subscribers) {
        callback(candle);
      }
    };
  }

  stop() {
    this.ws?.close();
  }
}
```

## Theming

### Theme Structure

```typescript
interface Theme {
  colors: {
    background: string;
    grid: string;
    text: string;
    candleUp: string;
    candleDown: string;
    candleWickUp: string;
    candleWickDown: string;
    volumeUp: string;
    volumeDown: string;
    crosshair: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
  };
  spacing: {
    padding: number;
    gridSpacing: number;
  };
}
```

### Using Themes

```typescript
import { defaultTheme } from '@solvx/graph-engine';

// Create custom theme
const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#1a1a1a',
    grid: '#333333',
    text: '#ffffff',
    candleUp: '#00ff00',
    candleDown: '#ff0000',
  },
};

// Apply theme
const chart = new Chart({
  container,
  width: 800,
  height: 400,
  theme: darkTheme,
});

// Update theme dynamically
chart.setTheme(darkTheme);
```

## Performance Considerations

### Data Updates

```typescript
// ❌ Inefficient: Recreate series on every update
series.setData([...oldData, newCandle]);

// ✅ Efficient: Use updateOrAppend for live data
series.updateOrAppend(newCandle);
```

### Rendering

```typescript
// ❌ Don't call render directly
chart.render();

// ✅ Use scheduleRender (coalesces via rAF)
chart.scheduleRender();
```

### Memory Management

```typescript
// Clean up when done
chart.disconnectAllDataSources();
chart.destroy();
```

## Next Steps

- Explore [Plugins & Extensions](/plugins-and-extensions) for advanced customization
- Check out [Examples](/examples) for complete code samples
- Dive into [API Reference](/api-reference) for detailed documentation
