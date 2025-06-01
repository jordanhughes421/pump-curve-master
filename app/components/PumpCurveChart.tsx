'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Added for potential gradient fills if desired for modern look
} from 'chart.js';
// Removed AnnotationPlugin import
import type { PumpCurve } from '../../types';

// Define a type for individual curve points, consistent with parsed data
interface CurvePoint { // This interface is still used by ProcessedPumpCurve and parsing logic
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

// BepData interface removed

// Define a type for the processed curve, where points is an array of CurvePoint
interface ProcessedPumpCurve extends Omit<PumpCurve, 'points'> {
  points: CurvePoint[];
}

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
  // AnnotationPlugin removed from registration
);

interface PumpCurveChartProps {
  curves: PumpCurve[];
}

export default function PumpCurveChart({ curves }: PumpCurveChartProps) {
  const [showOriginalCurves, setShowOriginalCurves] = useState(true);
  const [showScaledCurves, setShowScaledCurves] = useState(true);
  const [selectedSpeeds, setSelectedSpeeds] = useState<number[]>([]);
  // bepPoint, porRange, aorRange states removed

  // Get unique speeds from curves for filter options
  const uniqueSpeeds = Array.from(new Set(curves.map(curve => curve.speed))).sort((a, b) => a - b);

  // --- START OF MOVED HOOKS ---
  // Calculate BEP when filteredCurves (derived below, but declaration is hoisted) changes
  // Note: `parsedCurves` and `filteredCurves` are defined further down.
  // This is okay because the actual execution of this effect's callback
  // happens after the initial render, by which time all variables are defined.
  // However, for cleaner code, `parsedCurves` and `filteredCurves` could be memoized
  // with useMemo and also defined at the top level if they don't depend on other
  // variables that are only available after the early return.
  // For now, this direct move should satisfy the Rules of Hooks.

  // BEP and POR/AOR useEffect hooks removed.

  let parsedCurves: ProcessedPumpCurve[] = [];
  if (curves && curves.length > 0) {
    parsedCurves = curves.map((curve: PumpCurve) => { // Explicitly type 'curve' here
      const parsedPoints: CurvePoint[] = curve.points.split(';').map(point => {
        const [flow, head, efficiency, power] = point.split(',');
        return {
          flow: Number(flow),
          head: Number(head),
          efficiency: Number(efficiency),
          power: Number(power)
        };
      }).sort((a, b) => a.flow - b.flow);
      return { ...curve, points: parsedPoints } as ProcessedPumpCurve; // Cast to ProcessedPumpCurve
    });
  }

  // Filter curves based on UI selections
  // This definition also needs to be available for the useEffect below.
  const filteredCurves: ProcessedPumpCurve[] = parsedCurves.filter(curve => { // Add type to filteredCurves
    const isScaledCurve = !!curve.isScaled;
    const typeMatch = (isScaledCurve && showScaledCurves) || (!isScaledCurve && showOriginalCurves);
    const speedMatch = selectedSpeeds.length === 0 || selectedSpeeds.includes(curve.speed);
    return typeMatch && speedMatch;
  });

  // --- END OF MOVED HOOKS --- (Adjusted comment, hooks were here)

  const handleSpeedChange = (speed: number) => {
    setSelectedSpeeds(prevSpeeds =>
      prevSpeeds.includes(speed)
        ? prevSpeeds.filter(s => s !== speed)
        : [...prevSpeeds, speed]
    );
  };

  const handleSelectAllSpeeds = () => {
    if (selectedSpeeds.length === uniqueSpeeds.length) {
      setSelectedSpeeds([]); // Deselect all if all are selected
    } else {
      setSelectedSpeeds(uniqueSpeeds); // Select all
    }
  };


  if (!curves || curves.length === 0) {
    // Note: `parsedCurves` and `filteredCurves` will be empty arrays if this condition is met,
    // because of their new definitions above. Hooks are already called.
    return (
      <div className="bg-brandColor5 border border-brandColor3 text-brandColor2 px-4 py-3 rounded-lg">
        No curve data available
      </div>
    );
  }

  // `parsedCurves` and `filteredCurves` are now defined before the hooks, near the top.
  // The actual mapping and filtering logic is executed there.

  // TODO: console.log bepPoint to verify in development - remove for production
  // useEffect(() => {
  //   console.log("Current BEP Point:", bepPoint);
  // }, [bepPoint]);

  // TODO: console.log POR/AOR ranges to verify - remove for production
  // useEffect(() => {
  //   console.log("POR Range:", porRange);
  //   console.log("AOR Range:", aorRange);
  // }, [porRange, aorRange]);

  const labels = Array.from(new Set(filteredCurves.flatMap(curve => curve.points.map(p => p.flow)))).sort((a, b) => a - b);

  const datasets = filteredCurves.flatMap((curve, index) => {
    // New color scheme
    const headColor = '#3B82F6'; // Blue
    const efficiencyColor = '#10B981'; // Emerald/Green

    const isScaledCurve = !!curve.isScaled; // Treat undefined as false

    const headDataset: any = {
      label: `${curve.speed} RPM - Head` + (isScaledCurve ? ' (Scaled)' : ''),
      data: curve.points.map(p => ({ x: p.flow, y: p.head })),
      borderColor: headColor,
      backgroundColor: 'rgba(59, 130, 246, 0.5)', // Lighter blue for fill if used
      yAxisID: 'yHead',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    };

    const efficiencyDataset: any = {
      label: `${curve.speed} RPM - Efficiency` + (isScaledCurve ? ' (Scaled)' : ''),
      data: curve.points.map(p => ({ x: p.flow, y: p.efficiency })),
      borderColor: efficiencyColor,
      backgroundColor: 'rgba(16, 185, 129, 0.5)', // Lighter emerald/green for fill if used
      yAxisID: 'yEfficiency',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    };

    if (isScaledCurve) {
      headDataset.borderDash = [5, 5]; // Dashed line for scaled head
      efficiencyDataset.borderDash = [3, 3]; // Dotted-like line for scaled efficiency
      // Optionally, adjust label for scaled curves if not done above
      // headDataset.label += ' (Scaled)';
      // efficiencyDataset.label += ' (Scaled)';
    }

    return [headDataset, efficiencyDataset];
  });

  const data = {
    labels, // X-axis labels (flow values)
    datasets,
  };

  // Recalculate maxFlow and maxHead based on filteredCurves for dynamic axis scaling
  const visiblePoints = filteredCurves.flatMap(c => c.points);
  const maxFlow = visiblePoints.length > 0 ? Math.max(...visiblePoints.map(p => p.flow), 0) : 0; // Default to 0 if no points
  const allHeadPoints = filteredCurves.flatMap(c => c.points.map(p => p.head)); // Will be empty if no visible points
  const maxHead = allHeadPoints.length > 0 ? Math.max(...allHeadPoints, 0) : 0; // Default to 0 if no points

  // Annotation logic (dynamicAnnotations, etc.) removed.

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Pump Performance Curves',
        font: { size: 18, weight: 'bold' as const, family: 'Arial, sans-serif' },
        color: '#333',
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, family: 'Arial, sans-serif' },
          color: '#555',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 12 },
        footerFont: { size: 10 },
        padding: 10,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y.toFixed(2)}`;
              if (context.dataset.yAxisID === 'yHead') label += ' ft';
              if (context.dataset.yAxisID === 'yEfficiency') label += ' %';
            }
            return label;
          },
          title: function(context: any) {
            if (context[0]) {
              return `Flow: ${context[0].parsed.x.toFixed(2)} GPM`;
            }
            return '';
          }
        },
      },
      // annotation plugin configuration removed
    },
    scales: {
      x: {
        type: 'linear' as const, // Ensure x-axis is treated as linear for flow values
        title: {
          display: true,
          text: 'Flow (GPM)',
          font: { size: 14, weight: 'bold' as const, family: 'Arial, sans-serif' },
          color: '#555',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Lighter grid lines
        },
        ticks: {
          color: '#555',
          font: { family: 'Arial, sans-serif' },
          maxTicksLimit: 11, // Similar to original flowTicks
        },
        min: 0,
        suggestedMax: maxFlow * 1.05, // Add some padding
      },
      yHead: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Head (ft)',
          font: { size: 14, weight: 'bold' as const, family: 'Arial, sans-serif' },
          color: '#555',
        },
        grid: {
          drawOnChartArea: true, // Main grid lines
          color: 'rgba(200, 200, 200, 0.5)',
        },
        ticks: {
          color: '#555',
          font: { family: 'Arial, sans-serif' },
          maxTicksLimit: 8,
        },
        min: 0,
        suggestedMax: maxHead * 1.1, // Add some padding
      },
      yEfficiency: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Efficiency (%)',
          font: { size: 14, weight: 'bold' as const, family: 'Arial, sans-serif' },
          color: '#555',
        },
        grid: {
          drawOnChartArea: false, // Only draw grid for yHead to avoid clutter
        },
        ticks: {
          color: '#555',
          font: { family: 'Arial, sans-serif' },
          maxTicksLimit: 6,
        },
        min: 0,
        suggestedMax: 100,
      },
    },
    animation: {
      duration: 1000, // Smooth animations
      easing: 'easeInOutQuad' as const,
    },
  };

  // No longer using chartData and chartOptions as separate variables
  // data and options are now built with filteredCurves directly.

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg">
      {/* Filter UI Elements */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Filter Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Curve Type Filters */}
          <div>
            <h4 className="text-md font-medium mb-2 text-gray-600">Curve Types:</h4>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="showOriginalCurves"
                checked={showOriginalCurves}
                onChange={() => setShowOriginalCurves(!showOriginalCurves)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showOriginalCurves" className="ml-2 text-sm text-gray-700">
                Show Original Curves
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showScaledCurves"
                checked={showScaledCurves}
                onChange={() => setShowScaledCurves(!showScaledCurves)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showScaledCurves" className="ml-2 text-sm text-gray-700">
                Show Scaled Curves
              </label>
            </div>
          </div>

          {/* Speed Filters */}
          <div>
            <h4 className="text-md font-medium mb-2 text-gray-600">Speeds (RPM):</h4>
            {uniqueSpeeds.length > 0 ? (
              <>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="allSpeeds"
                    // "All Speeds" checkbox reflects "select all" if no specific speeds are chosen, or if all are explicitly chosen.
                    checked={selectedSpeeds.length === 0 || selectedSpeeds.length === uniqueSpeeds.length}
                    onChange={handleSelectAllSpeeds}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allSpeeds" className="ml-2 text-sm font-medium text-gray-700">
                    {/* Adjust label to be more descriptive of behavior */}
                    {selectedSpeeds.length === 0 ? "All Speeds (Default)" : (selectedSpeeds.length === uniqueSpeeds.length ? "All Speeds (Selected)" : "Select All Speeds")}
                  </label>
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {uniqueSpeeds.map(speed => (
                    <div key={speed} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`speed-${speed}`}
                        checked={selectedSpeeds.includes(speed)}
                        onChange={() => handleSpeedChange(speed)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`speed-${speed}`} className="ml-2 text-sm text-gray-700">
                        {speed} RPM
                      </label>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No speed options available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {filteredCurves.length > 0 ? (
        <div className="w-full h-[450px]"> {/* Ensure chart maintains its designated height */}
          <Line data={data} options={options} />
        </div>
      ) : (
        <div className="w-full h-[450px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
          No data to display based on current filter selections.
        </div>
      )}
    </div>
  );
}