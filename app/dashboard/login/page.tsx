'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/dashboard/user-provider';
import Cookies from 'js-cookie';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { user, setUser, isLoading, refreshSession } = useUser();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, submittiedpassword: password }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Login successful, user data:', data.userWithoutPassword);
        
        // First refresh the session to ensure all components have the latest user state
        await refreshSession();
        
        // Then set the user state
        setUser(data.userWithoutPassword);
        console.log('User state after setUser:', data.userWithoutPassword);
        
        // Finally navigate to dashboard
        router.replace('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to login');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

import Link from 'next/link'; // Added Link import

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-content-background p-8 rounded-xl shadow-xl text-center">
          <svg className="animate-spin h-8 w-8 text-foreground/80 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-foreground/80 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-content-background p-6 sm:p-8 rounded-xl shadow-xl space-y-8 border border-brandColor1/20">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-foreground mb-1">
            Sign in to your account
          </h1>
          <p className="text-center text-sm">
            Or{' '}
            <Link href="/dashboard/register" className="text-brandColor3 hover:text-brandColor4 dark:text-brandColor4 dark:hover:text-brandColor3 transition-colors font-medium">
              create a new account
            </Link>
          </p>
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-background border border-brandColor1/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor2 dark:bg-zinc-800 text-foreground placeholder-foreground/50 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brandColor3 hover:bg-brandColor4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandColor3 dark:focus:ring-offset-background transition-colors disabled:opacity-60"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
