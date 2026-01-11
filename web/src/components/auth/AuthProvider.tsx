'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, getStoredAuth, setStoredAuth, clearStoredAuth } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // 초기 로드 시 저장된 인증 정보 확인
    const storedUser = getStoredAuth();
    setAuthState({
      user: storedUser,
      isLoading: false,
      isAuthenticated: !!storedUser,
    });
  }, []);

  const login = (user: User) => {
    setStoredAuth(user);
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
