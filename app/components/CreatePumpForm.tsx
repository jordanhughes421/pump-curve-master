'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PUMP_TYPES = [
  'CENTRIFUGAL',
  'SUBMERSIBLE',
  'POSITIVE_DISPLACEMENT',
  'OTHER'
] as const;

export default function CreatePumpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type') as string,
      manufacturer: formData.get('manufacturer'),
      modelNumber: formData.get('modelNumber'),
      maxFlow: parseFloat(formData.get('maxFlow') as string),
      maxHead: parseFloat(formData.get('maxHead') as string),
      maxSpeed: parseInt(formData.get('maxSpeed') as string),
      description: formData.get('description'),
    };

    try {
      const response = await fetch('/api/pumps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create pump');
      }

      const pump = await response.json();
      router.push(`/pumps/${pump.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-brandColor5 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 border-b border-brandColor3">
          <h2 className="text-2xl font-bold text-brandColor1">Add New Pump</h2>
          <p className="mt-2 text-sm text-brandColor2">Fill in the details below to create a new pump model.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brandColor1 mb-1">
                Pump Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter pump name"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-brandColor1 mb-1">
                Pump Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
              >
                <option value="">Select pump type</option>
                {PUMP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-brandColor1 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                required
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter manufacturer name"
              />
            </div>

            <div>
              <label htmlFor="modelNumber" className="block text-sm font-medium text-brandColor1 mb-1">
                Model Number
              </label>
              <input
                type="text"
                id="modelNumber"
                name="modelNumber"
                required
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter model number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="maxFlow" className="block text-sm font-medium text-brandColor1 mb-1">
                Max Flow (GPM)
              </label>
              <input
                type="number"
                id="maxFlow"
                name="maxFlow"
                required
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter max flow"
              />
            </div>

            <div>
              <label htmlFor="maxHead" className="block text-sm font-medium text-brandColor1 mb-1">
                Max Head (ft)
              </label>
              <input
                type="number"
                id="maxHead"
                name="maxHead"
                required
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter max head"
              />
            </div>

            <div>
              <label htmlFor="maxSpeed" className="block text-sm font-medium text-brandColor1 mb-1">
                Max Speed (RPM)
              </label>
              <input
                type="number"
                id="maxSpeed"
                name="maxSpeed"
                required
                min="0"
                className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1"
                placeholder="Enter max speed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-brandColor1 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-brandColor5 text-brandColor1 resize-none"
              placeholder="Enter pump description"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-brandColor3 rounded-lg text-brandColor1 hover:bg-brandColor3 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brandColor5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Pump'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 