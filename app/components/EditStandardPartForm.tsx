'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { StandardPart } from '@/lib/types'; // Adjust path as necessary
import { useRouter } from 'next/navigation'; // For redirection

interface EditStandardPartFormProps {
  initialData: StandardPart;
  onSuccess?: (updatedPart: StandardPart) => void;
  onCancel?: () => void;
}

const EditStandardPartForm: React.FC<EditStandardPartFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const router = useRouter();
  const [partNumber, setPartNumber] = useState(initialData.partNumber);
  const [description, setDescription] = useState(initialData.description);
  const [defaultUnit, setDefaultUnit] = useState(initialData.defaultUnit);
  const [defaultSupplier, setDefaultSupplier] = useState(initialData.defaultSupplier || '');
  const [parentId, setParentId] = useState<number | null>(initialData.parentId || null);

  const [allParts, setAllParts] = useState<StandardPart[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // For form submission
  const [dataLoading, setDataLoading] = useState<boolean>(false); // For fetching parent options
  const [error, setError] = useState<string | null>(null); // For fetching parent options
  const [formError, setFormError] = useState<string | null>(null); // For form submission

  // Function to get all descendants of a given part ID
  const getDescendantIds = (partId: number, parts: StandardPart[]): number[] => {
    let descendants: number[] = [];
    const children = parts.filter(p => p.parentId === partId);
    for (const child of children) {
      descendants.push(child.id);
      descendants = descendants.concat(getDescendantIds(child.id, parts));
    }
    return descendants;
  };

  useEffect(() => {
    // Fetch all standard parts for parent selection
    const fetchAllParts = async () => {
      setDataLoading(true);
      try {
        const response = await fetch('/api/standard-parts');
        if (!response.ok) throw new Error('Failed to fetch standard parts for parent selection');
        let data: StandardPart[] = await response.json();

        // Filter out the current part and its descendants from being selectable as parent
        const descendantIds = getDescendantIds(initialData.id, data);
        const unselectableIds = new Set([initialData.id, ...descendantIds]);
        data = data.filter(part => !unselectableIds.has(part.id));

        setAllParts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };
    fetchAllParts();
  }, [initialData.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    if (!partNumber || !description || !defaultUnit) {
      setFormError('Part Number, Description, and Default Unit are required.');
      setLoading(false);
      return;
    }

    const payload = {
      partNumber,
      description,
      defaultUnit,
      defaultSupplier: defaultSupplier || null,
      parentId: parentId === 0 ? null : parentId,
    };

    try {
      const response = await fetch(`/api/standard-parts/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update standard part');
      }

      const updatedPart: StandardPart = await response.json();
      if (onSuccess) {
        onSuccess(updatedPart);
      } else {
        router.push('/dashboard/standard-parts'); // Default redirect
      }
    } catch (err: any) {
      setFormError(err.message);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <p className="text-red-500">Error loading form data: {error}</p>;
  }
  if (dataLoading) {
    return <p>Loading parent options...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white shadow-md rounded">
      <div>
        <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700">Part Number*</label>
        <input
          type="text"
          id="partNumber"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description*</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="defaultUnit" className="block text-sm font-medium text-gray-700">Default Unit*</label>
        <input
          type="text"
          id="defaultUnit"
          value={defaultUnit}
          onChange={(e) => setDefaultUnit(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="defaultSupplier" className="block text-sm font-medium text-gray-700">Default Supplier</label>
        <input
          type="text"
          id="defaultSupplier"
          value={defaultSupplier}
          onChange={(e) => setDefaultSupplier(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent Part</label>
        <select
          id="parentId"
          value={parentId === null ? '' : parentId.toString()}
          onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">None (Top-Level Part)</option>
          {allParts.map((part) => (
            <option key={part.id} value={part.id.toString()}>
              {part.partNumber} - {part.description.substring(0,30)}...
            </option>
          ))}
        </select>
      </div>

      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || dataLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditStandardPartForm;
