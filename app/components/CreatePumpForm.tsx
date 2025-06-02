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
    <>
      <form onSubmit={handleSubmit} className="space-y-6 mt-6"> {/* Added mt-6 for spacing from title */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-1">
              Pump Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., Primary Feed Pump"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-foreground/80 mb-1">
              Pump Type
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground text-sm"
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
            <label htmlFor="manufacturer" className="block text-sm font-medium text-foreground/80 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., Flowserve"
            />
          </div>

          <div>
            <label htmlFor="modelNumber" className="block text-sm font-medium text-foreground/80 mb-1">
              Model Number
            </label>
            <input
              type="text"
              id="modelNumber"
              name="modelNumber"
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., Mark III"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="maxFlow" className="block text-sm font-medium text-foreground/80 mb-1">
              Max Flow (GPM)
            </label>
            <input
              type="number"
              id="maxFlow"
              name="maxFlow"
              required
              min="0"
              step="0.1"
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., 1500"
            />
          </div>

          <div>
            <label htmlFor="maxHead" className="block text-sm font-medium text-foreground/80 mb-1">
              Max Head (ft)
            </label>
            <input
              type="number"
              id="maxHead"
              name="maxHead"
              required
              min="0"
              step="0.1"
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., 250"
            />
          </div>

          <div>
            <label htmlFor="maxSpeed" className="block text-sm font-medium text-foreground/80 mb-1">
              Max Speed (RPM)
            </label>
            <input
              type="number"
              id="maxSpeed"
              name="maxSpeed"
              required
              min="0"
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="e.g., 3550"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground/80 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm resize-none"
            placeholder="Enter pump description or notes"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-brandColor1/50 text-foreground/80 rounded-lg hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 focus:outline-none focus:ring-2 focus:ring-brandColor2 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 flex items-center justify-center border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </>
  );
}