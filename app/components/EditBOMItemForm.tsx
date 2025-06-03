'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';

// Interfaces from previous components (assuming they are accessible or defined here)
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
  // other fields like parentId, pumpModelId etc. are not directly edited here but part of the object
}

// State for custom fields in the form
interface FormCustomField extends BOMCustomFieldData {
  localId: string; // For React key and tracking: 'existing-${db_id}' or 'new-${timestamp}'
  status: 'existing' | 'new' | 'modified' | 'deleted';
}

interface EditBOMItemFormProps {
  initialData: BOMItemData;
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

  useEffect(() => {
    setPartNumber(initialData.partNumber);
    setDescription(initialData.description);
    setQuantity(initialData.quantity);
    setUnit(initialData.unit);
    setSupplier(initialData.supplier || '');
    setCustomFields(
      initialData.customFields.map(cf => ({
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
            const addResponse = await fetch(`/api/bom-items/${initialData.id}/fields`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: field.name, value: field.value }),
            });
            if (!addResponse.ok) throw new Error(`Failed to add new custom field "${field.name}"`);
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

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-lg rounded-lg space-y-6 border border-gray-300">
      <h3 className="text-xl font-semibold text-gray-800">Edit BOM Item: {initialData.partNumber}</h3>

      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md whitespace-pre-line">{error}</div>}
      {successMessage && <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Standard Fields */}
        <div>
          <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-1">Part Number <span className="text-red-500">*</span></label>
          <input type="text" id="partNumber" value={partNumber} onChange={e => setPartNumber(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
          <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
          <input type="text" id="unit" value={unit} onChange={e => setUnit(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <input type="text" id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Custom Fields</h4>
        {customFields.filter(field => field.status !== 'deleted' || !field.localId.startsWith('new-')).map((field) => ( 
          // Do not render 'new' fields that were marked 'deleted'.
          // Render 'existing' fields marked 'deleted' so user sees them as "to be deleted", or style them differently.
          // For simplicity here, we'll just show them, maybe with a strikethrough if status is 'deleted'.
          <div key={field.localId} className={`flex items-center space-x-2 mb-3 p-3 border rounded-md ${field.status === 'deleted' ? 'bg-red-50 opacity-70' : 'bg-gray-50'}`}>
            <input 
              type="text" 
              placeholder="Field Name" 
              value={field.name} 
              onChange={e => handleCustomFieldChange(field.localId, 'name', e.target.value)} 
              className={`w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm ${field.status === 'deleted' ? 'line-through' : ''}`}
              disabled={field.status === 'deleted'}
            />
            <input 
              type="text" 
              placeholder="Field Value" 
              value={field.value} 
              onChange={e => handleCustomFieldChange(field.localId, 'value', e.target.value)} 
              className={`w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm ${field.status === 'deleted' ? 'line-through' : ''}`}
              disabled={field.status === 'deleted'}
            />
            <button 
              type="button" 
              onClick={() => handleRemoveOrMarkCustomField(field.localId)} 
              className={`px-3 py-1 text-white rounded-md text-sm ${field.status === 'deleted' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}`}
              disabled={field.status === 'deleted' && field.localId.startsWith('new-')} // Should not happen due to filter
            >
              {field.status === 'deleted' && field.localId.startsWith('existing-') ? 'Undo' : 'Delete'}
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddCustomField} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
          Add New Custom Field
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50">
          {isLoading ? 'Updating...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditBOMItemForm;
