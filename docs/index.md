---
layout: home

hero:
  name: SolVX Graph Engine
  text: High-Performance Charting Library
  tagline: Financial and data visualization built for speed, flexibility, and extensibility
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View Examples
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/tradewithmeai/graph-library

features:
  - icon: ⚡
    title: High Performance
    details: Built on typed arrays and Canvas 2D with HiDPI support. Smooth rendering at 60 FPS even with live data streaming at high frequencies.

  - icon: 🔌
    title: Extensible Plugin System
    details: Powerful plugin architecture with built-in plugins for crosshair tooltips, moving averages, and shape overlays. Create custom plugins with full access to rendering pipeline.

  - icon: 📊
    title: Live Data Streaming
    details: First-class support for real-time data with IDataSource interface. Includes RandomWalkSource for testing and ArrayPlaybackSource for backtesting.

  - icon: 🎨
    title: Themeable & Customizable
    details: Comprehensive theming system with dark/light modes. Customize colors, typography, spacing, and rendering styles.

  - icon: ⚛️
    title: React Support
    details: Official React wrapper component with proper lifecycle management and type safety. Seamlessly integrate charts into your React applications.

  - icon: 🛠️
    title: Developer-Friendly API
    details: Clean, intuitive API with full TypeScript support. Comprehensive documentation, examples, and inline JSDoc comments throughout.
---

## Quick Example

```typescript
import { Chart, CandleSeries, CrosshairTooltipPlugin } from '@solvx/graph-engine';

// Create chart
const chart = new Chart({
  container: document.getElementById('chart'),
  width: 800,
  height: 400,
});

// Add data
const series = new CandleSeries(candleData);
chart.addSeries(series);

// Add plugins
chart.installPlugin(new CrosshairTooltipPlugin());
```

## Features at a Glance

- **Phase 1-2**: Foundational chart structure with data model and coordinate scaling
- **Phase 3**: Complete rendering engine with candles, axes, and grid
- **Phase 4**: Full interaction support (pan, zoom, scroll, crosshair)
- **Phase 5**: Plugin architecture with built-in plugins
- **Phase 6**: Live data streaming with multiple data sources

## Why SolVX Graph Engine?

Built from the ground up for **performance** and **extensibility**, SolVX Graph Engine is designed to handle demanding financial and data visualization scenarios:

- **Typed Arrays**: Columnar data storage for memory efficiency
- **Canvas 2D**: Hardware-accelerated rendering with pixel-perfect clarity
- **Plugin System**: Extend functionality without modifying core
- **Live Data**: Built-in support for streaming data sources
- **Type Safety**: Full TypeScript support throughout

[Get Started →](/getting-started)
