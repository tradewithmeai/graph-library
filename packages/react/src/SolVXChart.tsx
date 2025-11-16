import { useEffect, useRef } from 'react';
import { Chart, type ChartOptions } from '@solvx/graph-engine';

/**
 * Props for the SolVXChart component
 */
export interface SolVXChartProps extends Omit<ChartOptions, 'container'> {
  /**
   * Additional CSS class name for the container
   */
  className?: string;

  /**
   * Inline styles for the container
   */
  style?: React.CSSProperties;

  /**
   * Callback fired when the chart instance is created
   */
  onChartReady?: (chart: Chart) => void;
}

/**
 * React component wrapper for SolVX Graph Engine
 *
 * This component provides a React-friendly interface to the core Chart class.
 * It handles the lifecycle of the chart instance and provides a ref-based API.
 *
 * @example
 * ```tsx
 * import { SolVXChart } from '@solvx/graph-engine-react';
 *
 * function App() {
 *   return (
 *     <SolVXChart
 *       width={800}
 *       height={600}
 *       onChartReady={(chart) => {
 *         console.log('Chart ready:', chart);
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function SolVXChart({
  className,
  style,
  onChartReady,
  width,
  height,
  theme,
  data,
}: SolVXChartProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Create chart instance
    const chart = new Chart({
      container: containerRef.current,
      width,
      height,
      theme,
      data,
    });

    chartRef.current = chart;

    // Notify parent component
    onChartReady?.(chart);

    // Cleanup on unmount
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [width, height, theme, data, onChartReady]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        ...style,
      }}
    />
  );
}
