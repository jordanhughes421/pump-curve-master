'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CurvePoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

interface PumpCurve {
  id: number;
  speed: number;
  points: string;
}

interface PumpCurveChartProps {
  curves: PumpCurve[];
}

export default function PumpCurveChart({ curves }: PumpCurveChartProps) {
  console.log('Raw curves received:', curves);

  if (curves.length === 0) {
    console.log('No curves available');
    return (
      <div className="bg-brandColor5 border border-brandColor3 text-brandColor2 px-4 py-3 rounded-lg">
        No curve data available
      </div>
    );
  }

  // Parse the points string for each curve
  const parsedCurves = curves.map(curve => {
    console.log('Processing curve:', curve);
    console.log('Points string:', curve.points);
    
    const parsedPoints = curve.points.split(';').map(point => {
      const [flow, head, efficiency, power] = point.split(',');
      const parsedPoint = {
        flow: Number(flow),
        head: Number(head),
        efficiency: Number(efficiency),
        power: Number(power)
      };
      console.log('Parsed point:', parsedPoint);
      return parsedPoint;
    }).sort((a, b) => a.flow - b.flow);

    console.log('Sorted points for curve:', parsedPoints);
    
    return {
      ...curve,
      points: parsedPoints
    };
  });

  console.log('Final parsed curves:', parsedCurves);

  // Calculate axis ranges
  const allPoints = parsedCurves.flatMap(curve => curve.points);
  const maxFlow = Math.ceil(Math.max(...allPoints.map(p => p.flow)) / 1000) * 1000;
  const maxHead = Math.ceil(Math.max(...allPoints.map(p => p.head)) / 10) * 10;
  const maxEfficiency = 100; // Efficiency is always 0-100%

  // Generate nice tick values for flow
  const flowTicks = Array.from({ length: 11 }, (_, i) => Math.round(maxFlow * i / 10));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="flow"
            type="number"
            domain={[0, maxFlow]}
            ticks={flowTicks}
            label={{ value: 'Flow (GPM)', position: 'bottom', fill: '#1F2937' }}
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            yAxisId="left"
            domain={[0, maxHead]}
            tickCount={8}
            label={{ value: 'Head (ft)', angle: -90, position: 'left', fill: '#1F2937' }}
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, maxEfficiency]}
            tickCount={6}
            label={{ value: 'Efficiency (%)', angle: 90, position: 'right', fill: '#1F2937' }}
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#1F2937', fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              color: '#1F2937',
              fontSize: '14px',
            }}
          />
          {parsedCurves.map((curve) => {
            console.log('Rendering head line for curve:', curve.id, 'with points:', curve.points);
            return (
              <Line
                key={curve.id}
                yAxisId="left"
                type="monotone"
                data={curve.points}
                dataKey="head"
                name={`${curve.speed} RPM - Head`}
                stroke="#0F172A"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            );
          })}
          {parsedCurves.map((curve) => {
            console.log('Rendering efficiency line for curve:', curve.id, 'with points:', curve.points);
            return (
              <Line
                key={`${curve.id}-efficiency`}
                yAxisId="right"
                type="monotone"
                data={curve.points}
                dataKey="efficiency"
                name={`${curve.speed} RPM - Efficiency`}
                stroke="#1E40AF"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 