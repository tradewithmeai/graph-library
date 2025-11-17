import { useState, useCallback, useEffect } from 'react';
import { SolVXChart, type Chart } from '@solvx/graph-engine-react';
import {
  CandleSeries,
  CrosshairTooltipPlugin,
  MovingAveragePlugin,
  ShapesOverlayPlugin,
  type Candle,
} from '@solvx/graph-engine';
import './App.css';

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

export function App(): JSX.Element {
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const [pluginsEnabled, setPluginsEnabled] = useState({
    tooltip: true,
    ma20: true,
    ma50: true,
    shapes: true,
  });

  const handleChartReady = useCallback((chart: Chart) => {
    console.log('Chart ready:', chart);
    console.log('Chart theme:', chart.getTheme());
    setChartInstance(chart);

    // Generate and add sample data
    const candleData = generateSampleData();
    const series = new CandleSeries(candleData);
    chart.addSeries(series);

    // Create and install plugins
    const tooltipPlugin = new CrosshairTooltipPlugin();
    const ma20Plugin = new MovingAveragePlugin({ period: 20, color: '#2196F3' }, 'ma-20');
    const ma50Plugin = new MovingAveragePlugin({ period: 50, color: '#FF9800' }, 'ma-50');
    const shapesPlugin = new ShapesOverlayPlugin();

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
  }, []);

  // Handle plugin toggle
  useEffect(() => {
    if (!chartInstance) return;

    const pluginIds = {
      tooltip: 'crosshair-tooltip',
      ma20: 'ma-20',
      ma50: 'ma-50',
      shapes: 'shapes-overlay',
    };

    // Toggle each plugin based on state
    Object.entries(pluginsEnabled).forEach(([key, enabled]) => {
      const pluginId = pluginIds[key as keyof typeof pluginIds];

      if (enabled) {
        // Check if plugin is already installed
        const installedPlugins = chartInstance.getInstalledPlugins();
        if (!installedPlugins.includes(pluginId)) {
          // Reinstall the plugin
          if (key === 'tooltip') {
            chartInstance.installPlugin(new CrosshairTooltipPlugin());
          } else if (key === 'ma20') {
            chartInstance.installPlugin(
              new MovingAveragePlugin({ period: 20, color: '#2196F3' }, 'ma-20'),
            );
          } else if (key === 'ma50') {
            chartInstance.installPlugin(
              new MovingAveragePlugin({ period: 50, color: '#FF9800' }, 'ma-50'),
            );
          } else if (key === 'shapes') {
            const shapesPlugin = new ShapesOverlayPlugin();
            chartInstance.installPlugin(shapesPlugin);

            // Re-add shapes
            const series = chartInstance.getSeries()[0];
            if (series) {
              const minTime = series.getTimestamp(0);
              const maxTime = series.getTimestamp(series.getLength() - 1);
              const midTime = (minTime + maxTime) / 2;

              shapesPlugin.addBand(95, 105, {
                fillColor: 'rgba(76, 175, 80, 0.1)',
                strokeColor: '#4CAF50',
              });

              shapesPlugin.addRect(midTime - 3600000, midTime + 3600000, 90, 110, {
                fillColor: 'rgba(255, 152, 0, 0.05)',
                strokeColor: '#FF9800',
                lineWidth: 2,
              });
            }
          }
        }
      } else {
        chartInstance.uninstallPlugin(pluginId);
      }
    });
  }, [chartInstance, pluginsEnabled]);

  const togglePlugin = (plugin: keyof typeof pluginsEnabled) => {
    setPluginsEnabled((prev) => ({
      ...prev,
      [plugin]: !prev[plugin],
    }));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>SolVX Graph Engine</h1>
          <p className="subtitle">React Dashboard Example</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="dashboard">
            <div className="chart-card">
              <h2>Primary Chart</h2>
              <div className="chart-wrapper">
                <SolVXChart width={800} height={400} onChartReady={handleChartReady} />
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <h3>Chart Status</h3>
                <p className="status">{chartInstance ? '✓ Initialized' : '⏳ Loading...'}</p>
                {chartInstance && (
                  <div style={{ marginTop: '10px', fontSize: '14px' }}>
                    <div>Series: {chartInstance.getSeries().length}</div>
                    <div>Plugins: {chartInstance.getInstalledPlugins().length} installed</div>
                  </div>
                )}
              </div>

              <div className="info-card">
                <h3>Plugin Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pluginsEnabled.tooltip}
                      onChange={() => togglePlugin('tooltip')}
                      style={{ marginRight: '8px' }}
                    />
                    Crosshair Tooltip
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pluginsEnabled.ma20}
                      onChange={() => togglePlugin('ma20')}
                      style={{ marginRight: '8px' }}
                    />
                    MA(20)
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pluginsEnabled.ma50}
                      onChange={() => togglePlugin('ma50')}
                      style={{ marginRight: '8px' }}
                    />
                    MA(50)
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pluginsEnabled.shapes}
                      onChange={() => togglePlugin('shapes')}
                      style={{ marginRight: '8px' }}
                    />
                    Shapes Overlay
                  </label>
                </div>
              </div>

              <div className="info-card">
                <h3>About</h3>
                <p>
                  This React dashboard demonstrates the <code>SolVXChart</code> component from the{' '}
                  <code>@solvx/graph-engine-react</code> package with Phase 5 plugin architecture.
                </p>
                <p>
                  Features: CrosshairTooltip, Moving Averages (MA20, MA50), and Shapes Overlay with
                  runtime plugin toggles.
                </p>
              </div>

              <div className="info-card">
                <h3>Phase 5 Complete</h3>
                <p>
                  The full plugin architecture is now implemented with three core plugins:
                  CrosshairTooltipPlugin, MovingAveragePlugin, and ShapesOverlayPlugin.
                </p>
                <p>
                  Use the Plugin Controls to enable/disable plugins dynamically and see them in
                  action on the chart.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
