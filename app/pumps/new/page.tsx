'use client';

import CreatePumpForm from '@/app/components/CreatePumpForm';

export default function NewPumpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Add New Pump</h1>
      <CreatePumpForm />
    </div>
  );
} 