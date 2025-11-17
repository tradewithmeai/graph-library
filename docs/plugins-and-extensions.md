# Plugins & Extensions

The SolVX Graph Engine plugin system provides a powerful way to extend chart functionality without modifying the core library.

## Built-in Plugins

### CrosshairTooltipPlugin

Displays a tooltip with OHLCV data at the crosshair position.

```typescript
import { CrosshairTooltipPlugin } from '@solvx/graph-engine';

const plugin = new CrosshairTooltipPlugin({
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderColor: '#666',
  textColor: '#fff',
  padding: 8,
});

chart.installPlugin(plugin);
```

**Features:**

- Follows crosshair position
- Shows timestamp, OHLCV values
- Volume formatting (K/M/B suffixes)
- Smart positioning (flips when near edges)
- Customizable styling

### MovingAveragePlugin

Calculates and renders simple moving averages.

```typescript
import { MovingAveragePlugin } from '@solvx/graph-engine';

// 20-period MA
const ma20 = new MovingAveragePlugin(
  {
    period: 20,
    sourceField: 'close', // 'open' | 'high' | 'low' | 'close'
    color: '#2196F3',
    lineWidth: 2,
  },
  'ma-20', // Unique ID
);

// 50-period MA
const ma50 = new MovingAveragePlugin({ period: 50, color: '#FF9800' }, 'ma-50');

chart.installPlugin(ma20);
chart.installPlugin(ma50);
```

**Features:**

- Configurable period and source field
- Efficient calculation (only visible range)
- Multiple instances supported
- Polyline rendering with viewport clipping

### ShapesOverlayPlugin

Draw rectangles, lines, and horizontal bands on the chart.

```typescript
import { ShapesOverlayPlugin } from '@solvx/graph-engine';

const shapesPlugin = new ShapesOverlayPlugin();
chart.installPlugin(shapesPlugin);

// Add a support/resistance zone
shapesPlugin.addBand(95, 105, {
  fillColor: 'rgba(76, 175, 80, 0.1)',
  strokeColor: '#4CAF50',
  lineWidth: 1,
});

// Add a time range highlight
const sessionStart = Date.now() - 4 * 3600000;
const sessionEnd = Date.now();
shapesPlugin.addRect(sessionStart, sessionEnd, 98, 102, {
  fillColor: 'rgba(255, 152, 0, 0.05)',
  strokeColor: '#FF9800',
  lineWidth: 2,
});

// Add a horizontal line
shapesPlugin.addLine(sessionStart, sessionEnd, 100, {
  strokeColor: '#2196F3',
  lineWidth: 2,
  lineDash: [5, 5],
});

// Remove a shape
const shapeId = shapesPlugin.addBand(/* ... */);
shapesPlugin.removeShape(shapeId);

// Clear all shapes
shapesPlugin.clearShapes();
```

**Methods:**

- `addRect(t0, t1, p0, p1, style)` - Add rectangle
- `addLine(t0, t1, price, style)` - Add horizontal line
- `addBand(p0, p1, style)` - Add horizontal band (full width)
- `removeShape(id)` - Remove shape by ID
- `clearShapes()` - Remove all shapes
- `updateShapeStyle(id, style)` - Update shape styling

## Creating Custom Plugins

### Basic Plugin Structure

```typescript
import { IPlugin, PluginContext, RenderPhase } from '@solvx/graph-engine';
import type { IRenderer } from '@solvx/graph-engine';

class MyCustomPlugin implements IPlugin {
  public readonly name = 'my-custom-plugin';

  public onInstall(chart: unknown): void {
    console.log('Plugin installed');
  }

  public onRender(context: PluginContext): void {
    // Choose which phase to render in
    if (context.phase !== RenderPhase.AfterCandles) return;

    this.draw(context);
  }

  private draw(context: PluginContext): void {
    const { renderer, layout, chart } = context;
    const { chartArea } = layout;

    // Your custom rendering logic
    renderer.save();
    renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Draw something
    renderer.fillRect(chartArea.x + 10, chartArea.y + 10, 100, 50, 'rgba(0, 0, 255, 0.3)');

    renderer.restore();
  }

  public onUninstall(chart: unknown): void {
    console.log('Plugin uninstalled');
  }
}

// Usage
chart.installPlugin(new MyCustomPlugin());
```

### Accessing Chart Data

```typescript
class DataAwarePlugin implements IPlugin {
  public readonly name = 'data-aware';
  private chart: Chart | null = null;

  public onInstall(chart: unknown): void {
    this.chart = chart as Chart;
  }

  public onRender(context: PluginContext): void {
    if (context.phase !== RenderPhase.AfterCandles) return;
    if (!this.chart) return;

    // Access series data
    const series = this.chart.getSeries();
    if (series.length === 0 || !series[0]) return;

    const candleSeries = series[0];
    const length = candleSeries.getLength();
    const lastCandle = candleSeries.getCandle(length - 1);

    if (lastCandle) {
      console.log('Last close:', lastCandle.close);
    }

    // Access viewport
    const viewport = this.chart.getViewport();
    const timeRange = viewport.getTimeRange();

    // Access crosshair state
    const crosshair = this.chart.getCrosshairState();
    if (crosshair && crosshair.visible && crosshair.candle) {
      console.log('Hovering over candle:', crosshair.candle);
    }
  }
}
```

### Plugin with State

```typescript
class StatefulPlugin implements IPlugin {
  public readonly name = 'stateful';
  private enabled = true;
  private color = '#ff0000';

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public onRender(context: PluginContext): void {
    if (!this.enabled) return;
    if (context.phase !== RenderPhase.AfterRender) return;

    const { renderer, layout } = context;
    renderer.fillRect(layout.chartArea.x, layout.chartArea.y, 50, 50, this.color);
  }
}

// Usage
const plugin = new StatefulPlugin();
chart.installPlugin(plugin);

// Update plugin state
plugin.setColor('#00ff00');
plugin.setEnabled(false);
```

## Advanced Plugin Examples

### Volume Profile Plugin

```typescript
class VolumeProfilePlugin implements IPlugin {
  public readonly name = 'volume-profile';
  private chart: Chart | null = null;

  public onInstall(chart: unknown): void {
    this.chart = chart as Chart;
  }

  public onRender(context: PluginContext): void {
    if (context.phase !== RenderPhase.AfterCandles) return;
    if (!this.chart) return;

    const series = this.chart.getSeries()[0];
    if (!series) return;

    const viewport = this.chart.getViewport();
    const { renderer, layout } = context;
    const { chartArea } = layout;

    // Calculate volume profile
    const profile = this.calculateVolumeProfile(series, viewport);

    // Render profile
    this.renderProfile(renderer, chartArea, profile, viewport);
  }

  private calculateVolumeProfile(series: CandleSeries, viewport: Viewport) {
    const timeRange = viewport.getTimeRange();
    const candleView = series.rangeByTime(timeRange.start, timeRange.end);
    const priceRange = viewport.getPriceConfig();

    const numBins = 50;
    const binSize = (priceRange.max - priceRange.min) / numBins;
    const bins = new Array(numBins).fill(0);

    for (let i = 0; i < candleView.length; i++) {
      const volume = candleView.volume?.[i];
      const close = candleView.close[i];
      if (!volume || close === undefined) continue;

      const binIndex = Math.floor((close - priceRange.min) / binSize);
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex] += volume;
      }
    }

    return bins;
  }

  private renderProfile(
    renderer: IRenderer,
    chartArea: LayoutRect,
    profile: number[],
    viewport: Viewport,
  ) {
    const maxVolume = Math.max(...profile);
    const barWidth = chartArea.width * 0.3;
    const priceRange = viewport.getPriceConfig();
    const binSize = (priceRange.max - priceRange.min) / profile.length;

    renderer.save();
    renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    profile.forEach((volume, i) => {
      const price = priceRange.min + i * binSize;
      const y = viewport.yScale(price + binSize / 2);
      const width = (volume / maxVolume) * barWidth;

      renderer.fillRect(
        chartArea.x + chartArea.width - width,
        y - binSize / 2,
        width,
        binSize,
        'rgba(0, 100, 255, 0.3)',
      );
    });

    renderer.restore();
  }
}
```

## Plugin Best Practices

### 1. Use Appropriate Render Phases

```typescript
// Grid-like overlays → AfterGrid
// Indicator overlays → AfterCandles
// UI elements → AfterRender
```

### 2. Respect Clip Regions

```typescript
public onRender(context: PluginContext): void {
  const { renderer, layout } = context;
  const { chartArea } = layout;

  renderer.save();
  renderer.setClip(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

  // Your drawing code

  renderer.restore();  // Don't forget to restore!
}
```

### 3. Avoid Heavy Computations

```typescript
// ❌ Don't compute on every frame
public onRender(context: PluginContext): void {
  const heavyCalculation = this.calculateComplexIndicator();  // Bad!
  this.draw(context, heavyCalculation);
}

// ✅ Cache computations, only recalculate when data changes
private cachedData: any = null;

public onInstall(chart: Chart): void {
  chart.onChange(() => {
    this.cachedData = null;  // Invalidate cache
  });
}

public onRender(context: PluginContext): void {
  if (!this.cachedData) {
    this.cachedData = this.calculateComplexIndicator();
  }
  this.draw(context, this.cachedData);
}
```

### 4. Provide Configuration Options

```typescript
interface MyPluginConfig {
  color: string;
  lineWidth: number;
  enabled: boolean;
}

class MyPlugin implements IPlugin {
  constructor(private config: MyPluginConfig) {}

  public updateConfig(newConfig: Partial<MyPluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
```

## Plugin Management

```typescript
// Install plugin
chart.installPlugin(new MyPlugin());

// Uninstall plugin
chart.uninstallPlugin('my-plugin');

// Check installed plugins
const plugins = chart.getInstalledPlugins(); // Returns plugin names

// Conditional installation
if (!chart.getInstalledPlugins().includes('my-plugin')) {
  chart.installPlugin(new MyPlugin());
}
```

## Next Steps

- See [Examples](/examples) for complete plugin usage examples
- Check [API Reference](/api-reference) for detailed plugin API documentation
- Explore the [source code](https://github.com/tradewithmeai/graph-library/tree/main/packages/core/src/plugins-builtin) of built-in plugins
