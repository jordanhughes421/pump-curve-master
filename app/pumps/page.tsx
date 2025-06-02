'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Pump {
  id: number;
  name: string;
  manufacturer: string;
  modelNumber: string;
  type: string;
  maxFlow: number;
  maxHead: number;
  maxSpeed: number;
  description: string | null;
}

export default function PumpsPage() {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const response = await fetch('/api/pumps');
        if (!response.ok) {
          throw new Error('Failed to fetch pumps');
        }
        const data = await response.json();
        setPumps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPumps();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-content-background p-8 rounded-lg shadow-md flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-foreground/80 font-medium">Loading pumps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-6 py-4 rounded-lg max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Error Loading Pumps</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-content-background rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b border-brandColor2">Pumps</h1>
          <Link
            href="/pumps/new"
            className="inline-flex items-center px-6 py-2 bg-brandColor3 hover:bg-brandColor4 text-white dark:bg-brandColor3 dark:hover:bg-brandColor2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors text-sm font-semibold"
          >
            Add New Pump
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pumps.map((pump) => (
            <Link
              key={pump.id}
              href={`/pumps/${pump.id}`}
              className="bg-background rounded-xl shadow-md hover:shadow-lg border border-brandColor1/50 hover:border-brandColor2 transition-all duration-150 ease-in-out flex flex-col justify-between"
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1"> {/* Added flex-1 to allow text to wrap if name is too long */}
                    <h2 className="text-xl font-semibold text-foreground/90 mb-1">{pump.name}</h2>
                    <p className="text-sm text-foreground/70">{pump.manufacturer} - {pump.modelNumber}</p>
                  </div>
                  <span className="ml-2 px-2 py-0.5 bg-brandColor1/20 text-brandColor3 dark:bg-brandColor1/30 dark:text-brandColor2 rounded-md text-xs font-medium whitespace-nowrap">
                    {pump.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 mb-3"> {/* Adjusted grid and gap */}
                  <div>
                    <p className="text-xs text-foreground/60 mb-0.5">Max Flow</p>
                    <p className="font-medium text-sm text-foreground/90">{pump.maxFlow} GPM</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-0.5">Max Head</p>
                    <p className="font-medium text-sm text-foreground/90">{pump.maxHead} ft</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-0.5">Max Speed</p>
                    <p className="font-medium text-sm text-foreground/90">{pump.maxSpeed} RPM</p>
                  </div>
                </div>

                {pump.description && (
                  <p className="text-sm text-foreground/70 line-clamp-2 mt-2">{pump.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {pumps.length === 0 && !loading && ( // Added !loading condition
          <div className="bg-background rounded-xl shadow-md p-8 text-center border border-brandColor1/30">
            <h2 className="text-xl font-semibold text-foreground/90 mb-3">No Pumps Found</h2>
            <p className="text-sm text-foreground/70">Click the &quot;Add New Pump&quot; button to create your first pump.</p>
          </div>
        )}
      </div>
    </div>
  );
}