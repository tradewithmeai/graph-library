# SolVX Graph Engine

⚡ High-performance charting library for financial and data visualization

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/@solvx/graph-engine.svg)](https://www.npmjs.com/package/@solvx/graph-engine)

## ✨ Features

- ⚡ **High Performance** - 60 FPS rendering with live data streaming at high frequencies
- 🔌 **Extensible Plugin System** - Built-in plugins for tooltips, indicators, and overlays
- 📊 **Live Data Streaming** - First-class support for real-time data with IDataSource interface
- 🎨 **Themeable** - Comprehensive theming system with dark/light modes
- ⚛️ **React Support** - Official React wrapper with proper lifecycle management
- 📦 **Tree-Shakeable** - ESM-first with zero side effects
- 🔧 **TypeScript Native** - Full type safety and IntelliSense support
- 🚀 **Lightweight** - ~101 kB minified bundle (~21 kB gzipped)

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @solvx/graph-engine
npm install @solvx/graph-engine-react  # Optional: for React

# pnpm
pnpm add @solvx/graph-engine
pnpm add @solvx/graph-engine-react  # Optional: for React

# yarn
yarn add @solvx/graph-engine
yarn add @solvx/graph-engine-react  # Optional: for React
```

### Basic Usage

**Vanilla JavaScript/TypeScript:**

```typescript
import { Chart, CandleSeries, CrosshairTooltipPlugin } from '@solvx/graph-engine';

// Create chart
const chart = new Chart({
  container: document.getElementById('chart')!,
  width: 800,
  height: 400,
});

// Add data
const candleData = [
  { ts: 1609459200000, open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
  { ts: 1609545600000, open: 103, high: 108, low: 102, close: 106, volume: 1200000 },
  // ... more candles
];

const series = new CandleSeries(candleData);
chart.addSeries(series);

// Add plugins
chart.installPlugin(new CrosshairTooltipPlugin());
```

**React:**

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';
import { CandleSeries, CrosshairTooltipPlugin } from '@solvx/graph-engine';

function App() {
  const handleChartReady = (chart) => {
    const series = new CandleSeries(candleData);
    chart.addSeries(series);
    chart.installPlugin(new CrosshairTooltipPlugin());
  };

  return <SolVXChart width={800} height={400} onChartReady={handleChartReady} />;
}
```

### Live Data Streaming

```typescript
import { Chart, CandleSeries, RandomWalkSource } from '@solvx/graph-engine';

const chart = new Chart({
  /* options */
});
const series = new CandleSeries();
chart.addSeries(series);

// Connect live data source
const liveSource = new RandomWalkSource({
  initialPrice: 100,
  interval: 250, // Update every 250ms
  candleDuration: 5000, // 5-second candles
});

chart.connectDataSource(series, liveSource);
```

## 📚 Documentation

**[Full Documentation →](https://tradewithmeai.github.io/graph-library/)**

- [Getting Started](https://tradewithmeai.github.io/graph-library/getting-started)
- [Architecture Overview](https://tradewithmeai.github.io/graph-library/architecture-overview)
- [Core Concepts](https://tradewithmeai.github.io/graph-library/core-concepts)
- [API Reference](https://tradewithmeai.github.io/graph-library/api-reference)
- [Plugins & Extensions](https://tradewithmeai.github.io/graph-library/plugins-and-extensions)
- [Examples](https://tradewithmeai.github.io/graph-library/examples)

## 🎯 Core Features

### Data Model

- **CandleSeries**: High-performance typed array storage
- **Live Updates**: Smart `updateOrAppend()` for streaming data
- **Binary Search**: O(log n) time-based queries
- **Memory Efficient**: Columnar storage with 1.5x growth factor

### Rendering System

- **Canvas 2D**: Hardware-accelerated rendering with HiDPI support
- **Render Phases**: BeforeRender, AfterGrid, AfterAxes, AfterCandles, AfterRender
- **rAF Coalescing**: Smooth 60 FPS with batched updates
- **Clipping**: Proper viewport clipping for all elements

### Interaction System

- **Pan**: Click-and-drag to pan
- **Zoom**: Pinch-to-zoom, double-click zoom
- **Scroll**: Mousewheel navigation
- **Crosshair**: Pointer tracking with candle snapping

### Plugin System

**Built-in Plugins:**

- `CrosshairTooltipPlugin` - OHLCV tooltip with smart positioning
- `MovingAveragePlugin` - Technical indicator overlays
- `ShapesOverlayPlugin` - Rectangles, lines, and bands

**Create Custom Plugins:**

```typescript
class MyPlugin implements IPlugin {
  name = 'my-plugin';

  onRender(context: PluginContext) {
    const { renderer, layout, phase } = context;
    // Custom rendering logic
  }
}

chart.installPlugin(new MyPlugin());
```

### Live Data Sources

- `RandomWalkSource` - Random walk generator (testing)
- `ArrayPlaybackSource` - Historical data replay (backtesting)
- Custom sources via `IDataSource` interface

## 📁 Project Structure

```
graph-library/
├── packages/
│   ├── core/              # @solvx/graph-engine
│   └── react/             # @solvx/graph-engine-react
├── examples/
│   ├── vanilla/           # Vanilla TypeScript example
│   ├── react-dashboard/   # React dashboard example
│   ├── basic-chart/       # Basic static chart
│   ├── live-streaming/    # Live data streaming
│   ├── timeframe-blending/# Two-timeframe blending
│   └── shapes-demo/       # Shapes overlay demo
├── docs/                  # VitePress documentation
└── scripts/               # Build and deploy scripts
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone repository
git clone https://github.com/tradewithmeai/graph-library.git
cd graph-library

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run examples
pnpm dev:vanilla        # Vanilla example
pnpm dev:react          # React example
pnpm dev:docs           # Documentation site
```

### Available Scripts

```bash
# Development
pnpm dev:vanilla        # Run vanilla example
pnpm dev:react          # Run React dashboard
pnpm dev:docs           # Run docs site

# Building
pnpm build              # Build all packages
pnpm build-docs         # Build documentation

# Testing & Quality
pnpm test               # Run tests (163 tests)
pnpm test:watch         # Run tests in watch mode
pnpm lint               # Lint code
pnpm format             # Format code
pnpm typecheck          # Type check

# Publishing
pnpm deploy-docs        # Deploy docs to GitHub Pages
```

## 📊 Project Status

**Phase 1-2: Foundation & Data Model** ✅ Complete

- [x] Monorepo structure with pnpm workspaces
- [x] Core package with TypeScript
- [x] React wrapper component
- [x] CandleSeries with typed arrays
- [x] Viewport coordinate transformations

**Phase 3: Rendering Engine** ✅ Complete

- [x] Canvas 2D renderer with HiDPI support
- [x] Layout manager
- [x] Candle renderer
- [x] Time and price axes
- [x] Grid rendering

**Phase 4: Interaction & Events** ✅ Complete

- [x] Event management system
- [x] Pan, zoom, scroll handlers
- [x] Crosshair with candle snapping
- [x] Touch support

**Phase 5: Plugin Architecture** ✅ Complete

- [x] Plugin system with lifecycle hooks
- [x] CrosshairTooltipPlugin
- [x] MovingAveragePlugin
- [x] ShapesOverlayPlugin
- [x] Dynamic install/uninstall

**Phase 6: Live Data System** ✅ Complete

- [x] IDataSource interface
- [x] RandomWalkSource
- [x] ArrayPlaybackSource
- [x] Chart data source integration
- [x] Live update support in CandleSeries

**Phase 7: Documentation & Examples** ✅ Complete

- [x] VitePress documentation site
- [x] Complete API reference
- [x] Usage examples
- [x] GitHub Pages deployment

## 🌐 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## 📄 License

MIT © 2025 SolVX

## 🔗 Links

- **[Documentation](https://tradewithmeai.github.io/graph-library/)**
- **[Examples](./examples)**
- **[GitHub Issues](https://github.com/tradewithmeai/graph-library/issues)**
- **[npm Package](https://www.npmjs.com/package/@solvx/graph-engine)**

---

**Built with ❤️ using TypeScript, Canvas 2D, and Vite**
