'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { BOMItem, BOMItemCustomField } from '@/lib/types'; // Using shared types

// State for custom fields in the form
interface FormCustomField extends BOMItemCustomField { // Extends shared BOMItemCustomField
  localId: string; // For React key and tracking: 'existing-${db_id}' or 'new-${timestamp}'
  status: 'existing' | 'new' | 'modified' | 'deleted';
}

interface EditBOMItemFormProps {
  initialData: BOMItem; // Use shared BOMItem type
  onBOMItemUpdated: () => void;
  onCancel: () => void;
}

const EditBOMItemForm: React.FC<EditBOMItemFormProps> = ({ initialData, onBOMItemUpdated, onCancel }) => {
  const [partNumber, setPartNumber] = useState(initialData.partNumber);
  const [description, setDescription] = useState(initialData.description);
  const [quantity, setQuantity] = useState<number | string>(initialData.quantity);
  const [unit, setUnit] = useState(initialData.unit);
  const [supplier, setSupplier] = useState(initialData.supplier || '');
  
  const [customFields, setCustomFields] = useState<FormCustomField[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingAsStandardPart, setIsSavingAsStandardPart] = useState(false);


  useEffect(() => {
    setPartNumber(initialData.partNumber);
    setDescription(initialData.description);
    setQuantity(initialData.quantity);
    setUnit(initialData.unit);
    setSupplier(initialData.supplier || '');
    setCustomFields(
      (initialData.customFields || []).map(cf => ({
        ...cf,
        localId: `existing-${cf.id}`,
        status: 'existing',
      }))
    );
  }, [initialData]);

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: 0, localId: `new-${Date.now()}`, name: '', value: '', status: 'new' }, // id is 0 for new, will be assigned by DB
    ]);
  };

  const handleCustomFieldChange = (localId: string, fieldName: 'name' | 'value', fieldValue: string) => {
    setCustomFields(
      customFields.map(field => {
        if (field.localId === localId) {
          return {
            ...field,
            [fieldName]: fieldValue,
            status: field.status === 'existing' ? 'modified' : field.status, // if 'new', remains 'new', if 'deleted' remains 'deleted'
          };
        }
        return field;
      })
    );
  };

  const handleRemoveOrMarkCustomField = (localId: string) => {
    setCustomFields(prevFields =>
      prevFields.map(field => {
        if (field.localId === localId) {
          if (field.status === 'new') {
            return { ...field, status: 'deleted', _toRemoveFromUI: true } as any; // Mark for filtering out
          }
          return { ...field, status: 'deleted' };
        }
        return field;
      }).filter(field => !(field as any)._toRemoveFromUI) // Actually remove 'new' fields marked for deletion
    );
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!partNumber || !description || quantity === '' || !unit) {
      setError('Please fill in all required BOM item fields: Part Number, Description, Quantity, Unit.');
      setIsLoading(false);
      return;
    }
    const finalQuantity = Number(quantity);
    if (isNaN(finalQuantity) || finalQuantity <= 0) {
        setError('Quantity must be a positive number.');
        setIsLoading(false);
        return;
    }

    const bomItemUpdateData = { partNumber, description, quantity: finalQuantity, unit, supplier };
    let overallSuccess = true;
    const processErrors: string[] = [];

    try {
      // 1. Update Main BOM Item
      const bomItemResponse = await fetch(`/api/bom-items/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomItemUpdateData),
      });

      if (!bomItemResponse.ok) {
        const errorData = await bomItemResponse.json();
        throw new Error(`Failed to update BOM item: ${errorData.error || bomItemResponse.statusText}`);
      }

      // 2. Process Custom Fields
      for (const field of customFields) {
        try {
          if (field.status === 'new' && field.name && field.value) {
            // Corrected API endpoint for adding new custom fields
            const addResponse = await fetch(`/api/bom-items/${initialData.id}/custom-fields`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: field.name, value: field.value }),
            });
            if (!addResponse.ok) {
                const errorData = await addResponse.json();
                throw new Error(`Failed to add new custom field "${field.name}": ${errorData.error || addResponse.statusText}`);
            }
          } else if (field.status === 'modified') {
            const updateResponse = await fetch(`/api/bom-custom-fields/${field.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: field.name, value: field.value }),
            });
            if (!updateResponse.ok) throw new Error(`Failed to update custom field "${field.name}" (ID: ${field.id})`);
          } else if (field.status === 'deleted' && field.localId.startsWith('existing-')) { // Only delete if it was an existing field
            const deleteResponse = await fetch(`/api/bom-custom-fields/${field.id}`, {
              method: 'DELETE',
            });
            if (!deleteResponse.ok) throw new Error(`Failed to delete custom field "${field.name}" (ID: ${field.id})`);
          }
        } catch (cfError: any) {
          overallSuccess = false;
          processErrors.push(cfError.message);
        }
      }

      if (overallSuccess) {
        setSuccessMessage('BOM Item and custom fields updated successfully!');
        onBOMItemUpdated(); // Trigger refresh / close modal etc.
      } else {
        setError(`BOM item updated, but some custom field operations failed:\n- ${processErrors.join('\n- ')}`);
      }

    } catch (err: any) {
      overallSuccess = false;
      setError(err.message || 'An unknown error occurred during submission.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsStandardPart = async () => {
    setIsSavingAsStandardPart(true);
    setError(null); // Clear previous errors
    setSuccessMessage(null);

    const standardPartData = {
      partNumber: partNumber,
      description: description,
      defaultUnit: unit, // BOMItem 'unit' becomes StandardPart 'defaultUnit'
      defaultSupplier: supplier || null,
      // parentId is not set here, this creates a new top-level standard part.
      // Could add a selector for parentId if needed.
    };

    try {
      const response = await fetch('/api/standard-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(standardPartData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save as new Standard Part');
      }
      const newStandardPart = await response.json();
      setSuccessMessage(`Item saved as new Standard Part: ${newStandardPart.partNumber} (ID: ${newStandardPart.id})`);
      // Optionally, link this BOMItem to the new StandardPart by updating the BOMItem's standardPartId
      // This would require another API call to PUT /api/bom-items/[initialData.id]
      // For now, just creating the standard part.
    } catch (err: any) {
      setError(`Error saving as Standard Part: ${err.message}`);
    } finally {
      setIsSavingAsStandardPart(false);
    }
  };


  return (
    <form data-testid="edit-bom-item-form" onSubmit={handleSubmit} className="p-6 bg-background shadow-lg rounded-xl border border-brandColor1/50 dark:border-brandColor2/70 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Edit BOM Item: {initialData.partNumber}</h3>
        {!initialData.standardPartId && ( // Only show if not already linked to a standard part
            <button
            type="button"
            onClick={handleSaveAsStandardPart}
            disabled={isSavingAsStandardPart || isLoading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
            {isSavingAsStandardPart ? 'Saving as SP...' : 'Save as New Standard Part'}
            </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm whitespace-pre-line">{error}</div>}
      {successMessage && <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Standard Fields */}
        <div>
          <label htmlFor="partNumber" className="block text-sm font-medium text-foreground/80 mb-1">Part Number <span className="text-red-500">*</span></label>
          <input type="text" id="partNumber" value={partNumber} onChange={e => setPartNumber(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground/80 mb-1">Description <span className="text-red-500">*</span></label>
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-foreground/80 mb-1">Quantity <span className="text-red-500">*</span></label>
          <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-foreground/80 mb-1">Unit <span className="text-red-500">*</span></label>
          <input type="text" id="unit" value={unit} onChange={e => setUnit(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="supplier" className="block text-sm font-medium text-foreground/80 mb-1">Supplier</label>
          <input type="text" id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="pt-4 border-t border-brandColor1/30 dark:border-brandColor2/50">
        <h4 className="text-md font-semibold text-foreground/90 mb-3 border-b border-brandColor1/30 dark:border-brandColor2/50 pb-2">Custom Fields</h4>
        {customFields.filter(field => field.status !== 'deleted' || !field.localId.startsWith('new-')).map((field) => ( 
          // Do not render 'new' fields that were marked 'deleted'.
          // Render 'existing' fields marked 'deleted' so user sees them as "to be deleted", or style them differently.
          // For simplicity here, we'll just show them, maybe with a strikethrough if status is 'deleted'.
          <div key={field.localId} className={`flex items-center space-x-2 mb-3 p-3 border rounded-md ${field.status === 'deleted' ? 'bg-red-50 opacity-70 dark:bg-red-900/40 dark:border-red-700/60' : 'border-brandColor1/40 dark:border-brandColor2/50'}`}>
            <input 
              type="text" 
              placeholder="Field Name" 
              value={field.name} 
              onChange={e => handleCustomFieldChange(field.localId, 'name', e.target.value)} 
              className={`w-full px-3 py-2 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm ${field.status === 'deleted' ? 'line-through' : ''}`}
              disabled={field.status === 'deleted'}
            />
            <input 
              type="text" 
              placeholder="Field Value" 
              value={field.value} 
              onChange={e => handleCustomFieldChange(field.localId, 'value', e.target.value)} 
              className={`w-full px-3 py-2 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm ${field.status === 'deleted' ? 'line-through' : ''}`}
              disabled={field.status === 'deleted'}
            />
            <button 
              type="button" 
              onClick={() => handleRemoveOrMarkCustomField(field.localId)} 
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                field.status === 'deleted' 
                  ? 'text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 border border-yellow-500/50' 
                  : 'text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-500/50'
              }`}
              disabled={field.status === 'deleted' && field.localId.startsWith('new-')} // Should not happen due to filter
            >
              {field.status === 'deleted' && field.localId.startsWith('existing-') ? 'Undo' : 'Delete'}
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddCustomField} className="mt-2 px-4 py-2 border border-green-500/50 text-green-700 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-700/20 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm font-medium rounded-lg">
          Add New Custom Field
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-brandColor1/50 text-foreground/80 rounded-lg hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 focus:outline-none focus:ring-2 focus:ring-brandColor2 transition-colors text-sm font-medium">
          Cancel
        </button>
        <button
            type="submit"
            disabled={isLoading || isSavingAsStandardPart}
            className="px-6 py-2.5 flex items-center justify-center border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Updating...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditBOMItemForm;
