'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route protection wrapper component. 
 * Prevents unauthorized users from accessing pages and redirects to /login.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user found, redirect immediately to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Display high fidelity loader while checking JWT
  if (loading || !user) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
