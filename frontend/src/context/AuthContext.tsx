'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

export interface User {
  user_id: number;
  username: string;
  role_level: number | string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication context provider to manage login states, session checks, and redirection.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On initial mount, hydrate states from localStorage and verify session with database backend
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Double-check token validity directly with SQL server backend
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            handleClearAuth();
          }
        } catch (err: any) {
          console.error('Failed to verify session on server:', err);
          // If server explicitly rejects token (401/403), wipe it
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            handleClearAuth();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleClearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /**
   * authenticates against backend /login
   */
  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        
        setToken(receivedToken);
        setUser(receivedUser);
        
        router.push('/');
        return { success: true };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err: any) {
      console.error('Auth login error:', err);
      const errMsg = err.response?.data?.message || 'Cannot establish connection to server.';
      return { success: false, error: errMsg };
    }
  };

  /**
   * Destroys session and redirects to login screen
   */
  const logout = () => {
    handleClearAuth();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
