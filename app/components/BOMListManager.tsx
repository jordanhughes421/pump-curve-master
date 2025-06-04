'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { BOM, CreateBOMPayload, GetBOMsResponse, ApiError } from '@/lib/types';

// Update props to include onBomUpdated
export interface BOMListManagerProps {
  pumpId: string;
  onSelectBOM: (bomId: string | null) => void;
  selectedBomId: string | null;
  onBomCreated: (newBom: BOM) => void;
  onBomUpdated?: (updatedBOMData: { id: number; name: string }) => void; // Callback for when a BOM name is updated
  // onBomDeleted is implicitly handled by onSelectBOM(null) if selected is deleted.
}


const BOMListManager: React.FC<BOMListManagerProps> = ({ pumpId, onSelectBOM, selectedBomId, onBomCreated, onBomUpdated }) => {
  const [boms, setBoms] = useState<Pick<BOM, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // For errors on specific actions like edit/delete

  // Create new BOM
  const [newBomName, setNewBomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit BOM
  const [editingBomId, setEditingBomId] = useState<number | null>(null);
  const [editingBomName, setEditingBomName] = useState('');


  const fetchBOMs = useCallback(async (selectBomIdAfterFetch?: string | null) => {
    if (!pumpId) return;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      const response = await fetch(`/api/pumps/${pumpId}/boms`);
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `Failed to fetch BOMs: ${response.statusText}`);
      }
      const data: GetBOMsResponse = await response.json();
      setBoms(data.map(bom => ({ id: bom.id, name: bom.name })));

      if (selectBomIdAfterFetch !== undefined) {
        onSelectBOM(selectBomIdAfterFetch);
      }

    } catch (err: any) {
      setError(err.message);
      setBoms([]); // Clear boms on error
    } finally {
      setIsLoading(false);
    }
  }, [pumpId, onSelectBOM]);

  useEffect(() => {
    fetchBOMs();
  }, [fetchBOMs]);

  const handleCreateBOM = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBomName.trim()) {
      setActionError('BOM name cannot be empty.');
      return;
    }
    setIsCreating(true);
    setActionError(null);
    try {
      const payload: CreateBOMPayload = { name: newBomName };
      const response = await fetch(`/api/pumps/${pumpId}/boms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `Failed to create BOM: ${response.statusText}`);
      }
      const newBom: BOM = await response.json();
      setNewBomName('');
      await fetchBOMs(newBom.id.toString()); // Refresh list and select new BOM
      onBomCreated(newBom); 
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditBom = (bom: Pick<BOM, 'id' | 'name'>) => {
    setEditingBomId(bom.id);
    setEditingBomName(bom.name);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingBomId(null);
    setEditingBomName('');
  };

  const handleSaveBomName = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBomId || !editingBomName.trim()) {
      setActionError('BOM name cannot be empty for editing.');
      return;
    }
    setIsLoading(true); // Use general loading for this action too
    setActionError(null);
    try {
      const response = await fetch(`/api/boms/${editingBomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingBomName }),
      });
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to update BOM name');
      }
      const updatedBomData = await response.json();
      setEditingBomId(null);
      setEditingBomName('');
      await fetchBOMs(selectedBomId); // Refresh list, keep current selection if possible
      if (onBomUpdated && updatedBomData.id.toString() === selectedBomId) {
        onBomUpdated({ id: updatedBomData.id, name: updatedBomData.name });
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBom = async (bomToDeleteId: number) => {
    if (!window.confirm(`Are you sure you want to delete BOM ID ${bomToDeleteId}? This will delete the BOM and all its items.`)) {
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/boms/${bomToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to delete BOM');
      }
      // If the deleted BOM was selected, deselect it. Otherwise, keep current selection.
      const newSelectedBomId = selectedBomId === bomToDeleteId.toString() ? null : selectedBomId;
      await fetchBOMs(newSelectedBomId);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // General status messages styling
  // Show loading only if no boms and no initial error
  if (isLoading && boms.length === 0 && !error) return <p className="text-sm text-foreground/70 mt-4">Loading BOMs...</p>;
  // Show initial load error prominently
  if (error) return <p className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm my-4">Error loading BOMs: {error}</p>;

  return (
    <div className="p-4 md:p-6 bg-content-background text-foreground rounded-lg shadow border border-gray-200 dark:border-zinc-700 mb-6">
      <h4 className="text-xl font-semibold text-foreground mb-4">Bill of Materials Management</h4>
      
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm my-4">
          Action Error: {actionError}
        </div>
      )}

      <form onSubmit={handleCreateBOM} className="mb-6 pb-4 border-b border-brandColor1/50">
        <input
          type="text"
          value={newBomName}
          onChange={(e) => setNewBomName(e.target.value)}
          placeholder="New BOM Name"
          disabled={isCreating || isLoading}
          className="w-full sm:w-auto px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground dark:placeholder-foreground/60 placeholder-foreground/50 text-sm mr-2 mb-2 sm:mb-0"
        />
        <button
          type="submit"
          disabled={isCreating || isLoading}
          className="px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:bg-brandColor5 dark:hover:bg-brandColor4 dark:text-background dark:focus:ring-offset-background transition-colors disabled:opacity-60"
        >
          {isCreating ? 'Creating...' : 'Create New BOM'}
        </button>
      </form>

      {/* Loading/Status Messages: consistent styling */}
      {boms.length === 0 && !isLoading && <p className="text-sm text-foreground/70 mt-4">No BOMs found for this pump. Create one above.</p>}
      
      {boms.length > 0 && (
        <ul className="list-none p-0 space-y-2">
          {boms.map((bom) => (
            <li
              key={bom.id}
              className="p-3 border border-brandColor1/30 rounded-md flex justify-between items-center hover:bg-brandColor1/10 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:text-foreground transition-colors"
            >
              {editingBomId === bom.id ? (
                <form onSubmit={handleSaveBomName} className="flex items-center w-full">
                  <input 
                    type="text" 
                    value={editingBomName} 
                    onChange={(e) => setEditingBomName(e.target.value)}
                    disabled={isLoading} 
                    className="flex-grow px-2 py-1.5 bg-background border border-brandColor1/50 rounded-md focus:outline-none focus:ring-1 focus:ring-brandColor2 dark:bg-zinc-700 text-foreground dark:placeholder-foreground/60 placeholder-foreground/50 text-sm mr-2"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 mr-2 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span 
                    onClick={() => onSelectBOM(bom.id.toString())} 
                    className={`cursor-pointer dark:text-foreground ${selectedBomId === bom.id.toString() ? 'font-bold' : 'font-normal'}`}
                  >
                    {bom.name} (ID: {bom.id})
                  </span>
                  <div>
                    <button
                      onClick={() => handleEditBom(bom)}
                      disabled={isLoading}
                      className="px-3 py-1.5 border border-brandColor2/70 text-foreground/90 rounded-md hover:bg-brandColor1/20 focus:outline-none focus:ring-1 focus:ring-brandColor2 dark:text-foreground/90 dark:border-zinc-600 dark:hover:bg-zinc-700 transition-colors text-xs font-medium mr-2 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBom(bom.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 border border-red-500/70 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-500/70 dark:hover:bg-red-500/20 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Loading/Status Messages: consistent styling */}
      {isLoading && boms.length > 0 && <p className="text-sm text-foreground/70 mt-4">Processing...</p>}
    </div>
  );
};

export default BOMListManager;
