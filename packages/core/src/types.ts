import type { InteractionOptions } from './events/types';

/**
 * Chart configuration options
 */
export interface ChartOptions {
  /**
   * The container element or selector where the chart will be rendered
   */
  container: HTMLElement | string;

  /**
   * Chart width in pixels
   */
  width?: number;

  /**
   * Chart height in pixels
   */
  height?: number;

  /**
   * Theme configuration
   */
  theme?: Partial<Theme>;

  /**
   * Initial data for the chart
   */
  data?: unknown;

  /**
   * Interaction configuration
   */
  interaction?: InteractionOptions;
}

/**
 * Color configuration for chart elements
 */
export interface ColorConfig {
  background: string;
  foreground: string;
  grid: string;
  axis: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Typography configuration
 */
export interface Typography {
  fontFamily: string;
  fontSize: {
    small: number;
    medium: number;
    large: number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
  };
}

/**
 * Spacing configuration
 */
export interface Spacing {
  padding: {
    small: number;
    medium: number;
    large: number;
  };
  margin: {
    small: number;
    medium: number;
    large: number;
  };
}

/**
 * Theme configuration for the chart
 */
export interface Theme {
  colors: ColorConfig;
  typography: Typography;
  spacing: Spacing;
  borderRadius: number;
  strokeWidth: number;
}
