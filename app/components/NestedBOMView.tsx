'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BOMItem, BOMItemCustomField, NestedBOMViewProps as NewNestedBOMViewProps, GetBOMByIdResponse, ApiError } from '@/lib/types'; // Using shared types

// Props for the main component - updated to use NewNestedBOMViewProps from lib/types
// We'll keep the item interaction props for now, though their implementation might need review later
// if they are tightly coupled to the old data structure or parent page.
interface NestedBOMViewProps extends NewNestedBOMViewProps {
  onEditItem?: (item: BOMItem) => void; // Made optional for now
  onAddItem?: (parentId: number | null) => void; // Made optional for now
  onDeleteItem?: (itemId: number) => void; // Made optional for now
}

interface BOMTreeItemProps {
  item: BOMItem; // Use shared BOMItem type
  level: number;
  onEditItem?: (item: BOMItem) => void;
  onAddItem?: (parentId: number | null) => void;
  onDeleteItem?: (itemId: number) => void;
}

// A recursive sub-component to render each BOM item and its children
const BOMTreeItem: React.FC<BOMTreeItemProps> = ({ item, level, onEditItem, onAddItem, onDeleteItem }) => {
  const indentStyle = { marginLeft: `${level * 20}px` };
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const handleDelete = async () => {
    if (!onDeleteItem || !window.confirm(`Are you sure you want to delete "${item.partNumber} - ${item.description}"? This may also affect child items if not handled by the API.`)) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/bom-items/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `Failed to delete item ${item.id}`);
      }
      // Deletion successful, now call the callback passed from parent (page.tsx's handleBomDataChanged)
      onDeleteItem(item.id); // Pass item.id if the callback needs it, though handleBomDataChanged doesn't use it
    } catch (err: any) {
      setDeleteError(err.message);
      console.error("Deletion error:", err.message);
      // Optionally, re-throw or handle more visibly if needed
    } finally {
      setIsDeleting(false);
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
          {onEditItem && <button onClick={() => onEditItem(item)} disabled={isDeleting} className="px-2.5 py-1 text-xs border border-brandColor1/70 dark:border-brandColor2/70 text-foreground/80 hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 rounded-md transition-colors">Edit</button>}
          {onAddItem && <button onClick={() => onAddItem(item.id)} disabled={isDeleting} className="px-2.5 py-1 text-xs border border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-400/20 rounded-md transition-colors">Add Child</button>}
          {onDeleteItem && <button onClick={handleDelete} disabled={isDeleting} className="px-2.5 py-1 text-xs border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/20 rounded-md transition-colors">{isDeleting ? 'Deleting...' : 'Delete'}</button>}
        </div>
      </div>
      {deleteError && <p className="text-xs text-red-500 mt-1">Error: {deleteError}</p>}

      {item.customFields && item.customFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brandColor1/50 dark:border-brandColor2/60">
          <h4 className="text-sm font-semibold text-foreground/90 mb-1">Custom Fields:</h4>
          <ul className="list-disc list-inside pl-2 text-xs text-foreground/70 space-y-1">
            {item.customFields.map((field: BOMItemCustomField) => ( // Use shared BOMItemCustomField type
              <li key={field.id}>
                <span className="font-medium">{field.name}:</span> {field.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ensure children are also of type BOMItem for recursive rendering */}
      {item.children && item.children.length > 0 && (
        <div className="mt-4 pt-2 pl-4 border-l-2 border-brandColor1/40 dark:border-brandColor2/50">
          {item.children.map((child: BOMItem) => (
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
const NestedBOMView: React.FC<NestedBOMViewProps> = ({ bomId, onEditItem, onAddItem, onDeleteItem }) => {
  const [bomItems, setBomItems] = useState<BOMItem[]>([]); // State holds array of BOMItem
  const [currentBomName, setCurrentBomName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBOMData = useCallback(async () => {
    if (!bomId) {
      setBomItems([]);
      setCurrentBomName(null);
      setError(null); // Clear previous errors or data if no bomId
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boms/${bomId}`);
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `Failed to fetch BOM: ${response.statusText}`);
      }
      const data: GetBOMByIdResponse = await response.json(); // Full BOM object
      setBomItems(data.items || []); // BOM items are in the 'items' property
      setCurrentBomName(data.name); 
      // Header custom fields (data.customFields) are available here if this component needs to display them
      // For now, assuming BOMHeaderDisplay will be used by the parent for that.
    } catch (err: any) {
      console.error('Error fetching BOM data:', err);
      setError(err.message || 'An unknown error occurred.');
      setBomItems([]);
      setCurrentBomName(null);
    } finally {
      setIsLoading(false);
    }
  }, [bomId]);

  useEffect(() => {
    fetchBOMData();
  }, [fetchBOMData]); // Re-fetch when bomId changes

  if (!bomId) {
    return <p className="p-5 text-center text-foreground/70">Please select a Bill of Materials to view its items.</p>;
  }

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
        <p className="font-bold">Error loading BOM items for {currentBomName || `BOM ID: ${bomId}`}:</p>
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

  if (bomItems.length === 0) {
    return (
      <div className="p-5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
        <p>No items found for BOM: {currentBomName || `ID ${bomId}`}.</p>
        {/* Button to add top-level item could be here, or handled by parent page if onAddItem is provided */}
        {onAddItem && (
            <button 
                onClick={() => onAddItem(null)} // Add top-level item
                className="mt-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
                Add First Item
            </button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="nested-bom-view" className="p-4 bg-background min-h-screen">
      {currentBomName && <h3 className="text-xl font-semibold mb-4">Items for BOM: {currentBomName}</h3>}
      {bomItems.map((item) => (
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
