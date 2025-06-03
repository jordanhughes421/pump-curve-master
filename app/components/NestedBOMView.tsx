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
    <div className="my-3 p-4 border border-[var(--brandColor1)] rounded-xl shadow bg-[var(--color-content-background)]" style={indentStyle}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg text-blue-700">
            {item.partNumber} - {item.description}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
            <p><span className="font-medium text-gray-900">Quantity:</span> {item.quantity} {item.unit}</p>
            <p><span className="font-medium text-gray-900">Supplier:</span> {item.supplier || 'N/A'}</p>
          </div>
        </div>
        <div className="flex space-x-2 flex-shrink-0 ml-4">
          <button onClick={() => onEditItem(item)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-150 ease-in-out">Edit</button>
          <button onClick={() => onAddItem(item.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-150 ease-in-out">Add Child</button>
          <button onClick={handleDelete} className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-150 ease-in-out">Delete</button>
        </div>
      </div>

      {item.customFields && item.customFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Custom Fields:</h4>
          <ul className="list-disc list-inside pl-2 text-xs text-gray-600 space-y-1">
            {item.customFields.map((field) => (
              <li key={field.id}>
                <span className="font-medium">{field.name}:</span> {field.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.children && item.children.length > 0 && (
        <div className="mt-4 pt-2 pl-4 border-l-2 border-gray-300">
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
        <div className="animate-spin inline-block w-8 h-8 border-4 rounded-full border-[var(--brandColor4)] border-t-transparent" role="status">
          <span className="sr-only">Loading...</span> {/* Use sr-only for Tailwind */}
        </div>
        <p className="ml-3 text-gray-700">Loading Bill of Materials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={fetchBOMData} 
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-colors duration-150 ease-in-out"
        >
          Retry
        </button>
      </div>
    );
  }

  if (bomData.length === 0) {
    return (
      <div className="p-5 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
        <p>No Bill of Materials data found for this pump. You can start by adding a top-level item.</p>
        {/* Button to add top-level item could be here, or handled by parent page */}
      </div>
    );
  }

  return (
    <div data-testid="nested-bom-view" className="p-4 bg-[var(--color-background)] min-h-screen">
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
