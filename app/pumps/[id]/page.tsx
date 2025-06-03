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
import BOMListManager from '@/app/components/BOMListManager';
import BOMHeaderDisplay from '@/app/components/BOMHeaderDisplay';
import { BOM, PumpModel as PagePumpModel, BOMItem, ApiError, GetBOMByIdResponse } from '@/lib/types'; // Use shared types
import type { PumpCurve } from '../../../types';


// Interface for PumpModel used in this page (can be different from lib/types.PumpModel if needed)
interface PumpModel extends PagePumpModel { 
  // Already in PagePumpModel: id, name
  type: string;
  manufacturer: string;
  modelNumber: string;
  maxFlow: number;
  maxHead: number;
  maxSpeed: number;
  description: string;
}


export default function PumpDetailsPage() {
  const params = useParams();
  const pumpId = params.id as string; // Assuming params.id is always string

  const [pump, setPump] = useState<PumpModel | null>(null);
  const [curves, setCurves] = useState<PumpCurve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCurve, setEditingCurve] = useState<PumpCurve | undefined>(undefined);

  // New BOM State
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [currentBOM, setCurrentBOM] = useState<BOM | null>(null);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomError, setBomError] = useState<string | null>(null);
  const [refreshBomTrigger, setRefreshBomTrigger] = useState(0); // To trigger NestedBOMView refresh

  // State for BOM Item Forms
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showEditItemForm, setShowEditItemForm] = useState(false);
  const [editingBOMItem, setEditingBOMItem] = useState<BOMItem | null>(null);
  const [currentParentItemId, setCurrentParentItemId] = useState<number | null>(null);


  useEffect(() => {
    const fetchPumpData = async () => {
      if (!pumpId) return;
      try {
        const [pumpResponse, curvesResponse] = await Promise.all([
          fetch(`/api/pumps/${pumpId}`),
          fetch(`/api/pumps/${pumpId}/curves`),
        ]);

        if (!pumpResponse.ok || !curvesResponse.ok) {
          throw new Error('Failed to fetch pump data or curves');
        }

        const pumpData: PumpModel = await pumpResponse.json();
        const curvesData: PumpCurve[] = await curvesResponse.json();

        setPump(pumpData);
        setCurves(curvesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial pump data');
      } finally {
        setLoading(false);
      }
    };

    fetchPumpData();
  }, [pumpId]);

  // Effect to fetch full BOM details when selectedBomId changes
  useEffect(() => {
    const fetchFullBOMDetails = async () => {
      if (!selectedBomId) {
        setCurrentBOM(null);
        setBomError(null);
        return;
      }
      setBomLoading(true);
      setBomError(null);
      try {
        const response = await fetch(`/api/boms/${selectedBomId}`);
        if (!response.ok) {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.error || `Failed to fetch BOM details: ${response.statusText}`);
        }
        const data: GetBOMByIdResponse = await response.json();
        setCurrentBOM(data);
      } catch (err: any) {
        setBomError(err.message);
        setCurrentBOM(null);
      } finally {
        setBomLoading(false);
      }
    };

    fetchFullBOMDetails();
  }, [selectedBomId]);


  const handleCurveSuccess = async () => {
    if (!pumpId) return;
    try {
      const response = await fetch(`/api/pumps/${pumpId}/curves`);
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
    if (!pumpId || !confirm('Are you sure you want to delete this curve?')) return;

    try {
      const response = await fetch(`/api/pumps/${pumpId}/curves/${curveId}`, {
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

  // --- BOM Action Handlers (Old - Need refactoring or removal) ---
  // const handleAddBOMItemClick = (parentId: number | null) => {
  //   setCurrentBOMParentId(parentId);
  //   setEditingBOMItem(null);
  //   setShowAddBOMForm(true);
  // };

  // const handleEditBOMItemClick = (item: BOMItem) => { // BOMItem from lib/types
  //   setEditingBOMItem(item);
  //   setShowAddBOMForm(false); 
  // };

  // const handleDeleteBOMItem = async (itemId: number) => {
  //   try {
  //     const response = await fetch(`/api/bom-items/${itemId}`, {
  //       method: 'DELETE',
  //     });
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || 'Failed to delete BOM item');
  //     }
  //     // Refreshing the selected BOM to reflect deletion
  //     if (selectedBomId) {
  //       const fetchResponse = await fetch(`/api/boms/${selectedBomId}`);
  //       if (fetchResponse.ok) setCurrentBOM(await fetchResponse.json());
  //       else setCurrentBOM(null); // Or handle error more gracefully
  //     }
  //   } catch (err: any) {
  //     setBomError(err.message || 'Failed to delete BOM item.');
  //   }
  // };

  // const handleBOMFormSuccess = () => {
  //   setShowAddBOMForm(false);
  //   setEditingBOMItem(null);
  //   // Refreshing the selected BOM
  //    if (selectedBomId) {
  //       fetch(`/api/boms/${selectedBomId}`).then(res => res.json()).then(data => setCurrentBOM(data));
  //    }
  // };

  // const handleBOMFormCancel = () => {
  //   setShowAddBOMForm(false);
  //   setEditingBOMItem(null);
  // };
  // --- End BOM Action Handlers ---

  const handleBomCreated = (newBom: BOM) => {
    setSelectedBomId(newBom.id.toString()); // Auto-select new BOM
    // currentBOM will be fetched by the useEffect listening to selectedBomId
  };

  const handleBomDataChanged = () => {
    // This function is called when BOM header custom fields change, 
    // or BOM items are added/edited/deleted, or selected BOM name is updated.
    if (selectedBomId) {
      // Re-fetch the current BOM details to get the latest data
      setBomLoading(true);
      fetch(`/api/boms/${selectedBomId}`)
        .then(res => {
          if (!res.ok) {
            // If BOM not found (e.g., deleted then attempted refresh), clear it.
            if (res.status === 404) {
              setCurrentBOM(null);
              // selectedBomId might already be null if deletion was handled by BOMListManager callback
              // but good to be defensive.
              setSelectedBomId(null); 
              return null;
            }
            throw new Error('Failed to re-fetch BOM details');
          }
          return res.json();
        })
        .then((data: GetBOMByIdResponse | null) => {
          setCurrentBOM(data); // data could be null if 404 was handled
          setRefreshBomTrigger(prev => prev + 1); 
        })
        .catch(err => {
          setBomError(err.message);
          setCurrentBOM(null); // Clear BOM on error
        })
        .finally(() => setBomLoading(false));
    } else {
      // If no selectedBomId, ensure currentBOM is also null
      setCurrentBOM(null);
      setRefreshBomTrigger(prev => prev + 1);
    }
  };

  const handleSelectedBomNameUpdated = (updatedBOMData: { id: number; name: string }) => {
    // If the currently selected BOM's name was updated by BOMListManager
    if (currentBOM && currentBOM.id === updatedBOMData.id) {
      // Option 1: Update currentBOM directly with new name (partial update)
      // setCurrentBOM(prev => prev ? { ...prev, name: updatedBOMData.name } : null);
      // Option 2: Re-fetch the full BOM data to ensure consistency (safer)
      handleBomDataChanged();
    }
  };
  
  // BOM Item Form Handlers
  const openAddBOMItemForm = (parentId: number | null) => {
    setCurrentParentItemId(parentId);
    setShowEditItemForm(false); // Ensure edit form is hidden
    setShowAddItemForm(true);
  };

  const openEditBOMItemForm = (item: BOMItem) => {
    setEditingBOMItem(item);
    setShowAddItemForm(false); // Ensure add form is hidden
    setShowEditItemForm(true);
  };
  
  const handleCloseBOMItemForms = () => {
    setShowAddItemForm(false);
    setShowEditItemForm(false);
    setEditingBOMItem(null);
    setCurrentParentItemId(null);
  };

  const handleBOMItemFormSuccess = () => {
    handleCloseBOMItemForms();
    handleBomDataChanged(); // Refresh the BOM data
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
          <h2 className="text-3xl font-bold text-foreground mb-6">Bill of Materials Management</h2>
          
          <BOMListManager 
            pumpId={pumpId} // pumpId is string, BOMListManager expects string
            selectedBomId={selectedBomId}
            onSelectBOM={(bomId) => {
              setSelectedBomId(bomId);
              if (!bomId) setCurrentBOM(null); // Clear currentBOM if deselected
            }}
            onBomCreated={handleBomCreated}
            onBomUpdated={handleSelectedBomNameUpdated}
          />

          {bomLoading && <p className="text-center py-4">Loading BOM details...</p>}
          {bomError && <p className="text-center py-4 text-red-500">Error loading BOM: {bomError}</p>}
          
          {currentBOM && !bomLoading && !bomError && (
            <BOMHeaderDisplay bom={currentBOM} onDataChange={handleBomDataChanged} />
          )}
          
          {/* Forms for Adding/Editing BOM Items - Rendered as Modals or Inline */}
          {/* For simplicity, these could be rendered in a modal structure or a dedicated section */}
          {selectedBomId && (
            <div className="mt-6">
              {showAddItemForm && (
                <div className="my-4 p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-2">Add New BOM Item</h3>
                  <AddBOMItemForm 
                    bomId={selectedBomId} 
                    parentId={currentParentItemId}
                    onBOMItemAdded={handleBOMItemFormSuccess}
                    onCancel={handleCloseBOMItemForms}
                  />
                </div>
              )}
              {showEditItemForm && editingBOMItem && (
                 <div className="my-4 p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-2">Edit BOM Item: {editingBOMItem.partNumber}</h3>
                  <EditBOMItemForm 
                    initialData={editingBOMItem}
                    onBOMItemUpdated={handleBOMItemFormSuccess}
                    onCancel={handleCloseBOMItemForms}
                  />
                </div>
              )}
            </div>
          )}


          {/* Nested BOM View for the selected BOM ID */}
          {selectedBomId && (
            <div className="mt-6 bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
               {/* Button to trigger Add Item form for top-level items in current BOM */}
              {!showAddItemForm && !showEditItemForm && (
                <button 
                  onClick={() => openAddBOMItemForm(null)} 
                  className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Item to this BOM
                </button>
              )}
              <NestedBOMView
                bomId={selectedBomId}
                // Pass down functions to open forms for editing or adding child items
                // NestedBOMView will need to be updated to use these.
                // For now, these are illustrative; NestedBOMView's internal structure might need adjustment.
                onEditItem={openEditBOMItemForm}
                onAddItem={openAddBOMItemForm} // This would be for "Add Child" from within an item
                onDeleteItem={handleBomDataChanged} // After delete, refresh BOM
                key={refreshBomTrigger} // Force re-render/re-fetch if BOM structure changes
              />
            </div>
          )}
          {!selectedBomId && !bomLoading && (
            <p className="mt-6 p-4 text-center text-foreground/70 bg-background rounded-xl shadow-md border border-brandColor1/50">
              Select a BOM from the list above to view its details and items, or create a new BOM.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}