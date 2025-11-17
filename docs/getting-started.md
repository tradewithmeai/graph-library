# Getting Started

This guide will help you get started with SolVX Graph Engine in just a few minutes.

## Installation

Install the core package and React wrapper (if needed) via npm or pnpm:

::: code-group

```bash [npm]
npm install @solvx/graph-engine
npm install @solvx/graph-engine-react  # Optional: for React projects
```

```bash [pnpm]
pnpm add @solvx/graph-engine
pnpm add @solvx/graph-engine-react  # Optional: for React projects
```

```bash [yarn]
yarn add @solvx/graph-engine
yarn add @solvx/graph-engine-react  # Optional: for React projects
```

:::

## Basic Usage

### Vanilla JavaScript/TypeScript

Create a simple candlestick chart:

```typescript
import { Chart, CandleSeries } from '@solvx/graph-engine';
import type { Candle } from '@solvx/graph-engine';

// Sample data
const candleData: Candle[] = [
  { ts: 1609459200000, open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
  { ts: 1609545600000, open: 103, high: 108, low: 102, close: 106, volume: 1200000 },
  // ... more candles
];

// Create chart
const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
});

// Add data series
const series = new CandleSeries(candleData);
chart.addSeries(series);
```

### React

Use the React wrapper component:

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';
import { CandleSeries, type Candle } from '@solvx/graph-engine';
import { useState, useCallback } from 'react';

function App() {
  const [chart, setChart] = useState(null);

  const handleChartReady = useCallback((chartInstance) => {
    setChart(chartInstance);

    const candleData: Candle[] = [
      /* your data */
    ];
    const series = new CandleSeries(candleData);
    chartInstance.addSeries(series);
  }, []);

  return <SolVXChart width={800} height={400} onChartReady={handleChartReady} />;
}
```

## Adding Plugins

Enhance your chart with built-in plugins:

```typescript
import {
  Chart,
  CandleSeries,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
  ShapesOverlayPlugin,
} from '@solvx/graph-engine';

const chart = new Chart({
  /* options */
});
const series = new CandleSeries(candleData);
chart.addSeries(series);

// Add crosshair tooltip
chart.installPlugin(new CrosshairTooltipPlugin());

// Add moving averages
chart.installPlugin(new MovingAveragePlugin({ period: 20, color: '#2196F3' }, 'ma-20'));
chart.installPlugin(new MovingAveragePlugin({ period: 50, color: '#FF9800' }, 'ma-50'));

// Add shapes overlay
const shapesPlugin = new ShapesOverlayPlugin();
chart.installPlugin(shapesPlugin);

// Add a support/resistance zone
shapesPlugin.addBand(95, 105, {
  fillColor: 'rgba(76, 175, 80, 0.1)',
  strokeColor: '#4CAF50',
});
```

## Live Data Streaming

Connect a live data source for real-time updates:

```typescript
import { Chart, CandleSeries, RandomWalkSource } from '@solvx/graph-engine';

const chart = new Chart({
  /* options */
});
const series = new CandleSeries();
chart.addSeries(series);

// Create and connect a random walk data source
const dataSource = new RandomWalkSource({
  initialPrice: 100,
  volatility: 1.5,
  interval: 250, // Update every 250ms
  candleDuration: 5000, // 5-second candles
});

chart.connectDataSource(series, dataSource);
```

## Customizing Theme

Customize the chart appearance with themes:

```typescript
import { Chart, defaultTheme } from '@solvx/graph-engine';
import type { Theme } from '@solvx/graph-engine';

const customTheme: Theme = {
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

const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
  theme: customTheme,
});
```

## Next Steps

- Explore the [Architecture Overview](/architecture-overview) to understand how the library works
- Learn about [Core Concepts](/core-concepts) like data models, rendering, and interactions
- Check out [Examples](/examples) for complete, runnable code samples
- Dive into the [API Reference](/api-reference) for detailed documentation
