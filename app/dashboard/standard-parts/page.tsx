'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StandardPart } from '@/lib/types'; // Adjust path as necessary

const StandardPartsPage = () => {
  const [parts, setParts] = useState<StandardPart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this standard part? This action may also delete its children if any.')) {
      return;
    }
    try {
      const response = await fetch(`/api/standard-parts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete standard part: ${response.status}`);
      }
      // Refresh the list after successful deletion
      fetchParts();
    } catch (err: any) {
      setError(err.message);
      alert(`Error deleting part: ${err.message}`); // Show error in an alert for now
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading standard parts...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error} <button onClick={fetchParts} className="ml-2 px-2 py-1 border rounded">Retry</button></div>;
  }

  // Helper to render parts recursively (for future hierarchical display)
  // For now, it will render a flat list as API returns all parts.
  // To make it hierarchical, the initial fetchParts would need to fetch top-level items
  // and then this function could fetch children or use the included children.
  const renderParts = (partsToRender: StandardPart[], level = 0) => {
    return partsToRender.map((part) => (
      <React.Fragment key={part.id}>
        <tr className={`${level > 0 ? 'bg-gray-100' : ''}`}>
          <td style={{ paddingLeft: `${level * 20}px` }} className="border px-4 py-2">{part.partNumber}</td>
          <td className="border px-4 py-2">{part.description}</td>
          <td className="border px-4 py-2">{part.defaultUnit}</td>
          <td className="border px-4 py-2">
            <Link href={`/dashboard/standard-parts/${part.id}/edit`} className="text-blue-500 hover:text-blue-700 mr-2">
              Edit
            </Link>
            <button
              onClick={() => handleDelete(part.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </td>
        </tr>
        {/* Render children if they exist and API provides them directly */}
        {part.children && part.children.length > 0 && renderParts(part.children, level + 1)}
      </React.Fragment>
    ));
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Standard Parts Management</h1>
        <Link href="/dashboard/standard-parts/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New Standard Part
        </Link>
      </div>
      {parts.length === 0 ? (
        <p>No standard parts found.</p>
      ) : (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Part Number</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Default Unit</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* For now, rendering a flat list. API returns all parts with children included.
                If we want a true hierarchical view starting from roots, API should be called for parentId: null
                or client-side filtering needs to identify root items.
                The current renderParts function can handle hierarchy if `parts` are root items.
            */}
            {renderParts(parts.filter(p => p.parentId === null))}
            {/* Also render orphaned children or parts that might not be correctly parented, for visibility */}
            {parts.filter(p => p.parentId !== null && !parts.find(parent => parent.id === p.parentId)).length > 0 && (
                <tr><td colSpan={4} className="text-center font-bold py-2">Orphaned/Other Parts</td></tr>
            )}
            {renderParts(parts.filter(p => p.parentId !== null && !parts.find(parent => parent.id === p.parentId)))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StandardPartsPage;
