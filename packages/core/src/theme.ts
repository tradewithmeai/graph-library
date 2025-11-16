import type { Theme } from './types';

/**
 * Default theme configuration for SolVX Graph Engine
 *
 * This theme provides a clean, modern appearance optimized for
 * financial and data visualization use cases.
 */
export const defaultTheme: Theme = {
  colors: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    grid: '#e5e5e5',
    axis: '#666666',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      small: 10,
      medium: 12,
      large: 14,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    padding: {
      small: 4,
      medium: 8,
      large: 16,
    },
    margin: {
      small: 4,
      medium: 8,
      large: 16,
    },
  },
  borderRadius: 4,
  strokeWidth: 1,
};
