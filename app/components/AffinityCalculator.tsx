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
  originalCurve: PumpCurve;
  onCalculate: (scaledPoints: string) => void;
}

interface ScalingFactors {
  speedRatio: number;
  diameterRatio: number;
}

export default function AffinityCalculator({ originalCurve, onCalculate }: AffinityCalculatorProps) {
  const [scalingFactors, setScalingFactors] = useState<ScalingFactors>({
    speedRatio: 1,
    diameterRatio: 1,
  });

  const calculateScaledCurve = () => {
    const originalPoints = JSON.parse(originalCurve.points);
    const scaledPoints = originalPoints.map((point: any) => {
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

    onCalculate(JSON.stringify(scaledPoints));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Affinity Laws Calculator</h3>
      
      <div className="space-y-4">
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