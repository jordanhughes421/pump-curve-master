'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';

interface CustomFieldEntry {
  id: string; // Unique ID for React key
  name: string;
  value: string;
}

interface AddBOMItemFormProps {
  bomId: string; // Changed from pumpId to bomId
  parentId?: number | null;
  onBOMItemAdded: () => void; // Callback to refresh BOM list
  onCancel?: () => void;
}

const AddBOMItemForm: React.FC<AddBOMItemFormProps> = ({ bomId, parentId, onBOMItemAdded, onCancel }) => {
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
      // bomId is now part of the URL, not the payload directly for item creation
    };

    if (parentId !== undefined && parentId !== null) { // Ensure parentId is explicitly checked
      bomItemData.parentId = parentId;
    }
    
    // Note: Custom fields are not part of the BOMItem creation directly through this endpoint.
    // They would typically be added *after* the BOMItem is created, via /api/bom-items/[bomItemId]/fields
    // For now, this form collects them, but the API call below doesn't send them directly.
    // This would be a point of enhancement if the API supported nested creation for custom fields.

    try {
      // API endpoint changed to /api/boms/[bomId]/items
      const response = await fetch(`/api/boms/${bomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add BOM item: ${response.statusText}`);
      }

      const newBOMItem = await response.json();
      // Success message for the main item will be set after custom fields are processed.
      
      let allCustomFieldsAddedSuccessfully = true;
      const customFieldErrors: string[] = [];

      if (customFields.length > 0 && newBOMItem && newBOMItem.id) {
        for (const cf of customFields) {
          if (cf.name && cf.value) { // Only send if both name and value are present
            try {
              // Corrected API endpoint for adding custom fields to a BOM item
              const cfResponse = await fetch(`/api/bom-items/${newBOMItem.id}/custom-fields`, {
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
    <form data-testid="add-bom-item-form" onSubmit={handleSubmit} className="p-6 bg-background shadow-lg rounded-xl border border-brandColor1/50 dark:border-brandColor2/70 space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        {parentId ? 'Add New Sub-Item' : 'Add New BOM Item'}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm whitespace-pre-line">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="pt-4 border-t border-brandColor1/30 dark:border-brandColor2/50">
        <h4 className="text-md font-semibold text-foreground/90 mb-3 border-b border-brandColor1/30 dark:border-brandColor2/50 pb-2">Custom Fields (will be added after item creation)</h4>
        {customFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 mb-3 p-3 border rounded-md border-brandColor1/40 dark:border-brandColor2/50">
            <input type="text" placeholder="Field Name" value={field.name} onChange={e => handleCustomFieldChange(field.id, 'name', e.target.value)} className="w-full px-3 py-2 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
            <input type="text" placeholder="Field Value" value={field.value} onChange={e => handleCustomFieldChange(field.id, 'value', e.target.value)} className="w-full px-3 py-2 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"/>
            <button type="button" onClick={() => handleRemoveCustomField(field.id)} className="px-3 py-1.5 text-xs text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-500/50 rounded-md transition-colors">Remove</button>
          </div>
        ))}
        <button type="button" onClick={handleAddCustomField} className="mt-2 px-4 py-2 border border-green-500/50 text-green-700 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-700/20 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm font-medium rounded-lg">
          Add Custom Field
        </button>
      </div>

      <div className="flex justify-end space-x-3 pt-4"> {/* Added space-x-3 for button spacing */}
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-2.5 border border-brandColor1/50 text-foreground/80 rounded-lg hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 focus:outline-none focus:ring-2 focus:ring-brandColor2 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="px-6 py-2.5 flex items-center justify-center border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Adding...' : (parentId ? 'Add Sub-Item' : 'Add BOM Item')}
        </button>
      </div>
    </form>
  );
};

export default AddBOMItemForm;
