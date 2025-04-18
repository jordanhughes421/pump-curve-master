import React, { useState } from 'react';

interface PumpCurve {
  id: number;
  pumpModelId: number;
  speed: number;
  points: string;
  createdAt: Date;
  updatedAt: Date;
  isScaled?: boolean;
  originalCurveId?: number;
  speedRatio?: number;
  diameterRatio?: number;
}

interface AffinityCalculatorProps {
  curves: PumpCurve[];
  onCalculate: (originalCurve: PumpCurve, scaledPoints: string, speedRatio: number, diameterRatio: number) => void;
}

interface ScalingFactors {
  speedRatio: number;
  diameterRatio: number;
}

export default function AffinityCalculator({ curves, onCalculate }: AffinityCalculatorProps) {
  const [selectedCurveId, setSelectedCurveId] = useState<number>(curves[0]?.id || 0);
  const [scalingFactors, setScalingFactors] = useState<ScalingFactors>({
    speedRatio: 1,
    diameterRatio: 1,
  });

  const calculateScaledCurve = () => {
    const originalCurve = curves.find(c => c.id === selectedCurveId);
    if (!originalCurve) return;

    const originalPoints = originalCurve.points.split(';').map(point => {
      const [flow, head, efficiency, power] = point.split(',');
      return {
        flow: Number(flow),
        head: Number(head),
        efficiency: Number(efficiency),
        power: Number(power)
      };
    });

    const scaledPoints = originalPoints.map(point => {
      // Apply affinity laws
      const scaledFlow = point.flow * scalingFactors.speedRatio * Math.pow(scalingFactors.diameterRatio, 3);
      const scaledHead = point.head * Math.pow(scalingFactors.speedRatio, 2) * Math.pow(scalingFactors.diameterRatio, 2);
      const scaledPower = point.power * Math.pow(scalingFactors.speedRatio, 3) * Math.pow(scalingFactors.diameterRatio, 5);

      return {
        flow: scaledFlow,
        head: scaledHead,
        power: scaledPower,
        efficiency: point.efficiency, // Efficiency typically remains the same
      };
    });

    // Convert back to the expected format: "flow,head,efficiency,power;flow,head,efficiency,power"
    const formattedPoints = scaledPoints
      .map(point => `${point.flow},${point.head},${point.efficiency},${point.power}`)
      .join(';');

    onCalculate(originalCurve, formattedPoints, scalingFactors.speedRatio, scalingFactors.diameterRatio);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Affinity Laws Calculator</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Curve to Scale
          </label>
          <select
            value={selectedCurveId}
            onChange={(e) => setSelectedCurveId(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {curves.map(curve => (
              <option key={curve.id} value={curve.id}>
                {curve.speed} RPM {curve.isScaled ? '(Scaled)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Speed Ratio (N₂/N₁)
          </label>
          <input
            type="number"
            step="0.1"
            value={scalingFactors.speedRatio}
            onChange={(e) => setScalingFactors(prev => ({
              ...prev,
              speedRatio: parseFloat(e.target.value)
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Diameter Ratio (D₂/D₁)
          </label>
          <input
            type="number"
            step="0.1"
            value={scalingFactors.diameterRatio}
            onChange={(e) => setScalingFactors(prev => ({
              ...prev,
              diameterRatio: parseFloat(e.target.value)
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={calculateScaledCurve}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate Scaled Curve
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Affinity Laws:</p>
        <ul className="list-disc pl-4 mt-2">
          <li>Flow (Q₂/Q₁) = (N₂/N₁) × (D₂/D₁)³</li>
          <li>Head (H₂/H₁) = (N₂/N₁)² × (D₂/D₁)²</li>
          <li>Power (P₂/P₁) = (N₂/N₁)³ × (D₂/D₁)⁵</li>
        </ul>
      </div>
    </div>
  );
} 