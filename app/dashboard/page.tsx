// app/dashboard/page.tsx
'use client'
import React, { useEffect, useState } from 'react';
import { useUser } from './user-provider';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
        } else {
          router.push('/dashboard/login');
          throw new Error(data.message || 'Failed to check session');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    };

    if (!user) {
      fetchUserData();
    }
  }, [user, setUser, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-6 py-4 rounded-lg max-w-md text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">An Error Occurred</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Loading state for user data
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-content-background p-8 rounded-lg shadow-md flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-foreground/80 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-content-background rounded-xl shadow-lg px-4 pb-4 pt-8 sm:px-6 sm:pb-6 sm:pt-12 lg:px-8 lg:pb-8 lg:pt-16">
      <h1 className="text-3xl font-bold text-foreground mb-6 pb-4 border-b border-brandColor2">
        Dashboard
      </h1>
      
      <div className="bg-background p-4 sm:p-6 rounded-lg shadow border border-brandColor1/30 mb-8">
        <p className="text-xl text-foreground/90">
          Welcome back, {user?.name}!
        </p>
      </div>

      {/* Placeholder for future content */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground/80 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
            <h3 className="text-xl font-semibold text-foreground/90 mb-4">Statistic 1</h3>
            <p className="text-3xl font-bold text-brandColor3">123</p>
            <p className="text-sm text-foreground/70 mt-1">Description of statistic 1.</p>
          </div>
          <div className="bg-background rounded-xl shadow-lg p-4 sm:p-6 border-2 border-brandColor2">
            <h3 className="text-xl font-semibold text-foreground/90 mb-4">Important Action</h3>
            <p className="text-sm text-foreground/70 mb-4">This card has a more prominent border and shadow, suggesting higher importance.</p>
            <button className="inline-flex items-center px-4 py-2 bg-brandColor3 hover:bg-brandColor4 text-white dark:bg-brandColor3 dark:hover:bg-brandColor2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors text-sm font-semibold">
              Take Action
            </button>
          </div>
          <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
            <h3 className="text-xl font-semibold text-foreground/90 mb-4">Quick Link</h3>
             <ul className="space-y-2">
              <li><a href="#" className="text-brandColor3 hover:text-brandColor4 dark:text-brandColor2 dark:hover:text-brandColor1 transition-colors">Link 1</a></li>
              <li><a href="#" className="text-brandColor3 hover:text-brandColor4 dark:text-brandColor2 dark:hover:text-brandColor1 transition-colors">Link 2</a></li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
