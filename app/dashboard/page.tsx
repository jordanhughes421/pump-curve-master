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
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}</p>
    </div>
  );
};

export default Dashboard;
