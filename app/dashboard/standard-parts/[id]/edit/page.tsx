'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use useParams for client components
import EditStandardPartForm from '@/app/components/EditStandardPartForm'; // Adjust path if needed
import { StandardPart } from '@/lib/types';

const EditStandardPartPage = () => {
  const router = useRouter();
  const params = useParams(); // Hook to get dynamic route parameters
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [part, setPart] = useState<StandardPart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchPart = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/standard-parts/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch standard part: ${response.status}`);
          }
          const data: StandardPart = await response.json();
          setPart(data);
        } catch (err: any) {
          setError(err.message);
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPart();
    } else {
      setError("No ID provided for the standard part.");
      setLoading(false);
    }
  }, [id]);

  const handleSuccess = (updatedPart: StandardPart) => {
    console.log('Standard Part updated successfully:', updatedPart);
    router.push('/dashboard/standard-parts'); // Navigate to the list page
  };

  const handleCancel = () => {
    router.push('/dashboard/standard-parts'); // Navigate back to the list page
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading standard part details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!part) {
    return <div className="container mx-auto p-4">Standard part not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Standard Part</h1>
        <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800"
        >
          &larr; Back to List
        </button>
      </div>
      <EditStandardPartForm initialData={part} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default EditStandardPartPage;
