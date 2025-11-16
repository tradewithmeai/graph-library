# SolVX Graph Engine

A high-performance charting library for financial and data visualization.

[![CI](https://github.com/solvx/graph-engine/workflows/CI/badge.svg)](https://github.com/solvx/graph-engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡ **High Performance** - Built for smooth 60fps interactions with large datasets
- 🎨 **Fully Customizable** - Comprehensive theming and plugin system
- 📦 **Tree-Shakeable** - ESM-first with zero side effects
- 🔧 **TypeScript Native** - Full type safety and IntelliSense support
- ⚛️ **Framework Agnostic** - Works with any framework or vanilla JS
- 📊 **Rich Chart Types** - Extensible plugin architecture

## Quick Start

### Installation

```bash
npm install @solvx/graph-engine
```

With React:

```bash
npm install @solvx/graph-engine @solvx/graph-engine-react
```

### Usage

**Vanilla JavaScript:**

```typescript
import { Chart } from '@solvx/graph-engine';

const chart = new Chart({
  container: '#chart',
  width: 800,
  height: 600,
});
```

**React:**

```tsx
import { SolVXChart } from '@solvx/graph-engine-react';

function App() {
  return <SolVXChart width={800} height={600} />;
}
```

## Project Structure

This is a monorepo containing:

- **packages/core** - Core charting engine (`@solvx/graph-engine`)
- **packages/react** - React bindings (`@solvx/graph-engine-react`)
- **examples/vanilla** - Vanilla TypeScript example
- **examples/react-dashboard** - React dashboard example
- **docs** - VitePress documentation site

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/solvx/graph-engine.git
cd graph-engine

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Available Scripts

```bash
# Development
pnpm dev:vanilla        # Run vanilla example
pnpm dev:react          # Run React example
pnpm dev:docs           # Run documentation site

# Building
pnpm build              # Build all packages
pnpm build:docs         # Build documentation

# Testing & Quality
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm lint               # Lint code
pnpm format             # Format code
pnpm format:check       # Check formatting
pnpm typecheck          # Type check all packages

# Cleanup
pnpm clean              # Clean all build artifacts
```

## Project Status

**Phase 1: Foundation** ✅ Complete

- [x] Monorepo structure
- [x] Core package skeleton
- [x] React wrapper
- [x] Build tooling
- [x] Examples
- [x] Documentation framework

**Phase 2: Rendering Engine** (Planned)

- [ ] Canvas renderer
- [ ] WebGL renderer
- [ ] Basic chart types

**Phase 3: Data Management** (Planned)

- [ ] Data model
- [ ] Data transformations
- [ ] Streaming support

**Phase 4: Interactivity** (Planned)

- [ ] Event handling
- [ ] Zoom & pan
- [ ] Tooltips
- [ ] Crosshair

**Phase 5: Plugin System** (Planned)

- [ ] Plugin architecture
- [ ] Built-in plugins
- [ ] Plugin marketplace

## Documentation

Full documentation is available at [https://solvx.github.io/graph-engine](https://solvx.github.io/graph-engine)

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © 2024 SolVX

## Links

- [Documentation](https://solvx.github.io/graph-engine)
- [Examples](./examples)
- [Changelog](./CHANGELOG.md)
- [Issues](https://github.com/solvx/graph-engine/issues)
