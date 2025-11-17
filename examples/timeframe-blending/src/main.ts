import { Chart, CandleSeries } from '@solvx/graph-engine';
import type { Candle } from '@solvx/graph-engine';

/**
 * Generate sample data with specific interval
 */
function generateData(interval: number, count: number): Candle[] {
  const data: Candle[] = [];
  const baseTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  let price = 100;

  for (let i = 0; i < count; i++) {
    const ts = baseTime + i * interval;

    // Random walk
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
 * Initialize the chart with two timeframes
 */
function initChart(): void {
  const container = document.getElementById('chart');

  if (!container) {
    console.error('Chart container not found');
    return;
  }

  // Create chart with scroll mode for wheel
  const chart = new Chart({
    container,
    width: container.clientWidth,
    height: 500,
    interactions: {
      wheelMode: 'scroll', // Use scroll mode to prevent default zoom
    },
  });

  // Generate data for both timeframes
  const data1m = generateData(60 * 1000, 1440); // 1 minute candles, 24 hours
  const data5m = generateData(5 * 60 * 1000, 288); // 5 minute candles, 24 hours

  const series1m = new CandleSeries(data1m);
  const series5m = new CandleSeries(data5m);

  chart.addSeries(series1m);
  chart.addSeries(series5m);

  // Setup blending control
  setupBlendControl(chart, series1m, series5m);

  console.log('Chart initialized with two timeframes');
  console.log('1-minute series:', data1m.length, 'candles');
  console.log('5-minute series:', data5m.length, 'candles');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

/**
 * Setup blend control using custom rendering
 */
function setupBlendControl(chart: Chart, series1m: CandleSeries, series5m: CandleSeries): void {
  let blendValue = 0.5; // 0 = 1m only, 1 = 5m only

  const blendMarker = document.getElementById('blend-marker');
  const blendValueText = document.getElementById('blend-value');

  function updateBlendUI(): void {
    if (blendMarker) {
      blendMarker.style.left = `${blendValue * 100}%`;
    }
    if (blendValueText) {
      const percent1m = Math.round((1 - blendValue) * 100);
      const percent5m = Math.round(blendValue * 100);
      blendValueText.textContent = `${percent1m}% / ${percent5m}%`;
    }
  }

  function updateSeriesOpacity(): void {
    // Note: This is a simplified implementation
    // In a full implementation, we would modify the renderer's global alpha
    // or implement a custom plugin to control opacity per series
    // For this example, we'll show the concept even if the exact API differs

    const opacity1m = 1 - blendValue;
    const opacity5m = blendValue;

    console.log(`Blend updated: 1m=${opacity1m.toFixed(2)}, 5m=${opacity5m.toFixed(2)}`);

    // If Chart has setSeriesOpacity method, use it
    if (typeof (chart as any).setSeriesOpacity === 'function') {
      (chart as any).setSeriesOpacity(0, opacity1m);
      (chart as any).setSeriesOpacity(1, opacity5m);
    } else {
      // Alternative: Store opacity in series metadata
      // The renderer would need to respect this in a real implementation
      (series1m as any)._opacity = opacity1m;
      (series5m as any)._opacity = opacity5m;
    }

    chart.scheduleRender();
  }

  // Handle wheel events
  const chartContainer = chart.getContainer();
  if (chartContainer) {
    chartContainer.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      // Adjust blend based on wheel delta
      const delta = e.deltaY > 0 ? 0.05 : -0.05;
      blendValue = Math.max(0, Math.min(1, blendValue + delta));

      updateBlendUI();
      updateSeriesOpacity();
    });
  }

  // Initialize UI
  updateBlendUI();
  updateSeriesOpacity();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
