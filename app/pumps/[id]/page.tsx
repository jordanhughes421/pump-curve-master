'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PumpCurveChart from '@/app/components/PumpCurveChart';
import UploadCurveForm from '@/app/components/UploadCurveForm';
import ExistingCurvesCard from '@/app/components/ExistingCurvesCard';
import AffinityCalculator from '@/app/components/AffinityCalculator';

interface PumpModel {
  id: number;
  name: string;
  type: string;
  manufacturer: string;
  modelNumber: string;
  maxFlow: number;
  maxHead: number;
  maxSpeed: number;
  description: string;
}

import type { PumpCurve } from '../../../types';

export default function PumpDetailsPage() {
  const params = useParams();
  const [pump, setPump] = useState<PumpModel | null>(null);
  const [curves, setCurves] = useState<PumpCurve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCurve, setEditingCurve] = useState<PumpCurve | undefined>(undefined);

  useEffect(() => {
    const fetchPumpData = async () => {
      try {
        const [pumpResponse, curvesResponse] = await Promise.all([
          fetch(`/api/pumps/${params.id}`),
          fetch(`/api/pumps/${params.id}/curves`),
        ]);

        if (!pumpResponse.ok || !curvesResponse.ok) {
          throw new Error('Failed to fetch pump data');
        }

        const [pumpData, curvesData] = await Promise.all([
          pumpResponse.json(),
          curvesResponse.json(),
        ]);

        setPump(pumpData);
        setCurves(curvesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pump data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPumpData();
    }
  }, [params.id]);

  const handleCurveSuccess = async () => {
    try {
      const response = await fetch(`/api/pumps/${params.id}/curves`);
      if (!response.ok) {
        throw new Error('Failed to fetch updated curves');
      }
      const curvesData = await response.json();
      setCurves(curvesData);
      setEditingCurve(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch updated curves');
    }
  };

  const handleEditCurve = (curve: PumpCurve) => {
    setEditingCurve(curve);
  };

  const handleDeleteCurve = async (curveId: number) => {
    if (!confirm('Are you sure you want to delete this curve?')) return;

    try {
      const response = await fetch(`/api/pumps/${params.id}/curves/${curveId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete curve');
      }

      setCurves(curves.filter(curve => curve.id !== curveId));
      setEditingCurve(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete curve');
    }
  };

  // const handleScaleCurve = async (originalCurve: PumpCurve, scaledPoints: string, speedRatio: number, diameterRatio: number) => {
  //   try {
  //     const response = await fetch('/api/pump-curves/scale', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         originalCurveId: originalCurve.id,
  //         pumpModelId: pump?.id,
  //         points: scaledPoints,
  //         speedRatio,
  //         diameterRatio,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to create scaled curve');
  //     }

  //     // Refresh curves after scaling
  //     const curvesResponse = await fetch(`/api/pumps/${params.id}/curves`);
  //     if (!curvesResponse.ok) {
  //       throw new Error('Failed to fetch updated curves');
  //     }
  //     const curvesData = await curvesResponse.json();
  //     setCurves(curvesData);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to create scaled curve');
  //   }
  // };

  const handleNewScaledCurve = (newlyScaledCurve: PumpCurve) => {
    setCurves(prevCurves => [...prevCurves, newlyScaledCurve]);
    // Optionally, could add a user notification here that scaling was successful.
    // e.g., toast.success('Curve scaled successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-content-background p-8 rounded-lg shadow-md flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-foreground/80 font-medium">Loading pump details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-6 py-4 rounded-lg max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Error Loading Pump Details</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pump) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-300 px-6 py-4 rounded-lg max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Pump Not Found</h2>
          <p>The requested pump could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-content-background rounded-xl shadow-lg">
        <div className="mb-8 pb-6 border-b border-brandColor2">
          <h1 className="text-4xl font-bold text-foreground mb-2">{pump.name}</h1>
          <p className="text-lg text-foreground/80">{pump.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Pump Specifications */}
          <div className="space-y-8">
            <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
              <h2 className="text-xl font-semibold text-foreground/90 mb-6">Pump Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Flow Rate</h3>
                  <p className="text-base font-medium text-foreground">{pump.maxFlow} GPM</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Head</h3>
                  <p className="text-base font-medium text-foreground">{pump.maxHead} ft</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Power</h3>
                  <p className="text-base font-medium text-foreground">{pump.maxSpeed} RPM</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Efficiency</h3>
                  <p className="text-base font-medium text-foreground">{pump.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">NPSH</h3>
                  <p className="text-base font-medium text-foreground">{pump.manufacturer} - {pump.modelNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
              <h2 className="text-xl font-semibold text-foreground/90 mb-4">Performance Curves</h2>
              <PumpCurveChart curves={curves} />
            </div>
          </div>

          {/* Right Column - Curve Management */}
          <div className="space-y-8">
            <UploadCurveForm
              pumpId={pump.id}
              onSuccess={handleCurveSuccess}
              existingCurves={curves}
              editingCurve={editingCurve}
            />
            <ExistingCurvesCard
              curves={curves}
              onEdit={handleEditCurve}
              onDelete={handleDeleteCurve}
            />
            {/* Show AffinityCalculator only if pump data is available and there's at least one original (non-scaled) curve */}
            {pump && curves.some(c => !c.isScaled) && (
              <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
                <h2 className="text-xl font-semibold text-foreground/90 mb-4">Scale Curve</h2>
                <AffinityCalculator
                  curves={curves} // Pass all curves; AffinityCalculator filters internally for selection
                  pumpModelId={pump.id}
                  onScaledCurveCreated={handleNewScaledCurve}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 