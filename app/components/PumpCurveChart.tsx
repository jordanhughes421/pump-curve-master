'use client';

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

  const labels = Array.from(new Set(parsedCurves.flatMap(curve => curve.points.map(p => p.flow)))).sort((a, b) => a - b);

  const datasets = parsedCurves.flatMap((curve, index) => {
    const colorSet = [ // Modern color palette
      { head: 'rgba(54, 162, 235, 1)', efficiency: 'rgba(75, 192, 192, 1)' }, // Blue, Teal
      { head: 'rgba(255, 99, 132, 1)', efficiency: 'rgba(255, 159, 64, 1)' }, // Pink, Orange
      { head: 'rgba(153, 102, 255, 1)', efficiency: 'rgba(255, 205, 86, 1)' }, // Purple, Yellow
      { head: 'rgba(60, 179, 113, 1)', efficiency: 'rgba(238, 130, 238, 1)' }, // MediumSeaGreen, Violet
    ];
    const selectedColors = colorSet[index % colorSet.length];

    return [
      {
        label: `${curve.speed} RPM - Head`,
        data: curve.points.map(p => ({ x: p.flow, y: p.head })),
        borderColor: selectedColors.head,
        backgroundColor: selectedColors.head.replace('1)', '0.5)'), // Lighter fill
        yAxisID: 'yHead',
        tension: 0.4, // Smooth curves
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false, // Can be true if using background color for area under line
      },
      {
        label: `${curve.speed} RPM - Efficiency`,
        data: curve.points.map(p => ({ x: p.flow, y: p.efficiency })),
        borderColor: selectedColors.efficiency,
        backgroundColor: selectedColors.efficiency.replace('1)', '0.5)'),
        yAxisID: 'yEfficiency',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
      }
    ];
  });

  const data = {
    labels, // X-axis labels (flow values)
    datasets,
  };

  const maxFlow = Math.max(...labels, 0);
  const allHeadPoints = parsedCurves.flatMap(c => c.points.map(p => p.head));
  const maxHead = Math.max(...allHeadPoints, 0);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
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

  return (
    <div className="w-full h-[450px] p-4 bg-white rounded-xl shadow-lg"> {/* Enhanced container style */}
      <Line data={data} options={options} />
    </div>
  );
}