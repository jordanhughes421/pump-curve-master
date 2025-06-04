'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { StandardPart } from '@/lib/types'; // Assuming types are here
import StandardPartSelectionModal from './StandardPartSelectionModal'; // Import the modal

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

  // Standard Part States
  const [standardParts, setStandardParts] = useState<StandardPart[]>([]);
  const [selectedStandardPartId, setSelectedStandardPartId] = useState<number | null>(null);
  const [selectedStandardPartChildren, setSelectedStandardPartChildren] = useState<StandardPart[] | undefined>(undefined);
  const [saveToCatalog, setSaveToCatalog] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFetchingStandardParts, setIsFetchingStandardParts] = useState<boolean>(false);


  useEffect(() => {
    const fetchStdParts = async () => {
      setIsFetchingStandardParts(true);
      try {
        const response = await fetch('/api/standard-parts');
        if (!response.ok) throw new Error('Failed to fetch standard parts');
        const data: StandardPart[] = await response.json();
        setStandardParts(data);
      } catch (err) {
        console.error("Error fetching standard parts for form:", err);
        // setError('Could not load standard parts list.'); // Optional: set an error for display
      } finally {
        setIsFetchingStandardParts(false);
      }
    };
    fetchStdParts();
  }, []);

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
    setSelectedStandardPartId(null);
    setSelectedStandardPartChildren(undefined);
    setSaveToCatalog(false);
    setError(null);
  }

  const handleStandardPartSelect = (part: StandardPart) => {
    setPartNumber(part.partNumber);
    setDescription(part.description);
    setUnit(part.defaultUnit);
    setSupplier(part.defaultSupplier || '');
    setSelectedStandardPartId(part.id);
    // Fetch full details if it's an assembly and children are needed for recursive add
    // For now, children are directly available from the part object if API provides them
    setSelectedStandardPartChildren(part.children);
    setSaveToCatalog(false); // Don't re-save an existing part by default
    setIsModalOpen(false);
  };

  // Recursive function to add standard part assembly to BOM
  const addStandardPartAssemblyToBOM = async (
    spAssembly: StandardPart,
    currentBomId: string,
    currentParentBOMItemId: number | null
  ): Promise<{ success: boolean; newItemId?: number; error?: string }> => {
    const bomItemPayload = {
      partNumber: spAssembly.partNumber,
      description: spAssembly.description,
      quantity: 1, // Default to 1 for assembly components, or make this configurable
      unit: spAssembly.defaultUnit,
      supplier: spAssembly.defaultSupplier || null,
      standardPartId: spAssembly.id,
      parentId: currentParentBOMItemId,
    };

    try {
      const res = await fetch(`/api/boms/${currentBomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bomItemPayload),
      });
      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: `Failed to add ${spAssembly.partNumber}: ${errData.error || res.statusText}` };
      }
      const newBOMItem = await res.json();

      if (spAssembly.children && spAssembly.children.length > 0) {
        for (const childSp of spAssembly.children) {
          const childResult = await addStandardPartAssemblyToBOM(childSp, currentBomId, newBOMItem.id);
          if (!childResult.success) {
            // If any child fails, we might want to roll back or at least report the specific failure.
            // For now, we stop and return the error.
            return { success: false, error: `Failed to add child ${childSp.partNumber}: ${childResult.error}` };
          }
        }
      }
      return { success: true, newItemId: newBOMItem.id };
    } catch (err: any) {
      return { success: false, error: `Exception while adding ${spAssembly.partNumber}: ${err.message}` };
    }
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!partNumber || !description || (selectedStandardPartId === null && quantity === '') || !unit) {
      setError('Please fill in all required fields: Part Number, Description, Quantity (if not from catalog), Unit.');
      setIsLoading(false);
      return;
    }
    
    const finalQuantity = Number(quantity);
    if (selectedStandardPartId === null && (isNaN(finalQuantity) || finalQuantity <= 0)) {
        setError('Quantity must be a positive number when not adding from catalog or if item is not an assembly.');
        setIsLoading(false);
        return;
    }

    // If a standard part assembly is selected and it has children, use the recursive add
    if (selectedStandardPartId && selectedStandardPartChildren && selectedStandardPartChildren.length > 0) {
        const rootSp = standardParts.find(p => p.id === selectedStandardPartId);
        if (rootSp) {
            const result = await addStandardPartAssemblyToBOM(rootSp, bomId, parentId ?? null);
            if (result.success) {
                setSuccessMessage(`Standard Part Assembly "${rootSp.partNumber}" and its children added successfully!`);
                clearForm();
                onBOMItemAdded();
            } else {
                setError(result.error || 'Failed to add standard part assembly.');
            }
            setIsLoading(false);
            return;
        } else {
            setError("Selected Standard Part for assembly not found.");
            setIsLoading(false);
            return;
        }
    }

    // Regular BOM item addition (single item, possibly from standard part, or new)
    const bomItemData: any = {
      partNumber,
      description,
      quantity: selectedStandardPartId ? 1 : finalQuantity, // Default to 1 if it's a selected standard part (non-assembly)
      unit,
      supplier: supplier || null,
      standardPartId: selectedStandardPartId,
    };
     if (parentId !== undefined && parentId !== null) {
      bomItemData.parentId = parentId;
    }


    try {
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
      
      let allCustomFieldsAddedSuccessfully = true;
      const customFieldErrors: string[] = [];

      if (customFields.length > 0 && newBOMItem && newBOMItem.id) {
        for (const cf of customFields) {
          if (cf.name && cf.value) {
            try {
              const cfResponse = await fetch(`/api/bom-items/${newBOMItem.id}/custom-fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: cf.name, value: cf.value }),
              });
              if (!cfResponse.ok) { /* ... error handling ... */ }
            } catch (cfErr: any) { /* ... error handling ... */ }
          }
        }
      }

      // Save to Standard Parts Catalog if checked and not already a standard part
      if (saveToCatalog && !selectedStandardPartId) {
        try {
          const spResponse = await fetch('/api/standard-parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partNumber,
              description,
              defaultUnit: unit,
              defaultSupplier: supplier
              // parentId for standard parts is not handled here, assumes top-level
            }),
          });
          if (!spResponse.ok) {
            const spError = await spResponse.json();
            customFieldErrors.push(`Failed to save to Standard Parts Catalog: ${spError.error || 'Unknown error'}`);
            allCustomFieldsAddedSuccessfully = false; // Re-use this flag for overall success indication
          }
        } catch (spErr: any) {
          customFieldErrors.push(`Failed to save to Standard Parts Catalog: ${spErr.message}`);
          allCustomFieldsAddedSuccessfully = false;
        }
      }


      if (allCustomFieldsAddedSuccessfully) {
        setSuccessMessage(`BOM Item "${newBOMItem.partNumber}" processed. Check logs for catalog/custom field status.`);
        clearForm();
        onBOMItemAdded();
      } else {
        setError(
          `BOM Item "${newBOMItem.partNumber}" was created, but some operations failed:\n- ${customFieldErrors.join('\n- ')}`
        );
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during BOM item submission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form data-testid="add-bom-item-form" onSubmit={handleSubmit} className="p-6 bg-background shadow-lg rounded-xl border border-brandColor1/50 dark:border-brandColor2/70 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">
          {parentId ? 'Add New Sub-Item' : 'Add New BOM Item'}
        </h3>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={isFetchingStandardParts}
        >
          {isFetchingStandardParts ? 'Loading Catalog...' : 'Add from Standard Parts Catalog'}
        </button>
      </div>

      <StandardPartSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleStandardPartSelect}
      />

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
          <input type="text" id="partNumber" value={partNumber} onChange={e => setPartNumber(e.target.value)} required
                 className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
                 disabled={!!selectedStandardPartId} // Disable if selected from catalog
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground/80 mb-1">Description <span className="text-red-500">*</span></label>
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required
                 className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
                 disabled={!!selectedStandardPartId}
          />
        </div>
        {/* Quantity might be hidden or fixed to 1 if a standard part (especially assembly) is selected */}
        {!(selectedStandardPartId && selectedStandardPartChildren && selectedStandardPartChildren.length > 0) && (
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-foreground/80 mb-1">Quantity <span className="text-red-500">*</span></label>
            <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} required
                  className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
                  disabled={!!selectedStandardPartId && !(selectedStandardPartChildren && selectedStandardPartChildren.length > 0) } // Allow quantity for single SP, but not assembly root
            />
          </div>
        )}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-foreground/80 mb-1">Unit <span className="text-red-500">*</span></label>
          <input type="text" id="unit" value={unit} onChange={e => setUnit(e.target.value)} required
                 className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
                 disabled={!!selectedStandardPartId}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="supplier" className="block text-sm font-medium text-foreground/80 mb-1">Supplier</label>
          <input type="text" id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)}
                 className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
                 disabled={!!selectedStandardPartId}
          />
        </div>
      </div>

      {!selectedStandardPartId && (
        <div className="flex items-center mt-4">
          <input
            id="saveToCatalog"
            type="checkbox"
            checked={saveToCatalog}
            onChange={(e) => setSaveToCatalog(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="saveToCatalog" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Save new item to Standard Parts Catalog
          </label>
        </div>
      )}


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
          disabled={isLoading || isFetchingStandardParts}
          className="px-6 py-2.5 flex items-center justify-center border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Adding...' : (parentId ? 'Add Sub-Item' : 'Add BOM Item')}
        </button>
      </div>
    </form>
  );
};

export default AddBOMItemForm;
