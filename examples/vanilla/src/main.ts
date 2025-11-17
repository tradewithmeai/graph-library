import {
  Chart,
  CandleSeries,
  defaultTheme,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
  ShapesOverlayPlugin,
} from '@solvx/graph-engine';
import type { ChartOptions, Candle } from '@solvx/graph-engine';

/**
 * Generate sample OHLC data
 */
function generateSampleData(): Candle[] {
  const data: Candle[] = [];
  const baseTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  const interval = 5 * 60 * 1000; // 5 minutes
  let price = 100;

  for (let i = 0; i < 100; i++) {
    const ts = baseTime + i * interval;

    // Random walk with some volatility
    const change = (Math.random() - 0.5) * 2;
    price += change;

    const open = price;
    const high = price + Math.random() * 2;
    const low = price - Math.random() * 2;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 1000000;

    data.push({
      ts,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return data;
}

/**
 * Initialize the chart
 */
function initChart(): void {
  const container = document.getElementById('chart');

  if (!container) {
    console.error('Chart container not found');
    return;
  }

  // Create chart options
  const options: ChartOptions = {
    container,
    width: container.clientWidth,
    height: 500,
    theme: defaultTheme,
  };

  // Create chart instance
  const chart = new Chart(options);

  // Generate and add data
  const candleData = generateSampleData();
  const series = new CandleSeries(candleData);
  chart.addSeries(series);

  // Create plugin instances
  const tooltipPlugin = new CrosshairTooltipPlugin();
  const ma20Plugin = new MovingAveragePlugin({ period: 20, color: '#2196F3' }, 'ma-20');
  const ma50Plugin = new MovingAveragePlugin({ period: 50, color: '#FF9800' }, 'ma-50');
  const shapesPlugin = new ShapesOverlayPlugin();

  // Install plugins
  chart.installPlugin(tooltipPlugin);
  chart.installPlugin(ma20Plugin);
  chart.installPlugin(ma50Plugin);
  chart.installPlugin(shapesPlugin);

  // Add some example shapes
  const minTime = candleData[0].ts;
  const maxTime = candleData[candleData.length - 1].ts;
  const midTime = (minTime + maxTime) / 2;

  // Add a support/resistance zone
  shapesPlugin.addBand(95, 105, {
    fillColor: 'rgba(76, 175, 80, 0.1)',
    strokeColor: '#4CAF50',
  });

  // Add a time range highlight
  shapesPlugin.addRect(midTime - 3600000, midTime + 3600000, 90, 110, {
    fillColor: 'rgba(255, 152, 0, 0.05)',
    strokeColor: '#FF9800',
    lineWidth: 2,
  });

  // Setup plugin controls
  setupControls(chart, {
    tooltip: tooltipPlugin,
    ma20: ma20Plugin,
    ma50: ma50Plugin,
    shapes: shapesPlugin,
  });

  console.log('Chart initialized with', candleData.length, 'candles');
  console.log('Plugins installed: tooltip, MA(20), MA(50), shapes');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

/**
 * Setup plugin controls
 */
function setupControls(
  chart: Chart,
  plugins: {
    tooltip: CrosshairTooltipPlugin;
    ma20: MovingAveragePlugin;
    ma50: MovingAveragePlugin;
    shapes: ShapesOverlayPlugin;
  },
): void {
  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-family: sans-serif;
    font-size: 14px;
  `;

  const title = document.createElement('div');
  title.textContent = 'Plugins';
  title.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
  controlsContainer.appendChild(title);

  // Create checkboxes for each plugin
  const pluginConfigs = [
    { name: 'Tooltip', plugin: plugins.tooltip, id: 'tooltip' },
    { name: 'MA(20)', plugin: plugins.ma20, id: 'ma-20' },
    { name: 'MA(50)', plugin: plugins.ma50, id: 'ma-50' },
    { name: 'Shapes', plugin: plugins.shapes, id: 'shapes-overlay' },
  ];

  pluginConfigs.forEach((config) => {
    const label = document.createElement('label');
    label.style.cssText = 'display: block; margin-bottom: 4px; cursor: pointer;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.style.marginRight = '6px';

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        chart.installPlugin(config.plugin);
      } else {
        chart.uninstallPlugin(config.id);
      }
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(config.name));
    controlsContainer.appendChild(label);
  });

  const chartContainer = chart.getContainer();
  if (chartContainer) {
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(controlsContainer);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
