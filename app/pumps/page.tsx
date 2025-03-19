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
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-brandColor1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brandColor1 font-medium">Loading pumps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Pumps</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandColor5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brandColor1">Pumps</h1>
          <Link 
            href="/pumps/new" 
            className="bg-brandColor1 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Add New Pump
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pumps.map((pump) => (
            <Link 
              key={pump.id} 
              href={`/pumps/${pump.id}`}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-brandColor1 mb-1">{pump.name}</h2>
                    <p className="text-brandColor2">{pump.manufacturer} - {pump.modelNumber}</p>
                  </div>
                  <span className="px-3 py-1 bg-brandColor5 text-brandColor1 rounded-lg text-sm font-medium">
                    {pump.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-brandColor2 mb-1">Max Flow</p>
                    <p className="font-semibold text-brandColor1">{pump.maxFlow} GPM</p>
                  </div>
                  <div>
                    <p className="text-sm text-brandColor2 mb-1">Max Head</p>
                    <p className="font-semibold text-brandColor1">{pump.maxHead} ft</p>
                  </div>
                  <div>
                    <p className="text-sm text-brandColor2 mb-1">Max Speed</p>
                    <p className="font-semibold text-brandColor1">{pump.maxSpeed} RPM</p>
                  </div>
                </div>

                {pump.description && (
                  <p className="text-brandColor2 text-sm line-clamp-2">{pump.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {pumps.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold text-brandColor1 mb-2">No Pumps Found</h2>
            <p className="text-brandColor2">Click the &quot;Add New Pump&quot; button to create your first pump.</p>
          </div>
        )}
      </div>
    </div>
  );
} 