'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Interface for BOM Custom Field Data
interface BOMCustomFieldData {
  id: number;
  name: string;
  value: string;
  // bomItemId: number;
  // createdAt: string;
  // updatedAt: string;
}

// Interface for BOM Item Data (matching the expected API response)
interface BOMItemData {
  id: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  // pumpModelId: number | null;
  // parentId: number | null;
  // createdAt: string;
  // updatedAt: string;
  customFields: BOMCustomFieldData[];
  children: BOMItemData[]; // Recursive definition for children
}

// Props for the main component
interface NestedBOMViewProps {
  pumpId: number;
  bomUpdateKey: number; // To trigger re-fetch
  onEditItem: (item: BOMItemData) => void;
  onAddItem: (parentId: number | null) => void; // Pass null for top-level, item.id for child
  onDeleteItem: (itemId: number) => void;
}

interface BOMTreeItemProps {
  item: BOMItemData;
  level: number;
  onEditItem: (item: BOMItemData) => void;
  onAddItem: (parentId: number | null) => void;
  onDeleteItem: (itemId: number) => void;
}

// A recursive sub-component to render each BOM item and its children
const BOMTreeItem: React.FC<BOMTreeItemProps> = ({ item, level, onEditItem, onAddItem, onDeleteItem }) => {
  const indentStyle = { marginLeft: `${level * 20}px` };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${item.partNumber} - ${item.description}"? This will also delete all its children.`)) {
      onDeleteItem(item.id);
    }
  };

  return (
    <div className="my-3 p-4 bg-background border border-brandColor1/50 dark:border-brandColor2/60 rounded-lg shadow-md space-y-3" style={indentStyle}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg text-foreground">
            {item.partNumber} - {item.description}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-foreground/80">
            <p><span className="font-medium text-foreground/90">Quantity:</span> {item.quantity} {item.unit}</p>
            <p><span className="font-medium text-foreground/90">Supplier:</span> {item.supplier || 'N/A'}</p>
          </div>
        </div>
        <div className="flex space-x-2 flex-shrink-0 ml-4">
          <button onClick={() => onEditItem(item)} className="px-2.5 py-1 text-xs border border-brandColor1/70 dark:border-brandColor2/70 text-foreground/80 hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 rounded-md transition-colors">Edit</button>
          <button onClick={() => onAddItem(item.id)} className="px-2.5 py-1 text-xs border border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-400/20 rounded-md transition-colors">Add Child</button>
          <button onClick={handleDelete} className="px-2.5 py-1 text-xs border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/20 rounded-md transition-colors">Delete</button>
        </div>
      </div>

      {item.customFields && item.customFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brandColor1/50 dark:border-brandColor2/60">
          <h4 className="text-sm font-semibold text-foreground/90 mb-1">Custom Fields:</h4>
          <ul className="list-disc list-inside pl-2 text-xs text-foreground/70 space-y-1">
            {item.customFields.map((field) => (
              <li key={field.id}>
                <span className="font-medium">{field.name}:</span> {field.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.children && item.children.length > 0 && (
        <div className="mt-4 pt-2 pl-4 border-l-2 border-brandColor1/40 dark:border-brandColor2/50">
          {item.children.map((child) => (
            <BOMTreeItem 
              key={child.id} 
              item={child} 
              level={level + 1} 
              onEditItem={onEditItem}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main component
const NestedBOMView: React.FC<NestedBOMViewProps> = ({ pumpId, bomUpdateKey, onEditItem, onAddItem, onDeleteItem }) => {
  const [bomData, setBomData] = useState<BOMItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBOMData = useCallback(async () => {
    if (!pumpId) {
      setError('Pump ID is not provided.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pumps/${pumpId}/bom`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch BOM: ${response.statusText}`);
      }
      const data: BOMItemData[] = await response.json();
      setBomData(data);
    } catch (err: any) {
      console.error('Error fetching BOM data:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [pumpId]); // fetchBOMData depends on pumpId

  useEffect(() => {
    fetchBOMData();
  }, [fetchBOMData, bomUpdateKey]); // Re-fetch when pumpId changes or bomUpdateKey changes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin inline-block w-8 h-8 border-4 rounded-full border-brandColor3 border-t-transparent dark:border-brandColor4" role="status">
          <span className="sr-only">Loading...</span> {/* Use sr-only for Tailwind */}
        </div>
        <p className="ml-3 text-foreground/80">Loading Bill of Materials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={fetchBOMData} 
          className="mt-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (bomData.length === 0) {
    return (
      <div className="p-5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
        <p>No Bill of Materials data found for this pump. You can start by adding a top-level item.</p>
        {/* Button to add top-level item could be here, or handled by parent page */}
      </div>
    );
  }

  return (
    <div data-testid="nested-bom-view" className="p-4 bg-background min-h-screen">
      {/* Title is handled by parent page now */}
      {/* <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Bill of Materials for Pump ID: {pumpId}</h2> */}
      {bomData.map((item) => (
        <BOMTreeItem 
          key={item.id} 
          item={item} 
          level={0} 
          onEditItem={onEditItem}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
};

export default NestedBOMView;
