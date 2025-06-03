'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';

interface CustomFieldEntry {
  id: string; // Unique ID for React key
  name: string;
  value: string;
}

interface AddBOMItemFormProps {
  pumpId: number;
  parentId?: number | null;
  onBOMItemAdded: () => void; // Callback to refresh BOM list
  onCancel?: () => void; // ADD THIS LINE
}

const AddBOMItemForm: React.FC<AddBOMItemFormProps> = ({ pumpId, parentId, onBOMItemAdded, onCancel }) => {
  const [partNumber, setPartNumber] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | string>(''); // Allow string for input flexibility
  const [unit, setUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldEntry[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { id: `cf-${Date.now()}`, name: '', value: '' }]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const handleCustomFieldChange = (id: string, fieldName: 'name' | 'value', fieldValue: string) => {
    setCustomFields(
      customFields.map(field =>
        field.id === id ? { ...field, [fieldName]: fieldValue } : field
      )
    );
  };

  const clearForm = () => {
    setPartNumber('');
    setDescription('');
    setQuantity('');
    setUnit('');
    setSupplier('');
    setCustomFields([]);
    setError(null);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!partNumber || !description || quantity === '' || !unit) {
      setError('Please fill in all required fields: Part Number, Description, Quantity, Unit.');
      setIsLoading(false);
      return;
    }
    
    const finalQuantity = Number(quantity);
    if (isNaN(finalQuantity) || finalQuantity <= 0) {
        setError('Quantity must be a positive number.');
        setIsLoading(false);
        return;
    }

    const bomItemData: any = {
      partNumber,
      description,
      quantity: finalQuantity,
      unit,
      supplier: supplier || null,
      pumpModelId: pumpId, 
    };

    if (parentId) {
      bomItemData.parentId = parentId;
    }
    
    // Note: Custom fields are not part of the BOMItem creation directly through this endpoint.
    // They would typically be added *after* the BOMItem is created, via /api/bom-items/[bomItemId]/fields
    // For now, this form collects them, but the API call below doesn't send them.
    // This would be a point of enhancement if the API supported nested creation.

    try {
      // The API endpoint is always /api/pumps/[pumpId]/bom for adding items,
      // with parentId in the body distinguishing child items.
      const response = await fetch(`/api/pumps/${pumpId}/bom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add BOM item: ${response.statusText}`);
      }

      const newBOMItem = await response.json();
      setSuccessMessage(`BOM Item "${newBOMItem.partNumber}" added successfully!`);
      
      // If custom fields were collected and need to be added, this is where you'd loop and make calls:
      // for (const cf of customFields) {
      //   if (cf.name && cf.value) { // only send if both name and value are present
      //     await fetch(`/api/bom-items/${newBOMItem.id}/fields`, { /* ... POST cf data ... */});
      //   }
      // }
      // This part is commented out as it requires sequential API calls and more robust error handling.

      let allCustomFieldsAddedSuccessfully = true;
      const customFieldErrors: string[] = [];

      if (customFields.length > 0) {
        for (const cf of customFields) {
          if (cf.name && cf.value) { // Only send if both name and value are present
            try {
              const cfResponse = await fetch(`/api/bom-items/${newBOMItem.id}/fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: cf.name, value: cf.value }),
              });
              if (!cfResponse.ok) {
                const cfErrorData = await cfResponse.json();
                allCustomFieldsAddedSuccessfully = false;
                customFieldErrors.push(`Custom field "${cf.name}": ${cfErrorData.error || cfResponse.statusText}`);
              }
            } catch (cfErr: any) {
              allCustomFieldsAddedSuccessfully = false;
              customFieldErrors.push(`Custom field "${cf.name}": ${cfErr.message || 'Network error'}`);
            }
          }
        }
      }

      if (allCustomFieldsAddedSuccessfully) {
        setSuccessMessage(`BOM Item "${newBOMItem.partNumber}" and all custom fields added successfully!`);
        clearForm();
        onBOMItemAdded(); // Trigger refresh only if everything succeeded
      } else {
        // Main BOM item was created, but some/all custom fields failed
        setError(
          `BOM Item "${newBOMItem.partNumber}" was created, but some custom fields failed to save:\n- ${customFieldErrors.join('\n- ')}`
        );
        // Do not clear the form, so user can see custom field values and potentially retry or note them.
        // Optionally, still call onBOMItemAdded() if partial success is acceptable for refresh.
        // Based on prompt, onBOMItemAdded is only for full success.
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during BOM item submission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg space-y-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800">
        {parentId ? 'Add New Sub-Item' : 'Add New BOM Item'}
      </h3>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md whitespace-pre-line">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-2">Custom Fields (will be added after item creation)</h4>
        {customFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 mb-3 p-3 border rounded-md bg-gray-50">
            <input type="text" placeholder="Field Name" value={field.name} onChange={e => handleCustomFieldChange(field.id, 'name', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"/>
            <input type="text" placeholder="Field Value" value={field.value} onChange={e => handleCustomFieldChange(field.id, 'value', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"/>
            <button type="button" onClick={() => handleRemoveCustomField(field.id)} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">Remove</button>
          </div>
        ))}
        <button type="button" onClick={handleAddCustomField} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
          Add Custom Field
        </button>
      </div>

      <div className="flex justify-end space-x-3 pt-4"> {/* Added space-x-3 for button spacing */}
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : (parentId ? 'Add Sub-Item' : 'Add BOM Item')}
        </button>
      </div>
    </form>
  );
};

export default AddBOMItemForm;
