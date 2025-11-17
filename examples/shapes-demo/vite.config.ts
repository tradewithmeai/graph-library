import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@solvx/graph-engine': resolve(__dirname, '../../packages/core/src'),
    },
  },
  server: {
    port: 3004,
  },
});
