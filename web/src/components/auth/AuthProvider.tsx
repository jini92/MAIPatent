'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState, getStoredAuth, setStoredAuth, clearStoredAuth, parseOAuthCallback } from '@/lib/auth';

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

  const login = useCallback((user: User) => {
    setStoredAuth(user);
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  useEffect(() => {
    // OAuth 콜백 처리 (URL 파라미터에서 사용자 정보 파싱)
    const { user: oauthUser, error } = parseOAuthCallback();

    if (error) {
      console.error('OAuth 인증 오류:', error);
      // URL 파라미터 정리
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    if (oauthUser) {
      // OAuth 콜백에서 사용자 정보를 받은 경우
      login(oauthUser);
      // URL 파라미터 정리
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
      return;
    }

    // 저장된 인증 정보 확인
    const storedUser = getStoredAuth();
    setAuthState({
      user: storedUser,
      isLoading: false,
      isAuthenticated: !!storedUser,
    });
  }, [login]);

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
