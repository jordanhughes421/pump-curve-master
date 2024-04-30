// app/dashboard/layout.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define user type if needed
type User = {
  name: string;
  email: string;
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  profilePicture: string;
  googleId: string;
  emailVerified: string;
  image: string;
  // Add other user properties as needed
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
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