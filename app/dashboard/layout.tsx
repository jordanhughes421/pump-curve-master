// app/dashboard/layout.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserProvider } from './user-provider';

// Dashboard layout that uses the UserProvider to wrap its children
const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

export default DashboardLayout;
