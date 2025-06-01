'use client';

import { useState } from 'react';
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
import type { PumpCurve } from '../../types';

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
);

interface PumpCurveChartProps {
  curves: PumpCurve[];
}

export default function PumpCurveChart({ curves }: PumpCurveChartProps) {
  const [showOriginalCurves, setShowOriginalCurves] = useState(true);
  const [showScaledCurves, setShowScaledCurves] = useState(true);
  const [selectedSpeeds, setSelectedSpeeds] = useState<number[]>([]);

  // Get unique speeds from curves for filter options
  const uniqueSpeeds = Array.from(new Set(curves.map(curve => curve.speed))).sort((a, b) => a - b);

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
    return (
      <div className="bg-brandColor5 border border-brandColor3 text-brandColor2 px-4 py-3 rounded-lg">
        No curve data available
      </div>
    );
  }

  const parsedCurves = curves.map(curve => {
    const parsedPoints = curve.points.split(';').map(point => {
      const [flow, head, efficiency, power] = point.split(',');
      return {
        flow: Number(flow),
        head: Number(head),
        efficiency: Number(efficiency),
        power: Number(power)
      };
    }).sort((a, b) => a.flow - b.flow);
    return { ...curve, points: parsedPoints };
  });

  // Filter curves based on UI selections
  const filteredCurves = parsedCurves.filter(curve => {
    const isScaledCurve = !!curve.isScaled;
    const typeMatch = (isScaledCurve && showScaledCurves) || (!isScaledCurve && showOriginalCurves);

    // If selectedSpeeds is empty, it means "All speeds" are effectively selected for this part of the filter
    const speedMatch = selectedSpeeds.length === 0 || selectedSpeeds.includes(curve.speed);

    return typeMatch && speedMatch;
  });

  const labels = Array.from(new Set(filteredCurves.flatMap(curve => curve.points.map(p => p.flow)))).sort((a, b) => a - b);

  const datasets = filteredCurves.flatMap((curve, index) => {
    const colorSet = [ // Modern color palette
      // Ensure enough colors if many curves can be displayed simultaneously, or use a color generation function.
      { head: 'rgba(54, 162, 235, 1)', efficiency: 'rgba(75, 192, 192, 1)' }, // Blue, Teal
      { head: 'rgba(255, 99, 132, 1)', efficiency: 'rgba(255, 159, 64, 1)' }, // Pink, Orange
      { head: 'rgba(153, 102, 255, 1)', efficiency: 'rgba(255, 205, 86, 1)' }, // Purple, Yellow
      { head: 'rgba(60, 179, 113, 1)', efficiency: 'rgba(238, 130, 238, 1)' }, // MediumSeaGreen, Violet
    ];
    const selectedColors = colorSet[index % colorSet.length];
    const isScaledCurve = !!curve.isScaled; // Treat undefined as false

    const headDataset: any = {
      label: `${curve.speed} RPM - Head` + (isScaledCurve ? ' (Scaled)' : ''),
      data: curve.points.map(p => ({ x: p.flow, y: p.head })),
      borderColor: selectedColors.head,
      backgroundColor: selectedColors.head.replace('1)', '0.5)'),
      yAxisID: 'yHead',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    };

    const efficiencyDataset: any = {
      label: `${curve.speed} RPM - Efficiency` + (isScaledCurve ? ' (Scaled)' : ''),
      data: curve.points.map(p => ({ x: p.flow, y: p.efficiency })),
      borderColor: selectedColors.efficiency,
      backgroundColor: selectedColors.efficiency.replace('1)', '0.5)'),
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
        }
      },
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