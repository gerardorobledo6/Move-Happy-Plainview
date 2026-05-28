import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';
import { isAdmin as checkIsAdmin } from '../utils/authUtils';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (token: string, userData?: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      client.get('/auth/me')
        .then(res => {
          if (res.data.user) setUser(res.data.user);
        })
        .catch(err => {
          console.error("Failed to fetch active user profile", err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = (newToken: string, userData?: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = checkIsAdmin(user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};