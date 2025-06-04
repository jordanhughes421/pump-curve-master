'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateStandardPartForm from '@/app/components/CreateStandardPartForm'; // Adjust path if needed
import { StandardPart } from '@/lib/types';

const CreateStandardPartPage = () => {
  const router = useRouter();

  const handleSuccess = (newPart: StandardPart) => {
    // Could show a success message here before redirecting
    console.log('Standard Part created successfully:', newPart);
    router.push('/dashboard/standard-parts'); // Navigate to the list page
  };

  const handleCancel = () => {
    router.push('/dashboard/standard-parts'); // Navigate back to the list page
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Standard Part</h1>
        <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800"
        >
          &larr; Back to List
        </button>
      </div>

      <CreateStandardPartForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default CreateStandardPartPage;
