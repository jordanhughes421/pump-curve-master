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
    <div className="bg-brandColor5 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-brandColor1 mb-2">Affinity Laws Calculator</h2>
      <p className="text-brandColor1 mb-6">
        Select a curve and apply speed and diameter ratios to create a scaled performance curve.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-brandColor1 mb-2">
            Select Curve to Scale
          </label>
          <select
            value={selectedCurveId}
            onChange={(e) => setSelectedCurveId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
          >
            {curves.map(curve => (
              <option key={curve.id} value={curve.id}>
                {curve.speed} RPM {curve.isScaled ? '(Scaled)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brandColor1 mb-2">
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
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brandColor1 mb-2">
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
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
          />
        </div>

        <button
          onClick={calculateScaledCurve}
          className="w-full px-6 py-2 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Calculate Scaled Curve
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border border-brandColor3">
        <h3 className="text-sm font-medium text-brandColor1 mb-2">Affinity Laws:</h3>
        <ul className="space-y-1 text-sm text-brandColor1">
          <li>• Flow (Q₂/Q₁) = (N₂/N₁) × (D₂/D₁)³</li>
          <li>• Head (H₂/H₁) = (N₂/N₁)² × (D₂/D₁)²</li>
          <li>• Power (P₂/P₁) = (N₂/N₁)³ × (D₂/D₁)⁵</li>
        </ul>
      </div>
    </div>
  );
} 