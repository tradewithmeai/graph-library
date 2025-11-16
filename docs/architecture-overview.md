# Architecture Overview

This document provides an overview of the SolVX Graph Engine architecture.

## Project Structure

SolVX Graph Engine is organized as a monorepo with multiple packages:

```
graph-library/
├── packages/
│   ├── core/              # @solvx/graph-engine
│   └── react/             # @solvx/graph-engine-react
├── examples/
│   ├── vanilla/           # Vanilla TypeScript example
│   └── react-dashboard/   # React dashboard example
├── docs/                  # Documentation site (VitePress)
└── scripts/               # Build and release scripts
```

## Core Package

The `@solvx/graph-engine` package contains the core charting engine.

### Key Components

**Chart Class**

The main entry point for creating chart instances. Handles:

- Container resolution
- Theme management
- Lifecycle management
- Configuration

**Theme System**

The theme system provides a comprehensive way to customize the visual appearance:

```typescript
interface Theme {
  colors: ColorConfig;
  typography: Typography;
  spacing: Spacing;
  borderRadius: number;
  strokeWidth: number;
}
```

The `defaultTheme` provides sensible defaults optimized for financial visualizations.

### Build Configuration

The core package uses:

- **Vite** for bundling (library mode)
- **Rollup** for producing ESM and CJS outputs
- **TypeScript** for type declarations
- **Tree-shaking** enabled via `"sideEffects": false`

Output formats:

- `dist/index.js` - ESM bundle
- `dist/index.cjs` - CommonJS bundle
- `dist/index.d.ts` - Type declarations

## React Package

The `@solvx/graph-engine-react` package provides React bindings.

### SolVXChart Component

A React component that wraps the core `Chart` class:

- Manages chart lifecycle (creation/destruction)
- Handles React-specific concerns (refs, effects)
- Provides props-based configuration
- Exposes `onChartReady` callback for accessing the chart instance

### Implementation Details

The component uses:

- `useRef` for managing the chart instance and container element
- `useEffect` for lifecycle management
- Proper cleanup on unmount

## Development Phases

### Phase 1: Foundation (Current)

**Goals:**

- Establish monorepo structure
- Create core package skeleton
- Create React wrapper
- Set up build tooling
- Create examples and documentation

**Status:** ✅ Complete

### Phase 2: Rendering Engine (Planned)

**Goals:**

- Implement Canvas renderer
- Add WebGL renderer for performance
- Create rendering pipeline
- Implement basic chart types

### Phase 3: Data Management (Planned)

**Goals:**

- Design data model
- Implement data transformation pipeline
- Add data streaming support
- Create data adapters

### Phase 4: Interactivity (Planned)

**Goals:**

- Mouse/touch event handling
- Zoom and pan
- Tooltips
- Crosshair
- Selection

### Phase 5: Plugin System (Planned)

**Goals:**

- Plugin architecture
- Plugin lifecycle
- Built-in plugins
- Third-party plugin support

## Technology Stack

### Build Tools

- **pnpm** - Package manager and workspace manager
- **Vite** - Build tool and dev server
- **TypeScript** - Type system and compiler
- **Rollup** - Final bundling (via Vite)

### Code Quality

- **ESLint** - Linting (typescript-eslint)
- **Prettier** - Code formatting
- **Vitest** - Testing framework
- **lint-staged** - Pre-commit hooks

### Documentation

- **VitePress** - Documentation site generator
- **TypeDoc** - API documentation (future)

## Design Principles

### Performance First

- Designed for 60fps rendering with large datasets
- Efficient data structures
- Minimal re-renders
- RequestAnimationFrame-based rendering

### Framework Agnostic Core

- Core library has no framework dependencies
- Framework-specific wrappers are separate packages
- Works with any framework or vanilla JavaScript

### Type Safety

- Written in TypeScript with strict mode
- Full type inference
- No `any` types in public API

### Tree-Shakeable

- ESM-first design
- No side effects
- Named exports only
- Modular architecture

### Developer Experience

- Clear, documented API
- Helpful error messages
- Comprehensive examples
- TypeScript auto-completion

## Testing Strategy

### Unit Tests

- Core logic and utilities
- Theme merging
- Configuration handling

### Integration Tests

- Chart lifecycle
- React component behavior
- Build outputs

### Visual Tests (Future)

- Rendering accuracy
- Cross-browser consistency
- Screenshot comparison

## Release Process

The project uses semantic versioning and automated releases:

1. Development on feature branches
2. Pull requests reviewed and tested
3. Changes merged to main
4. CI/CD runs tests and builds
5. Automated version bump and changelog
6. Published to npm registry

## Contributing

Contributions are welcome! Please read the contributing guide for details on:

- Code style
- Commit conventions
- Pull request process
- Development workflow
