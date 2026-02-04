import { Chart, CandleSeries } from '@solvx/graph-engine';
import type { Candle } from '@solvx/graph-engine';

/**
 * Generate sample candlestick data
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

  // Create chart
  const chart = new Chart({
    container,
    width: container.clientWidth,
    height: 500,
  });

  // Generate and add data
  const candleData = generateSampleData();
  const series = new CandleSeries(candleData);
  chart.addSeries(series);

  // Add spacing control
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = 'margin: 12px 0; font-family: sans-serif; font-size: 14px;';

  const label = document.createElement('label');
  label.textContent = 'Candle Spacing: ';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '80';
  slider.value = '20';
  slider.style.cssText = 'width: 300px; vertical-align: middle;';

  const valueLabel = document.createElement('span');
  valueLabel.textContent = ' 20% (default)';

  slider.addEventListener('input', () => {
    const pct = parseInt(slider.value);
    chart.setCandleStyle({ spacing: pct / 100 });
    valueLabel.textContent = pct === 0 ? ' 0% (no gap)' : ` ${pct}%`;
  });

  label.appendChild(slider);
  label.appendChild(valueLabel);
  controlsDiv.appendChild(label);
  container.parentElement?.insertBefore(controlsDiv, container.nextSibling);

  console.log('Chart initialized with', candleData.length, 'candles');
  console.log('Try the spacing slider to remove whitespace between candles');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
