import type { IPlugin, PluginContext } from './types';
import type { ChartEvent } from '../events/types';

/**
 * PluginManager handles plugin lifecycle and hook execution
 */
export class PluginManager {
  private plugins: Map<string, IPlugin>;
  private chart: unknown;

  /**
   * Create a new PluginManager
   *
   * @param chart - Chart instance
   */
  constructor(chart: unknown) {
    this.plugins = new Map();
    this.chart = chart;
  }

  /**
   * Install a plugin
   *
   * @param plugin - Plugin to install
   */
  public install(plugin: IPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already installed`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // Call plugin install hook
    plugin.onInstall?.(this.chart);
  }

  /**
   * Uninstall a plugin
   *
   * @param name - Plugin name
   */
  public uninstall(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin "${name}" is not installed`);
      return;
    }

    // Call plugin uninstall hook
    plugin.onUninstall?.(this.chart);

    this.plugins.delete(name);
  }

  /**
   * Execute plugin hooks for a specific render phase
   *
   * @param context - Plugin context
   */
  public executeHooks(context: PluginContext): void {
    for (const plugin of this.plugins.values()) {
      plugin.onRender?.(context);
    }
  }

  /**
   * Dispatch a chart event to all plugins that have an onEvent hook
   */
  public dispatchEvent(event: ChartEvent): void {
    for (const plugin of this.plugins.values()) {
      plugin.onEvent?.(event);
    }
  }

  /**
   * Get all installed plugins
   */
  public getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is installed
   *
   * @param name - Plugin name
   */
  public hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get a plugin by name
   *
   * @param name - Plugin name
   */
  public getPlugin(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }
}
