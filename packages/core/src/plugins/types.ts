import type { IRenderer } from '../renderer/IRenderer';
import type { ChartLayout } from '../layout/LayoutManager';
import type { ChartEvent } from '../events/types';

/**
 * Plugin hook phases during rendering
 */
export enum RenderPhase {
  /**
   * Before any rendering
   */
  BeforeRender = 'before-render',

  /**
   * After grid is drawn
   */
  AfterGrid = 'after-grid',

  /**
   * After axes are drawn
   */
  AfterAxes = 'after-axes',

  /**
   * After candles are drawn
   */
  AfterCandles = 'after-candles',

  /**
   * After all rendering is complete
   */
  AfterRender = 'after-render',
}

/**
 * Context passed to plugin hooks
 */
export interface PluginContext {
  /**
   * Renderer instance
   */
  renderer: IRenderer;

  /**
   * Current layout
   */
  layout: ChartLayout;

  /**
   * Current render phase
   */
  phase: RenderPhase;

  /**
   * Chart instance (avoiding circular dependency, typed as any for now)
   */
  chart: unknown;
}

/**
 * Plugin hook function
 */
export type PluginHook = (context: PluginContext) => void;

/**
 * Plugin interface
 */
export interface IPlugin {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Hook called during rendering
   */
  onRender?: PluginHook;

  /**
   * Hook called when plugin is installed
   */
  onInstall?: (chart: unknown) => void;

  /**
   * Hook called when plugin is uninstalled
   */
  onUninstall?: (chart: unknown) => void;

  /**
   * Hook called when a chart event occurs (pointer, wheel, click, etc.)
   */
  onEvent?: (event: ChartEvent) => void;
}
