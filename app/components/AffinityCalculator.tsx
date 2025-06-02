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
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
          <p>{error}</p> {/* Simplified error display */}
        </div>
      )}

      <div className="space-y-4"> {/* Adjusted from space-y-6 to space-y-4 for tighter packing */}
        <div>
          <label htmlFor="selectedCurve" className="block text-sm font-medium text-foreground/80 mb-1">
            Select Original Curve
          </label>
          <select
            id="selectedCurve"
            value={selectedCurveId || ""}
            onChange={(e) => {
              const curveId = Number(e.target.value);
              setSelectedCurveId(curveId);
              const curve = curves.find(c => c.id === curveId);
              if (curve) setNewSpeed(curve.speed);
            }}
            className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground text-sm"
            disabled={selectableCurves.length === 0}
          >
            <option value="" disabled>-- Select a curve --</option>
            {selectableCurves.map(curve => (
              <option key={curve.id} value={curve.id}>
                {curve.speed} RPM (ID: {curve.id}) {curve.isScaled ? "(Scaled - not recommended)" : ""}
              </option>
            ))}
          </select>
           {selectableCurves.length === 0 && curves.length > 0 && (
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5">Only non-scaled curves are recommended as a base for scaling.</p>
          )}
           {curves.length === 0 && (
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1.5">No curves available for scaling.</p>
          )}
        </div>

        <div>
          <label htmlFor="newSpeed" className="block text-sm font-medium text-foreground/80 mb-1">
            New Speed (RPM)
          </label>
          <input
            id="newSpeed"
            type="number"
            step="50"
            value={newSpeed}
            onChange={(e) => setNewSpeed(parseFloat(e.target.value))}
            className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
            placeholder="e.g., 1750"
          />
        </div>

        <div>
          <label htmlFor="diameterRatio" className="block text-sm font-medium text-foreground/80 mb-1">
            Diameter Ratio (D₂/D₁ <span className="text-xs text-foreground/60">Optional, default: 1</span>)
          </label>
          <input
            id="diameterRatio"
            type="number"
            step="0.05"
            value={diameterRatio}
            onChange={(e) => setDiameterRatio(parseFloat(e.target.value))}
            className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
            placeholder="e.g., 0.9 or 1.1"
          />
        </div>

        <button
          onClick={handleCalculateScaledCurve}
          className="w-full flex justify-center px-6 py-2.5 mt-1 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
          disabled={isLoading || !selectedCurveId}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> {/* Added mr-2 to icon */}
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          )}
          {isLoading ? 'Calculating...' : 'Generate Scaled Curve'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-background/50 dark:bg-zinc-800/30 rounded-lg border border-brandColor1/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">Affinity Law Formulas:</h3>
        <ul className="space-y-1 text-sm text-foreground/80">
          <li>Q₂ = Q₁ × (N₂/N₁) × (D₂/D₁)</li>
          <li>H₂ = H₁ × (N₂/N₁)² × (D₂/D₁)²</li>
          <li>P₂ = P₁ × (N₂/N₁)³ × (D₂/D₁)³</li>
          <li className="italic text-xs text-foreground/60">* Efficiency (η) is assumed constant for ideal scaling.</li>
        </ul>
         <p className="text-xs text-foreground/60 mt-2">Note: N = Speed, D = Impeller Diameter. Subscript 1 is original, 2 is new.</p>
      </div>
    </>
  );
}