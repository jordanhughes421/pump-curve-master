// app/dashboard/layout.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define user type if needed
type User = {
  id: number;
  name: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  profilePicture: string | null;
  googleId: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: string;
  // Add other user properties as needed
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        console.log('Session check response:', data);
        
        if (response.ok && data.user) {
          console.log('Setting user from session:', data.user);
          setUser(data.user);
        } else {
          console.log('No valid session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};