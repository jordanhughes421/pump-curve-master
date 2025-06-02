'use client';

import CreatePumpForm from '@/app/components/CreatePumpForm';

export default function NewPumpPage() {
  return (
    // The main layout.tsx should provide overall page padding like py-8 if needed.
    // This container is for the content card itself.
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-content-background rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b border-brandColor2">
        Add New Pump
      </h1>
      <CreatePumpForm />
    </div>
  );
}