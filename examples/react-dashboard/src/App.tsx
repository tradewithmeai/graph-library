import { useState, useCallback } from 'react';
import { SolVXChart, type Chart } from '@solvx/graph-engine-react';
import './App.css';

export function App(): JSX.Element {
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);

  const handleChartReady = useCallback((chart: Chart) => {
    console.log('Chart ready:', chart);
    console.log('Chart theme:', chart.getTheme());
    setChartInstance(chart);
  }, []);

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
              </div>

              <div className="info-card">
                <h3>About</h3>
                <p>
                  This React dashboard demonstrates the <code>SolVXChart</code> component from the{' '}
                  <code>@solvx/graph-engine-react</code> package.
                </p>
                <p>
                  The component wraps the core Chart class and provides a React-friendly API with
                  proper lifecycle management.
                </p>
              </div>

              <div className="info-card">
                <h3>Phase 1</h3>
                <p>
                  This is the foundational phase. The chart skeleton is in place, and the React
                  wrapper handles component lifecycle correctly.
                </p>
                <p>
                  Future phases will add rendering logic, data management, and interactive features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
