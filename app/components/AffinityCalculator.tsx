import React, { useState, useEffect } from 'react';
import type { PumpCurve } from '../../types';

// Assuming PumpCurve type is defined in a shared types file, e.g., @/types/index
// For now, let's redefine it here or import if available.

interface AffinityCalculatorProps {
  curves: PumpCurve[]; // Should ideally be non-scaled curves for selection
  pumpModelId: number;
  onScaledCurveCreated: (scaledCurve: PumpCurve) => void;
}

export default function AffinityCalculator({ curves, pumpModelId, onScaledCurveCreated }: AffinityCalculatorProps) {
  const getInitialSelectedCurve = () => curves.find(c => !c.isScaled) || curves[0];

  const [selectedCurveId, setSelectedCurveId] = useState<number | undefined>(getInitialSelectedCurve()?.id);
  const [newSpeed, setNewSpeed] = useState<number>(getInitialSelectedCurve()?.speed || 1000);
  const [diameterRatio, setDiameterRatio] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update newSpeed if selectedCurveId changes and a curve is found
    const currentSelectedCurve = curves.find(c => c.id === selectedCurveId);
    if (currentSelectedCurve) {
      setNewSpeed(currentSelectedCurve.speed);
    }
  }, [selectedCurveId, curves]);


  const handleCalculateScaledCurve = async () => {
    if (!selectedCurveId) {
      setError("Please select an original curve to scale.");
      return;
    }

    const originalCurve = curves.find(c => c.id === selectedCurveId);
    if (!originalCurve) {
        setError("Selected original curve not found.");
        return;
    }

    // Basic validation for newSpeed
    if (newSpeed <= 0) {
      setError("New speed must be a positive value.");
      return;
    }
    if (diameterRatio <= 0) {
      setError("Diameter ratio must be a positive value.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pump-curves/scale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalCurveId: selectedCurveId,
          pumpModelId: pumpModelId,
          newSpeed: newSpeed,
          diameterRatio: diameterRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const scaledCurve: PumpCurve = await response.json();
      onScaledCurveCreated(scaledCurve);
      // Optionally reset fields or give feedback
      // setNewSpeed(scaledCurve.speed || 1000); // Could reset to the new speed, or a default
      // setDiameterRatio(1);
      // setSelectedCurveId(undefined); // Clear selection or select the new curve if it's in the list

    } catch (err: any) {
      setError(err.message || 'Failed to calculate scaled curve.');
      console.error("Scaling API call failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out already scaled curves from selection, if desired
  const selectableCurves = curves.filter(c => !c.isScaled);
  if (selectableCurves.length === 0 && curves.length > 0) {
      // If only scaled curves are provided, this component might not be usable as intended
      // Or allow scaling from scaled curves if backend supports it well (e.g. always refers to ultimate original)
      // For now, we'll show what's passed, but ideally parent filters.
  }


  return (
    <div className="bg-brandColor5 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-brandColor1 mb-2">Affinity Laws Calculator</h2>
      <p className="text-brandColor1 mb-6">
        Select an original curve, enter a new speed and diameter ratio to generate a scaled performance curve.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="selectedCurve" className="block text-sm font-medium text-brandColor1 mb-2">
            Select Original Curve to Scale
          </label>
          <select
            id="selectedCurve"
            value={selectedCurveId || ""}
            onChange={(e) => {
              const curveId = Number(e.target.value);
              setSelectedCurveId(curveId);
              const curve = curves.find(c => c.id === curveId);
              if (curve) setNewSpeed(curve.speed); // Initialize newSpeed with selected curve's speed
            }}
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
            disabled={selectableCurves.length === 0}
          >
            <option value="" disabled>-- Select a curve --</option>
            {selectableCurves.map(curve => (
              <option key={curve.id} value={curve.id}>
                {curve.speed} RPM (ID: {curve.id})
              </option>
            ))}
          </select>
           {selectableCurves.length === 0 && curves.length > 0 && (
            <p className="text-sm text-yellow-600 mt-1">Only non-scaled curves can be used as a base for scaling.</p>
          )}
           {curves.length === 0 && (
            <p className="text-sm text-yellow-600 mt-1">No curves available for scaling.</p>
          )}
        </div>

        <div>
          <label htmlFor="newSpeed" className="block text-sm font-medium text-brandColor1 mb-2">
            New Speed (RPM)
          </label>
          <input
            id="newSpeed"
            type="number"
            step="50"
            value={newSpeed}
            onChange={(e) => setNewSpeed(parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
            placeholder="e.g., 1750"
          />
        </div>

        <div>
          <label htmlFor="diameterRatio" className="block text-sm font-medium text-brandColor1 mb-2">
            Diameter Ratio (D₂/D₁ - Optional, default: 1)
          </label>
          <input
            id="diameterRatio"
            type="number"
            step="0.05"
            value={diameterRatio}
            onChange={(e) => setDiameterRatio(parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
            placeholder="e.g., 0.9"
          />
        </div>

        <button
          onClick={handleCalculateScaledCurve}
          className="w-full px-6 py-3 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={isLoading || !selectedCurveId}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          )}
          {isLoading ? 'Calculating...' : 'Generate Scaled Curve'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border border-brandColor3">
        <h3 className="text-sm font-medium text-brandColor1 mb-2">Affinity Law Formulas (Server Calculated):</h3>
        <ul className="space-y-1 text-sm text-brandColor1">
          <li>• Flow (Q₂) = Q₁ × (N₂/N₁) × (D₂/D₁)</li>
          <li>• Head (H₂) = H₁ × (N₂/N₁)² × (D₂/D₁)²</li>
          <li>• Power (P₂) = P₁ × (N₂/N₁)³ × (D₂/D₁)³</li>
          <li>• Efficiency (η) remains unchanged.</li>
        </ul>
         <p className="text-xs text-gray-500 mt-2">Note: (N₂/N₁) is Speed Ratio, (D₂/D₁) is Diameter Ratio.</p>
      </div>
    </div>
  );
}