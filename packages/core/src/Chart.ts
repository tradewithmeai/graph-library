import type { ChartOptions, Theme } from './types';
import { defaultTheme } from './theme';

/**
 * Main Chart class for SolVX Graph Engine
 *
 * This is a skeleton implementation that will be expanded in future phases
 * to include rendering logic, data management, and plugin support.
 */
export class Chart {
  private options: ChartOptions;
  private theme: Theme;
  private container: HTMLElement | null = null;

  /**
   * Creates a new Chart instance
   *
   * @param options - Chart configuration options
   */
  constructor(options: ChartOptions) {
    this.options = options;
    this.theme = this.mergeTheme(options.theme);
    this.resolveContainer();
  }

  /**
   * Resolves the container element from options
   */
  private resolveContainer(): void {
    if (typeof this.options.container === 'string') {
      const element = document.querySelector(this.options.container);
      if (!element) {
        throw new Error(`Container element not found: ${this.options.container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = this.options.container;
    }
  }

  /**
   * Merges partial theme with default theme
   */
  private mergeTheme(partialTheme?: Partial<Theme>): Theme {
    if (!partialTheme) {
      return defaultTheme;
    }

    return {
      ...defaultTheme,
      ...partialTheme,
      colors: {
        ...defaultTheme.colors,
        ...partialTheme.colors,
      },
      typography: {
        ...defaultTheme.typography,
        ...partialTheme.typography,
        fontSize: {
          ...defaultTheme.typography.fontSize,
          ...partialTheme.typography?.fontSize,
        },
        fontWeight: {
          ...defaultTheme.typography.fontWeight,
          ...partialTheme.typography?.fontWeight,
        },
      },
      spacing: {
        ...defaultTheme.spacing,
        ...partialTheme.spacing,
        padding: {
          ...defaultTheme.spacing.padding,
          ...partialTheme.spacing?.padding,
        },
        margin: {
          ...defaultTheme.spacing.margin,
          ...partialTheme.spacing?.margin,
        },
      },
    };
  }

  /**
   * Gets the current theme
   */
  public getTheme(): Theme {
    return this.theme;
  }

  /**
   * Gets the container element
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Gets the current options
   */
  public getOptions(): ChartOptions {
    return this.options;
  }

  /**
   * Destroys the chart and cleans up resources
   */
  public destroy(): void {
    // Cleanup will be implemented in future phases
    this.container = null;
  }
}
