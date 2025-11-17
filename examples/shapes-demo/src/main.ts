import { Chart, CandleSeries, ShapesOverlayPlugin } from '@solvx/graph-engine';
import type { Candle } from '@solvx/graph-engine';

/**
 * Generate sample candlestick data
 */
function generateSampleData(): Candle[] {
  const data: Candle[] = [];
  const baseTime = Date.now() - 5 * 24 * 60 * 60 * 1000; // 5 days ago
  const interval = 5 * 60 * 1000; // 5 minutes
  let price = 100;

  for (let i = 0; i < 1440; i++) {
    // 5 days of 5-min candles
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
 * Initialize the chart with shapes overlay
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

  // Add shapes plugin
  const shapesPlugin = new ShapesOverlayPlugin();
  chart.installPlugin(shapesPlugin);

  // Add session rectangles and support/resistance zones
  addTradingSessions(shapesPlugin, candleData);
  addSupportResistanceZones(shapesPlugin);

  console.log('Chart initialized with', candleData.length, 'candles');
  console.log('Shapes plugin installed with trading sessions and S/R zones');

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

/**
 * Add trading session rectangles
 */
function addTradingSessions(shapesPlugin: ShapesOverlayPlugin, candleData: Candle[]): void {
  const sessions = [
    { name: 'Asian', start: 0, end: 8, color: 'rgba(255, 193, 7, 0.1)', border: '#FFC107' },
    {
      name: 'London',
      start: 8,
      end: 16,
      color: 'rgba(33, 150, 243, 0.1)',
      border: '#2196F3',
    },
    {
      name: 'New York',
      start: 13,
      end: 21,
      color: 'rgba(76, 175, 80, 0.1)',
      border: '#4CAF50',
    },
  ];

  const dayMs = 24 * 60 * 60 * 1000;
  const startTime = candleData[0].ts;
  const endTime = candleData[candleData.length - 1].ts;
  const startDay = Math.floor(startTime / dayMs) * dayMs;
  const numDays = Math.ceil((endTime - startTime) / dayMs);

  for (let day = 0; day < numDays; day++) {
    const dayStart = startDay + day * dayMs;

    sessions.forEach((session) => {
      const sessionStart = dayStart + session.start * 60 * 60 * 1000;
      const sessionEnd = dayStart + session.end * 60 * 60 * 1000;

      // Add rectangle for this session
      shapesPlugin.addRect(sessionStart, sessionEnd, 95, 110, {
        fillColor: session.color,
        strokeColor: session.border,
        lineWidth: 1,
      });
    });
  }
}

/**
 * Add support and resistance zones
 */
function addSupportResistanceZones(shapesPlugin: ShapesOverlayPlugin): void {
  // Support zone (98-102)
  shapesPlugin.addBand(98, 102, {
    fillColor: 'rgba(0, 255, 0, 0.1)',
    strokeColor: '#00ff00',
    lineWidth: 1,
  });

  // Resistance zone (105-108)
  shapesPlugin.addBand(105, 108, {
    fillColor: 'rgba(255, 0, 0, 0.1)',
    strokeColor: '#ff0000',
    lineWidth: 1,
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
