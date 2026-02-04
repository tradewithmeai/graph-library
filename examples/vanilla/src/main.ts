import {
  Chart,
  CandleSeries,
  defaultTheme,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
  ShapesOverlayPlugin,
  RandomWalkSource,
  ArrayPlaybackSource,
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
  const firstCandle = candleData[0];
  const lastCandle = candleData[candleData.length - 1];
  if (!firstCandle || !lastCandle) return;
  const minTime = firstCandle.ts;
  const maxTime = lastCandle.ts;
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
  setupPluginControls(chart, {
    tooltip: tooltipPlugin,
    ma20: ma20Plugin,
    ma50: ma50Plugin,
    shapes: shapesPlugin,
  });

  // Setup live data controls
  setupLiveDataControls(chart, series, candleData);

  console.log('Chart initialized with', candleData.length, 'candles');
  console.log('Plugins installed: tooltip, MA(20), MA(50), shapes');
  console.log('Live data controls available');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

/**
 * Setup plugin controls
 */
function setupPluginControls(
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

/**
 * Setup live data controls
 */
function setupLiveDataControls(chart: Chart, series: CandleSeries, staticData: Candle[]): void {
  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-family: sans-serif;
    font-size: 14px;
    min-width: 200px;
  `;

  const title = document.createElement('div');
  title.textContent = 'Live Data (Phase 6)';
  title.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
  controlsContainer.appendChild(title);

  // Status display
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'margin-bottom: 8px; font-size: 12px; color: #666;';
  statusDiv.textContent = 'Status: Static';
  controlsContainer.appendChild(statusDiv);

  // Data source buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

  // Static data button
  const staticBtn = document.createElement('button');
  staticBtn.textContent = 'Static Data';
  staticBtn.style.cssText = `
    padding: 6px 12px;
    cursor: pointer;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 3px;
  `;
  staticBtn.disabled = true;

  // Random walk button
  const randomWalkBtn = document.createElement('button');
  randomWalkBtn.textContent = 'Random Walk (250ms)';
  randomWalkBtn.style.cssText = `
    padding: 6px 12px;
    cursor: pointer;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 3px;
  `;

  // Array playback button
  const playbackBtn = document.createElement('button');
  playbackBtn.textContent = 'Playback (2x speed)';
  playbackBtn.style.cssText = `
    padding: 6px 12px;
    cursor: pointer;
    background: #FF9800;
    color: white;
    border: none;
    border-radius: 3px;
  `;

  let currentSource: 'static' | 'randomwalk' | 'playback' = 'static';

  // Random walk source instance
  let randomWalkSource: RandomWalkSource | null = null;
  let arrayPlaybackSource: ArrayPlaybackSource | null = null;

  function updateButtonStates(): void {
    staticBtn.disabled = currentSource === 'static';
    randomWalkBtn.disabled = currentSource === 'randomwalk';
    playbackBtn.disabled = currentSource === 'playback';

    staticBtn.style.opacity = currentSource === 'static' ? '0.5' : '1';
    randomWalkBtn.style.opacity = currentSource === 'randomwalk' ? '0.5' : '1';
    playbackBtn.style.opacity = currentSource === 'playback' ? '0.5' : '1';
  }

  staticBtn.addEventListener('click', () => {
    // Disconnect any active data source
    chart.disconnectDataSource(series);
    if (randomWalkSource) {
      randomWalkSource.stop();
      randomWalkSource = null;
    }
    if (arrayPlaybackSource) {
      arrayPlaybackSource.stop();
      arrayPlaybackSource = null;
    }

    // Reset to static data
    series.setData(staticData);
    chart.resetViewport();

    currentSource = 'static';
    statusDiv.textContent = 'Status: Static (' + staticData.length + ' candles)';
    updateButtonStates();
  });

  randomWalkBtn.addEventListener('click', () => {
    // Disconnect any active data source
    chart.disconnectDataSource(series);
    if (arrayPlaybackSource) {
      arrayPlaybackSource.stop();
      arrayPlaybackSource = null;
    }

    // Clear series and reset viewport for fresh data
    series.clear();
    chart.resetViewport();

    // Create and connect random walk source
    randomWalkSource = new RandomWalkSource({
      initialPrice: 100,
      volatility: 1.5,
      interval: 250, // 250ms updates
      candleDuration: 5000, // 5 second candles
      baseVolume: 100000,
    });

    chart.connectDataSource(series, randomWalkSource);

    currentSource = 'randomwalk';
    statusDiv.textContent = 'Status: Live Random Walk (250ms interval)';
    updateButtonStates();
  });

  playbackBtn.addEventListener('click', () => {
    // Disconnect any active data source
    chart.disconnectDataSource(series);
    if (randomWalkSource) {
      randomWalkSource.stop();
      randomWalkSource = null;
    }

    // Clear series and reset viewport for playback
    series.clear();
    chart.resetViewport();

    // Create and connect array playback source
    arrayPlaybackSource = new ArrayPlaybackSource({
      data: staticData,
      speed: 2, // 2x speed
      loop: false,
    });

    chart.connectDataSource(series, arrayPlaybackSource);

    currentSource = 'playback';
    statusDiv.textContent = 'Status: Playback (2x speed)';
    updateButtonStates();
  });

  buttonContainer.appendChild(staticBtn);
  buttonContainer.appendChild(randomWalkBtn);
  buttonContainer.appendChild(playbackBtn);
  controlsContainer.appendChild(buttonContainer);

  updateButtonStates();

  const chartContainer = chart.getContainer();
  if (chartContainer) {
    chartContainer.appendChild(controlsContainer);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
