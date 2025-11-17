import {
  Chart,
  CandleSeries,
  RandomWalkSource,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
} from '@solvx/graph-engine';

/**
 * Initialize the chart with live data
 */
function initChart(): void {
  const container = document.getElementById('chart');

  if (!container) {
    console.error('Chart container not found');
    return;
  }

  // Create chart
  const chart = new Chart({
    container,
    width: container.clientWidth,
    height: 500,
  });

  // Create empty series
  const series = new CandleSeries();
  chart.addSeries(series);

  // Install plugins
  chart.installPlugin(new CrosshairTooltipPlugin());
  chart.installPlugin(new MovingAveragePlugin({ period: 20, color: '#2196F3' }));

  // Create live data source
  const liveSource = new RandomWalkSource({
    initialPrice: 100,
    volatility: 1.5,
    interval: 250, // Update every 250ms
    candleDuration: 5000, // 5-second candles
  });

  // Connect data source
  chart.connectDataSource(series, liveSource);

  // Setup controls
  setupControls(chart, series, liveSource);

  console.log('Live data streaming started');
  console.log('Updates: 250ms interval, 5-second candles');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

/**
 * Setup live data controls
 */
function setupControls(chart: Chart, series: CandleSeries, liveSource: RandomWalkSource): void {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');

  if (!startBtn || !stopBtn) {
    console.error('Control buttons not found');
    return;
  }

  let isLive = true;

  startBtn.addEventListener('click', () => {
    if (!isLive) {
      chart.connectDataSource(series, liveSource);
      isLive = true;
      startBtn.classList.add('active');
      stopBtn.classList.remove('active');
      console.log('Live data resumed');
    }
  });

  stopBtn.addEventListener('click', () => {
    if (isLive) {
      chart.disconnectDataSource(series);
      liveSource.stop();
      isLive = false;
      stopBtn.classList.add('active');
      startBtn.classList.remove('active');
      console.log('Live data stopped');
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    chart.disconnectDataSource(series);
    liveSource.stop();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
