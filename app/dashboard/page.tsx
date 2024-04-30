// app/dashboard/page.tsx
'use client'
import React, { useEffect, useState } from 'react';
import { useUser } from './user-provider';
import { useRouter } from 'next/navigation';



const Dashboard = () => {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string>(''); // Explicitly type the error state as string

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
      // Check if the error is an instance of Error and set the message, else set a default error message
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  if (!user) {
    fetchUserData();
  } else {
    
  }

  return (

    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}</p>
    </div>
  );
};

export default Dashboard;
