# Examples

Complete, runnable examples demonstrating various features of SolVX Graph Engine.

## Basic Static Chart

A simple candlestick chart with static data.

```typescript
import { Chart, CandleSeries } from '@solvx/graph-engine';
import type { Candle } from '@solvx/graph-engine';

// Generate sample data
function generateSampleData(): Candle[] {
  const data: Candle[] = [];
  const baseTime = Date.now() - 24 * 60 * 60 * 1000;
  const interval = 5 * 60 * 1000; // 5 minutes
  let price = 100;

  for (let i = 0; i < 100; i++) {
    const ts = baseTime + i * interval;
    const change = (Math.random() - 0.5) * 2;
    price += change;

    const open = price;
    const high = price + Math.random() * 2;
    const low = price - Math.random() * 2;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 1000000;

    data.push({ ts, open, high, low, close, volume });
    price = close;
  }

  return data;
}

// Create chart
const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
});

// Add data
const candleData = generateSampleData();
const series = new CandleSeries(candleData);
chart.addSeries(series);
```

[View full example →](https://github.com/tradewithmeai/graph-library/tree/main/examples/basic-chart)

---

## Live Data Streaming

Real-time chart with live data updates.

```typescript
import {
  Chart,
  CandleSeries,
  RandomWalkSource,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
} from '@solvx/graph-engine';

// Create chart
const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
});

// Create empty series
const series = new CandleSeries();
chart.addSeries(series);

// Add plugins
chart.installPlugin(new CrosshairTooltipPlugin());
chart.installPlugin(new MovingAveragePlugin({ period: 20, color: '#2196F3' }));

// Create and connect live data source
const liveSource = new RandomWalkSource({
  initialPrice: 100,
  volatility: 1.5,
  interval: 250, // Update every 250ms
  candleDuration: 5000, // 5-second candles
});

chart.connectDataSource(series, liveSource);

// Cleanup
window.addEventListener('beforeunload', () => {
  chart.disconnectDataSource(series);
  liveSource.stop();
});
```

[View full example →](https://github.com/tradewithmeai/graph-library/tree/main/examples/live-streaming)

---

## Two-Timeframe Blending

Display two series with opacity blending controlled by mousewheel.

```typescript
import { Chart, CandleSeries } from '@solvx/graph-engine';

const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
  interactions: {
    wheelMode: 'scroll', // Use wheel for opacity control
  },
});

// Add two series with different timeframes
const series1m = new CandleSeries(data1Minute);
const series5m = new CandleSeries(data5Minute);

chart.addSeries(series1m);
chart.addSeries(series5m);

// Control opacity with wheel
let opacity = 0.5; // 0 = series1m only, 1 = series5m only

chart.on('wheel', (event: ChartEvent) => {
  event.preventDefault();

  // Adjust opacity based on wheel delta
  opacity += event.deltaY > 0 ? 0.05 : -0.05;
  opacity = Math.max(0, Math.min(1, opacity));

  // Update series rendering opacity
  chart.setSeriesOpacity(0, 1 - opacity);
  chart.setSeriesOpacity(1, opacity);
});
```

[View full example →](https://github.com/tradewithmeai/graph-library/tree/main/examples/timeframe-blending)

---

## Shapes Overlay

Draw session rectangles and support/resistance zones.

```typescript
import { Chart, CandleSeries, ShapesOverlayPlugin } from '@solvx/graph-engine';

const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
});

const series = new CandleSeries(candleData);
chart.addSeries(series);

// Add shapes plugin
const shapesPlugin = new ShapesOverlayPlugin();
chart.installPlugin(shapesPlugin);

// Define trading sessions
const sessions = [
  { name: 'Asian', start: 0, end: 8, color: 'rgba(255, 193, 7, 0.1)' },
  { name: 'London', start: 8, end: 16, color: 'rgba(33, 150, 243, 0.1)' },
  { name: 'New York', start: 13, end: 21, color: 'rgba(76, 175, 80, 0.1)' },
];

// Add session rectangles for each day
const dayMs = 24 * 60 * 60 * 1000;
const startDay = Math.floor(Date.now() / dayMs) * dayMs;

for (let day = 0; day < 5; day++) {
  const dayStart = startDay + day * dayMs;

  sessions.forEach((session) => {
    const sessionStart = dayStart + session.start * 60 * 60 * 1000;
    const sessionEnd = dayStart + session.end * 60 * 60 * 1000;

    shapesPlugin.addRect(sessionStart, sessionEnd, 95, 105, {
      fillColor: session.color,
      strokeColor: 'transparent',
    });
  });
}

// Add support/resistance zones
shapesPlugin.addBand(98, 102, {
  fillColor: 'rgba(255, 0, 0, 0.1)',
  strokeColor: '#ff0000',
  lineWidth: 1,
});

shapesPlugin.addBand(105, 108, {
  fillColor: 'rgba(0, 255, 0, 0.1)',
  strokeColor: '#00ff00',
  lineWidth: 1,
});
```

[View full example →](https://github.com/tradewithmeai/graph-library/tree/main/examples/shapes-demo)

---

## React Dashboard

Complete React dashboard with live data and plugin controls.

```tsx
import { useState, useCallback } from 'react';
import { SolVXChart, type Chart } from '@solvx/graph-engine-react';
import {
  CandleSeries,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
  RandomWalkSource,
  type Candle,
} from '@solvx/graph-engine';

function Dashboard() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [series, setSeries] = useState<CandleSeries | null>(null);
  const [isLive, setIsLive] = useState(false);

  const handleChartReady = useCallback((chartInstance: Chart) => {
    setChart(chartInstance);

    const newSeries = new CandleSeries();
    chartInstance.addSeries(newSeries);
    setSeries(newSeries);

    // Install plugins
    chartInstance.installPlugin(new CrosshairTooltipPlugin());
    chartInstance.installPlugin(new MovingAveragePlugin({ period: 20, color: '#2196F3' }));
  }, []);

  const toggleLiveData = useCallback(() => {
    if (!chart || !series) return;

    if (isLive) {
      // Stop live data
      chart.disconnectDataSource(series);
      setIsLive(false);
    } else {
      // Start live data
      series.clear();
      const liveSource = new RandomWalkSource({
        initialPrice: 100,
        interval: 250,
        candleDuration: 5000,
      });
      chart.connectDataSource(series, liveSource);
      setIsLive(true);
    }
  }, [chart, series, isLive]);

  return (
    <div>
      <SolVXChart width={800} height={400} onChartReady={handleChartReady} />

      <button onClick={toggleLiveData}>{isLive ? 'Stop Live Data' : 'Start Live Data'}</button>
    </div>
  );
}
```

[View full example →](https://github.com/tradewithmeai/graph-library/tree/main/examples/react-dashboard)

---

## Custom Plugin

Create a custom plugin that displays the current price in the corner.

```typescript
import { IPlugin, PluginContext, RenderPhase } from '@solvx/graph-engine';
import type { Chart } from '@solvx/graph-engine';

class PriceDisplayPlugin implements IPlugin {
  public readonly name = 'price-display';
  private chart: Chart | null = null;

  public onInstall(chart: unknown): void {
    this.chart = chart as Chart;
  }

  public onRender(context: PluginContext): void {
    if (context.phase !== RenderPhase.AfterRender) return;
    if (!this.chart) return;

    const series = this.chart.getSeries()[0];
    if (!series) return;

    const lastCandle = series.getCandle(series.getLength() - 1);
    if (!lastCandle) return;

    const { renderer, layout } = context;
    const { chartArea } = layout;

    // Draw price box in top-right corner
    const text = `$${lastCandle.close.toFixed(2)}`;
    const padding = 10;
    const textWidth = renderer.measureText(text, '16px monospace');
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 30;

    const x = chartArea.x + chartArea.width - boxWidth - 10;
    const y = chartArea.y + 10;

    // Background
    renderer.fillRect(x, y, boxWidth, boxHeight, 'rgba(0, 0, 0, 0.8)');

    // Border
    renderer.strokeRect(x, y, boxWidth, boxHeight, '#666', 1);

    // Text
    renderer.drawText(
      text,
      x + padding,
      y + boxHeight / 2,
      lastCandle.close > lastCandle.open ? '#00ff00' : '#ff0000',
      '16px monospace',
      'left',
      'middle',
    );
  }
}

// Usage
chart.installPlugin(new PriceDisplayPlugin());
```

---

## Array Playback

Replay historical data at accelerated speed.

```typescript
import { Chart, CandleSeries, ArrayPlaybackSource } from '@solvx/graph-engine';

const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400
});

const series = new CandleSeries();
chart.addSeries(series);

// Load historical data
const historicalData: Candle[] = /* load from file/API */;

// Create playback source at 2x speed
const playback = new ArrayPlaybackSource({
  data: historicalData,
  speed: 2,
  loop: false
});

chart.connectDataSource(series, playback);

// Monitor progress
setInterval(() => {
  console.log('Progress:', (playback.getProgress() * 100).toFixed(1) + '%');

  if (playback.isComplete()) {
    console.log('Playback complete!');
  }
}, 1000);

// Control playback
document.getElementById('pause')?.addEventListener('click', () => {
  playback.stop();
});

document.getElementById('resume')?.addEventListener('click', () => {
  playback.start();
});

document.getElementById('reset')?.addEventListener('click', () => {
  playback.reset();
});

document.getElementById('speed-2x')?.addEventListener('click', () => {
  playback.setSpeed(2);
});

document.getElementById('speed-5x')?.addEventListener('click', () => {
  playback.setSpeed(5);
});
```

---

## Dark Theme

Apply a custom dark theme to the chart.

```typescript
import { Chart, defaultTheme } from '@solvx/graph-engine';
import type { Theme } from '@solvx/graph-engine';

const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#1a1a1a',
    grid: '#2a2a2a',
    text: '#e0e0e0',
    candleUp: '#26a69a',
    candleDown: '#ef5350',
    candleWickUp: '#26a69a',
    candleWickDown: '#ef5350',
    volumeUp: 'rgba(38, 166, 154, 0.3)',
    volumeDown: 'rgba(239, 83, 80, 0.3)',
    crosshair: '#666666',
  },
  typography: {
    ...defaultTheme.typography,
    fontFamily: 'Monaco, Consolas, monospace',
  },
};

const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
  theme: darkTheme,
});
```

---

## Running Examples Locally

All examples are available in the [examples directory](https://github.com/tradewithmeai/graph-library/tree/main/examples).

To run any example:

```bash
# Clone the repository
git clone https://github.com/tradewithmeai/graph-library.git
cd graph-library

# Install dependencies
pnpm install

# Build packages
pnpm run build

# Run an example (e.g., vanilla example)
cd examples/vanilla
pnpm run dev

# Or run the React dashboard
cd examples/react-dashboard
pnpm run dev
```

Each example is a standalone Vite project with its own `package.json` and dependencies.
