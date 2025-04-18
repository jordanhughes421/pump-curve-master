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
  const { user, setUser, isLoading } = useUser();

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
        setUser(data.userWithoutPassword);
        router.push('/dashboard');
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brandColor5 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-brandColor1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandColor5 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-brandColor1 mb-6">Login</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brandColor1 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-white text-brandColor1"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brandColor1 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors bg-white text-brandColor1"
              placeholder="Enter your password"
            />
          </div>
          <button 
            type="submit"
            className="w-full px-6 py-2 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
