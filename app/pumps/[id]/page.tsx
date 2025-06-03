'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PumpCurveChart from '@/app/components/PumpCurveChart';
import UploadCurveForm from '@/app/components/UploadCurveForm';
import ExistingCurvesCard from '@/app/components/ExistingCurvesCard';
import AffinityCalculator from '@/app/components/AffinityCalculator';
import NestedBOMView from '@/app/components/NestedBOMView';
import AddBOMItemForm from '@/app/components/AddBOMItemForm';
import EditBOMItemForm from '@/app/components/EditBOMItemForm';

// BOM Types (ideally from a shared types file)
interface BOMCustomFieldData {
  id: number;
  name: string;
  value: string;
}

interface BOMItemData {
  id: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  customFields: BOMCustomFieldData[];
  children: BOMItemData[];
  // parentId?: number | null; // Optional: if needed directly on the object
  // pumpModelId?: number; // Optional: if needed directly on the object
}


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

  // BOM State
  const [showAddBOMForm, setShowAddBOMForm] = useState(false);
  const [editingBOMItem, setEditingBOMItem] = useState<BOMItemData | null>(null);
  const [currentBOMParentId, setCurrentBOMParentId] = useState<number | null>(null);
  const [bomUpdateKey, setBomUpdateKey] = useState(0); // Increment to trigger NestedBOMView refresh

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

  // --- BOM Action Handlers ---
  const handleAddBOMItemClick = (parentId: number | null) => {
    setCurrentBOMParentId(parentId);
    setEditingBOMItem(null); // Ensure edit form is hidden
    setShowAddBOMForm(true);
  };

  const handleEditBOMItemClick = (item: BOMItemData) => {
    setEditingBOMItem(item);
    setShowAddBOMForm(false); // Ensure add form is hidden
  };

  const handleDeleteBOMItem = async (itemId: number) => {
    // Confirmation is handled in NestedBOMView
    try {
      const response = await fetch(`/api/bom-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete BOM item');
      }
      // alert('BOM Item deleted successfully'); // Or use a toast notification
      setBomUpdateKey(prevKey => prevKey + 1); // Trigger refresh
    } catch (err: any) {
      setError(err.message || 'Failed to delete BOM item.'); // Show error on page or via toast
      // alert(`Error deleting BOM item: ${err.message}`);
    }
  };

  const handleBOMFormSuccess = () => {
    setShowAddBOMForm(false);
    setEditingBOMItem(null);
    setBomUpdateKey(prevKey => prevKey + 1);
    // alert('BOM operation successful!'); // Or use a toast
  };

  const handleBOMFormCancel = () => {
    setShowAddBOMForm(false);
    setEditingBOMItem(null);
  };
  // --- End BOM Action Handlers ---

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
        {/* Pump Info Header */}
        <div className="mb-8 pb-6 border-b border-brandColor2">
          <h1 className="text-4xl font-bold text-foreground mb-2">{pump.name}</h1>
          <p className="text-lg text-foreground/80">{pump.description}</p>
        </div>

        {/* Main Content Grid - Curves and Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
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
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Type</h3>
                  <p className="text-base font-medium text-foreground">{pump.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-foreground/70 mb-0.5 uppercase tracking-wider">Model</h3>
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
            {pump && curves.some(c => !c.isScaled) && (
              <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
                <h2 className="text-xl font-semibold text-foreground/90 mb-4">Scale Curve</h2>
                <AffinityCalculator
                  curves={curves}
                  pumpModelId={pump.id}
                  onScaledCurveCreated={handleNewScaledCurve}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bill of Materials Section */}
        <div className="mt-12 pt-8 border-t border-brandColor2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Bill of Materials</h2>
            <button
              onClick={() => handleAddBOMItemClick(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Add Top-Level BOM Item
            </button>
          </div>

          {/* Conditional Forms Display */}
          {showAddBOMForm && (
            <div className="mb-8 p-4 bg-background rounded-xl shadow-md border border-brandColor1/50">
              <AddBOMItemForm
                pumpId={pump.id}
                parentId={currentBOMParentId}
                onBOMItemAdded={handleBOMFormSuccess}
                onCancel={handleBOMFormCancel}
              />
            </div>
          )}

          {editingBOMItem && (
            <div className="mb-8 p-4 bg-background rounded-xl shadow-md border border-brandColor1/50">
              <EditBOMItemForm
                initialData={editingBOMItem}
                onBOMItemUpdated={handleBOMFormSuccess}
                onCancel={handleBOMFormCancel}
              />
            </div>
          )}
          
          {/* Nested BOM View */}
          <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
            <NestedBOMView
              pumpId={pump.id}
              bomUpdateKey={bomUpdateKey}
              onEditItem={handleEditBOMItemClick}
              onAddItem={handleAddBOMItemClick}
              onDeleteItem={handleDeleteBOMItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}