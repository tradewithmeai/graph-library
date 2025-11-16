import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@solvx/graph-engine': resolve(__dirname, '../../packages/core/src'),
      '@solvx/graph-engine-react': resolve(__dirname, '../../packages/react/src'),
    },
  },
  server: {
    port: 3001,
  },
});
