# Getting Started

Welcome to SolVX Graph Engine! This guide will help you get up and running quickly.

## Installation

SolVX Graph Engine is distributed as two main packages:

- `@solvx/graph-engine` - Core charting engine
- `@solvx/graph-engine-react` - React bindings

### Using npm

```bash
npm install @solvx/graph-engine
```

With React:

```bash
npm install @solvx/graph-engine @solvx/graph-engine-react
```

### Using pnpm

```bash
pnpm add @solvx/graph-engine
```

With React:

```bash
pnpm add @solvx/graph-engine @solvx/graph-engine-react
```

### Using yarn

```bash
yarn add @solvx/graph-engine
```

With React:

```bash
yarn add @solvx/graph-engine @solvx/graph-engine-react
```

## Basic Usage

### Vanilla JavaScript/TypeScript

```typescript
import { Chart } from '@solvx/graph-engine';

// Create a chart instance
const chart = new Chart({
  container: '#chart', // CSS selector or HTMLElement
  width: 800,
  height: 600,
});

// Access chart methods
console.log(chart.getTheme());
console.log(chart.getContainer());
```

### React

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';
import type { Chart } from '@solvx/graph-engine';

function MyComponent() {
  const handleChartReady = (chart: Chart) => {
    console.log('Chart initialized:', chart);
  };

  return <SolVXChart width={800} height={600} onChartReady={handleChartReady} />;
}
```

## Configuration

### Chart Options

The `Chart` constructor accepts a configuration object:

```typescript
interface ChartOptions {
  container: HTMLElement | string; // Required
  width?: number; // Optional
  height?: number; // Optional
  theme?: Partial<Theme>; // Optional
  data?: unknown; // Optional
}
```

### Theming

SolVX comes with a default theme, but you can customize it:

```typescript
import { Chart, defaultTheme } from '@solvx/graph-engine';

const chart = new Chart({
  container: '#chart',
  theme: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: '#ff6b6b',
      background: '#1a1a1a',
    },
  },
});
```

## Examples

Check out the example applications in the repository:

- **Vanilla Example**: Basic TypeScript usage
- **React Dashboard**: Full-featured React application

Run the examples locally:

```bash
# Clone the repository
git clone https://github.com/solvx/graph-engine.git
cd graph-engine

# Install dependencies
pnpm install

# Run vanilla example
pnpm dev:vanilla

# Run React example
pnpm dev:react
```

## Next Steps

- Read the [Architecture Overview](/architecture-overview) to understand the library structure
- Explore the example applications
- Join our community on GitHub

## Browser Support

SolVX Graph Engine supports all modern evergreen browsers:

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## TypeScript Support

SolVX is written in TypeScript and provides full type definitions out of the box. No additional `@types` packages are needed.

```typescript
import type { ChartOptions, Theme } from '@solvx/graph-engine';
```
