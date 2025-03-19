'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PumpCurveChart from '@/app/components/PumpCurveChart';
import UploadCurveForm from '@/app/components/UploadCurveForm';
import ExistingCurvesCard from '@/app/components/ExistingCurvesCard';

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

interface PumpCurve {
  id: number;
  speed: number;
  points: string;
}

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

  if (loading) {
    return (
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-brandColor1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brandColor1 font-medium">Loading pump details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Pump Details</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pump) {
    return (
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Pump Not Found</h2>
          <p>The requested pump could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandColor5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brandColor1 mb-2">{pump.name}</h1>
          <p className="text-brandColor1">{pump.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Pump Specifications */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-brandColor1 mb-4">Pump Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-brandColor1 mb-1">Flow Rate</h3>
                  <p className="text-lg font-semibold text-brandColor1">{pump.maxFlow} GPM</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-brandColor1 mb-1">Head</h3>
                  <p className="text-lg font-semibold text-brandColor1">{pump.maxHead} ft</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-brandColor1 mb-1">Power</h3>
                  <p className="text-lg font-semibold text-brandColor1">{pump.maxSpeed} RPM</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-brandColor1 mb-1">Efficiency</h3>
                  <p className="text-lg font-semibold text-brandColor1">{pump.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-brandColor1 mb-1">NPSH</h3>
                  <p className="text-lg font-semibold text-brandColor1">{pump.manufacturer} - {pump.modelNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-brandColor1 mb-4">Performance Curves</h2>
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
          </div>
        </div>
      </div>
    </div>
  );
} 