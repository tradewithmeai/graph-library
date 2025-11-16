import { Chart, defaultTheme } from '@solvx/graph-engine';
import type { ChartOptions } from '@solvx/graph-engine';

/**
 * Initialize the chart
 */
function initChart(): void {
  const container = document.getElementById('chart');

  if (!container) {
    console.error('Chart container not found');
    return;
  }

  const options: ChartOptions = {
    container,
    width: container.clientWidth,
    height: 400,
    theme: defaultTheme,
  };

  const chart = new Chart(options);

  console.log('Chart initialized:', chart);
  console.log('Chart theme:', chart.getTheme());
  console.log('Chart container:', chart.getContainer());

  // Handle window resize
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      console.log('Window resized');
      // In future phases, we would call chart.resize() here
    }, 250);
  });

  // Store chart instance globally for debugging
  (window as Window & { chart?: Chart }).chart = chart;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}
