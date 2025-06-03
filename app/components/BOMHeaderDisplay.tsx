'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { BOM, BOMHeaderCustomField, ApiError } from '@/lib/types';

interface BOMHeaderDisplayProps {
  bom: BOM | null;
  onDataChange?: () => void; // Callback to notify parent that BOM data (e.g. custom fields) changed
}

const BOMHeaderDisplay: React.FC<BOMHeaderDisplayProps> = ({ bom, onDataChange }) => {
  const [customFields, setCustomFields] = useState<BOMHeaderCustomField[]>([]);
  
  // State for adding a new custom field
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  // State for editing a custom field
  const [editingField, setEditingField] = useState<BOMHeaderCustomField | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // For specific add/edit/delete errors

  useEffect(() => {
    if (bom) {
      setCustomFields(bom.customFields || []);
    } else {
      setCustomFields([]);
    }
    setEditingField(null); // Reset editing state when BOM changes
    setError(null);
    setActionError(null);
  }, [bom]);

  if (!bom) {
    return <p style={{ fontStyle: 'italic' }}>No BOM selected or BOM data not available.</p>;
  }

  const handleAddNewCustomField = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldValue.trim()) {
      setActionError('Field name and value cannot be empty.');
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/boms/${bom.id}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFieldName, value: newFieldValue }),
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || 'Failed to add custom field');
      }
      setNewFieldName('');
      setNewFieldValue('');
      onDataChange?.(); // Notify parent
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditField = (field: BOMHeaderCustomField) => {
    setEditingField(field);
    setEditName(field.name);
    setEditValue(field.value);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditName('');
    setEditValue('');
  };

  const handleSaveEditCustomField = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingField || !editName.trim() || !editValue.trim()) {
      setActionError('Field name and value cannot be empty for editing.');
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/boms/${bom.id}/custom-fields/${editingField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, value: editValue }),
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || 'Failed to update custom field');
      }
      setEditingField(null);
      onDataChange?.(); // Notify parent
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomField = async (fieldId: number) => {
    if (!window.confirm('Are you sure you want to delete this custom field?')) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/boms/${bom.id}/custom-fields/${fieldId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData: ApiError = await response.json();
        throw new Error(errData.error || 'Failed to delete custom field');
      }
      onDataChange?.(); // Notify parent
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ border: '1px solid #eee', padding: '15px', marginTop: '10px', backgroundColor: '#f9f9f9' }}>
      <h3>BOM Details: {bom.name}</h3>
      <p><strong>ID:</strong> {bom.id}</p>
      <p><strong>Created At:</strong> {new Date(bom.createdAt).toLocaleString()}</p>
      <p><strong>Last Updated:</strong> {new Date(bom.updatedAt).toLocaleString()}</p>

      <hr style={{ margin: '15px 0' }}/>
      <h4>Header Custom Fields Management</h4>
      {actionError && <p style={{ color: 'red' }}>Error: {actionError}</p>}
      
      {/* Form to Add New Custom Field */}
      <form onSubmit={handleAddNewCustomField} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
        <h5>Add New Custom Field</h5>
        <input 
          type="text" 
          placeholder="Field Name" 
          value={newFieldName} 
          onChange={(e) => setNewFieldName(e.target.value)} 
          disabled={isLoading}
          style={{ marginRight: '5px', padding: '5px' }}
        />
        <input 
          type="text" 
          placeholder="Field Value" 
          value={newFieldValue} 
          onChange={(e) => setNewFieldValue(e.target.value)} 
          disabled={isLoading}
          style={{ marginRight: '5px', padding: '5px' }}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '5px 10px' }}>
          {isLoading ? 'Adding...' : 'Add Field'}
        </button>
      </form>

      {/* Display Existing Custom Fields */}
      {customFields && customFields.length > 0 ? (
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {customFields.map((field) => (
            <li key={field.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', backgroundColor: '#fff' }}>
              {editingField && editingField.id === field.id ? (
                <form onSubmit={handleSaveEditCustomField}>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    disabled={isLoading}
                    style={{ marginRight: '5px', padding: '5px', width: '30%' }}
                  />
                  <input 
                    type="text" 
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)} 
                    disabled={isLoading}
                    style={{ marginRight: '5px', padding: '5px', width: '40%' }}
                  />
                  <button type="submit" disabled={isLoading} style={{ padding: '5px 10px', marginRight: '5px' }}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={handleCancelEdit} disabled={isLoading} style={{ padding: '5px 10px' }}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{field.name}:</strong> {field.value}
                  </div>
                  <div>
                    <button onClick={() => handleEditField(field)} disabled={isLoading} style={{ marginRight: '5px', padding: '3px 7px' }}>Edit</button>
                    <button onClick={() => handleDeleteCustomField(field.id)} disabled={isLoading} style={{ padding: '3px 7px' }}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No header custom fields for this BOM.</p>
      )}
    </div>
  );
};

export default BOMHeaderDisplay;
