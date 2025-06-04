'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StandardPart } from '@/lib/types'; // Adjust path as necessary

interface StandardPartSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (part: StandardPart) => void;
}

const StandardPartSelectionModal: React.FC<StandardPartSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [parts, setParts] = useState<StandardPart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/standard-parts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch standard parts: ${response.status}`);
      }
      const data: StandardPart[] = await response.json();
      setParts(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      console.error("Fetch error in modal:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen, fetchParts]);

  const handleSelectPart = (part: StandardPart) => {
    onSelect(part);
    onClose();
  };

  const renderPartNode = (part: StandardPart, level = 0) => {
    // Filter based on search term - simple search on partNumber or description
    const matchesSearch = searchTerm === '' ||
                          part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch && (!part.children || part.children.length === 0)) return null;

    const childrenToRender = part.children?.map(child => renderPartNode(child, level + 1)).filter(Boolean);

    if (!matchesSearch && (!childrenToRender || childrenToRender.length === 0)) return null;


    return (
      <div key={part.id} style={{ marginLeft: `${level * 20}px` }} className="my-1">
        {matchesSearch && (
            <div
                className="p-2 border rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => handleSelectPart(part)}
            >
            <span>{part.partNumber} - {part.description}</span>
            <button className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">Select</button>
            </div>
        )}
        {childrenToRender && childrenToRender.length > 0 && (
          <div className="mt-1 pl-4 border-l">
            {childrenToRender}
          </div>
        )}
      </div>
    );
  };

  const rootParts = parts.filter(p => p.parentId === null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Standard Part</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>

        <input
            type="text"
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded mb-4"
        />

        {loading && <p>Loading standard parts...</p>}
        {error && <p className="text-red-500">Error: {error} <button onClick={fetchParts} className="ml-2 px-2 py-1 border rounded text-xs">Retry</button></p>}

        {!loading && !error && parts.length === 0 && <p>No standard parts available.</p>}
        {!loading && !error && parts.length > 0 && (
          <div className="space-y-2">
            {rootParts.length > 0
                ? rootParts.map(part => renderPartNode(part))
                : <p>No top-level standard parts found. Displaying all parts.</p>
                  // Fallback or different rendering if only flat list needed or if no root items
            }
            {rootParts.length === 0 && parts.map(part => renderPartNode(part)) /* Show all if no roots */}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardPartSelectionModal;
