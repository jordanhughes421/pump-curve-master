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
    return <p className="p-4 text-sm italic text-foreground/70">No BOM selected or BOM data not available.</p>;
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
    <div className="p-4 md:p-6 bg-content-background rounded-lg shadow border border-gray-200 dark:border-gray-700 mt-4">
      <h3 className="text-xl font-semibold text-foreground mb-2">BOM Details: {bom.name}</h3>
      <p className="text-sm text-foreground/90 mb-1"><strong>ID:</strong> {bom.id}</p>
      <p className="text-sm text-foreground/90 mb-1"><strong>Created At:</strong> {new Date(bom.createdAt).toLocaleString()}</p>
      <p className="text-sm text-foreground/90 mb-1"><strong>Last Updated:</strong> {new Date(bom.updatedAt).toLocaleString()}</p>

      <hr className="my-4 md:my-6 border-t border-brandColor1/30"/>
      <h4 className="text-lg font-semibold text-foreground mb-3">Header Custom Fields Management</h4>
      {actionError &&
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm my-4">
          Error: {actionError}
        </div>
      }
      
      {/* Form to Add New Custom Field */}
      <form onSubmit={handleAddNewCustomField} className="mb-6 pb-4 border-b border-brandColor1/50">
        <h5 className="text-md font-semibold text-foreground mb-3">Add New Custom Field</h5>
        <div className="flex flex-wrap sm:flex-nowrap items-start mb-2">
          <input
            type="text"
            placeholder="Field Name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            disabled={isLoading}
            className="w-full sm:w-1/2 px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm mr-0 sm:mr-2 mb-2 sm:mb-0"
          />
          <input
            type="text"
            placeholder="Field Value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            disabled={isLoading}
            className="w-full sm:w-1/2 px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm mr-0 sm:mr-2 mb-2 sm:mb-0"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Adding...' : 'Add Field'}
        </button>
      </form>

      {/* Display Existing Custom Fields */}
      {customFields && customFields.length > 0 ? (
        <ul className="list-none p-0 space-y-3">
          {customFields.map((field) => (
            <li key={field.id} className="p-3 border border-brandColor1/30 rounded-md bg-background dark:bg-zinc-800 shadow-sm">
              {editingField && editingField.id === field.id ? (
                <form onSubmit={handleSaveEditCustomField}>
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={isLoading}
                      className="w-1/3 px-2 py-1.5 bg-background border border-brandColor1/50 rounded-md focus:outline-none focus:ring-1 focus:ring-brandColor2 dark:bg-zinc-700 text-foreground placeholder-foreground/50 text-sm mr-2"
                    />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      disabled={isLoading}
                      className="w-2/3 px-2 py-1.5 bg-background border border-brandColor1/50 rounded-md focus:outline-none focus:ring-1 focus:ring-brandColor2 dark:bg-zinc-700 text-foreground placeholder-foreground/50 text-sm mr-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 mr-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
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
                <div className="flex justify-between items-center">
                  <div className="text-sm text-foreground"> {/* Ensure text styling */}
                    <strong>{field.name}:</strong> {field.value}
                  </div>
                  <div>
                    <button
                      onClick={() => handleEditField(field)}
                      disabled={isLoading}
                      className="px-3 py-1.5 border border-brandColor2/70 text-foreground/90 rounded-md hover:bg-brandColor1/20 focus:outline-none focus:ring-1 focus:ring-brandColor2 transition-colors text-xs font-medium mr-2 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCustomField(field.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 border border-red-500/70 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/70 mt-2">No header custom fields for this BOM.</p>
      )}
    </div>
  );
};

export default BOMHeaderDisplay;
