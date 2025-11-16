import { Chart, CandleSeries, defaultTheme } from '@solvx/graph-engine';
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

  console.log('Chart initialized with', candleData.length, 'candles');
  console.log('Chart theme:', chart.getTheme());

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
