'use client';

import React, { useState, useEffect, FormEvent } from 'react';
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


  const fetchBOMs = async (selectBomIdAfterFetch?: string | null) => {
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
  };

  useEffect(() => {
    fetchBOMs();
  }, [pumpId]);

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

  if (isLoading && boms.length === 0 && !error) return <p>Loading BOMs...</p>; // Show loading only if no boms and no initial error
  if (error) return <p className="text-red-500">Error loading BOMs: {error}</p>; // Show initial load error prominently

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
      <h4>Bill of Materials Management</h4>
      
      {actionError && <p style={{ color: 'red', margin: '10px 0' }}>Action Error: {actionError}</p>}

      <form onSubmit={handleCreateBOM} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
        <input
          type="text"
          value={newBomName}
          onChange={(e) => setNewBomName(e.target.value)}
          placeholder="New BOM Name"
          disabled={isCreating || isLoading}
          style={{ marginRight: '5px', padding: '5px' }}
        />
        <button type="submit" disabled={isCreating || isLoading} style={{ padding: '5px 10px' }}>
          {isCreating ? 'Creating...' : 'Create New BOM'}
        </button>
      </form>

      {boms.length === 0 && !isLoading && <p>No BOMs found for this pump. Create one above.</p>}
      
      {boms.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {boms.map((bom) => (
            <li key={bom.id} style={{ marginBottom: '5px', padding: '5px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingBomId === bom.id ? (
                <form onSubmit={handleSaveBomName} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input 
                    type="text" 
                    value={editingBomName} 
                    onChange={(e) => setEditingBomName(e.target.value)}
                    disabled={isLoading} 
                    style={{ flexGrow: 1, marginRight: '5px', padding: '3px' }}
                    autoFocus
                  />
                  <button type="submit" disabled={isLoading} style={{ padding: '3px 7px', marginRight: '5px', backgroundColor: 'lightgreen' }}>Save</button>
                  <button type="button" onClick={handleCancelEdit} disabled={isLoading} style={{ padding: '3px 7px', backgroundColor: 'lightcoral' }}>Cancel</button>
                </form>
              ) : (
                <>
                  <span 
                    onClick={() => onSelectBOM(bom.id.toString())} 
                    style={{ cursor: 'pointer', fontWeight: selectedBomId === bom.id.toString() ? 'bold' : 'normal' }}
                  >
                    {bom.name} (ID: {bom.id})
                  </span>
                  <div>
                    <button onClick={() => handleEditBom(bom)} disabled={isLoading} style={{ marginRight: '5px', padding: '3px 7px' }}>Edit</button>
                    <button onClick={() => handleDeleteBom(bom.id)} disabled={isLoading} style={{ padding: '3px 7px', color: 'red' }}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {isLoading && boms.length > 0 && <p>Processing...</p>} 
    </div>
  );
};

export default BOMListManager;
