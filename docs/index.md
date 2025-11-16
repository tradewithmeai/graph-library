---
layout: home

hero:
  name: SolVX Graph Engine
  text: High-Performance Charting
  tagline: A modern, flexible charting library for financial and data visualization
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/solvx/graph-engine

features:
  - icon: ⚡
    title: High Performance
    details: Built with performance in mind, utilizing modern rendering techniques for smooth 60fps interactions even with large datasets.

  - icon: 🎨
    title: Fully Customizable
    details: Comprehensive theming system and plugin architecture allow you to customize every aspect of your charts.

  - icon: 📦
    title: Tree-Shakeable
    details: Zero side effects and ESM-first design ensure you only bundle what you use.

  - icon: 🔧
    title: TypeScript Native
    details: Written in TypeScript with full type definitions for an excellent developer experience.

  - icon: ⚛️
    title: Framework Agnostic
    details: Use with vanilla JavaScript, React, Vue, or any other framework. Official React bindings included.

  - icon: 📊
    title: Rich Chart Types
    details: Support for line, bar, candlestick, and custom chart types with a plugin system for extensions.
---

## Quick Start

Install the core library:

```bash
npm install @solvx/graph-engine
```

Or with React bindings:

```bash
npm install @solvx/graph-engine @solvx/graph-engine-react
```

## Usage

### Vanilla JavaScript

```typescript
import { Chart } from '@solvx/graph-engine';

const chart = new Chart({
  container: '#chart',
  width: 800,
  height: 600,
});
```

### React

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';

function App() {
  return (
    <SolVXChart
      width={800}
      height={600}
      onChartReady={(chart) => {
        console.log('Chart ready:', chart);
      }}
    />
  );
}
```

## Project Status

**Phase 1 - Foundation** (Current)

The foundational architecture is in place:

- Core package structure
- React wrapper package
- Example applications
- Documentation framework

Future phases will add:

- Rendering engine (Canvas/WebGL)
- Data management layer
- Interactive features
- Plugin system
- Advanced chart types

## License

MIT © 2024 SolVX
