'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { User } from '@/lib/auth';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { login } = useAuth();

  // 데모 로그인 이벤트 리스너
  useEffect(() => {
    const handleLogin = (event: CustomEvent<User>) => {
      login(event.detail);
    };

    window.addEventListener('maipatent-login', handleLogin as EventListener);
    return () => {
      window.removeEventListener('maipatent-login', handleLogin as EventListener);
    };
  }, [login]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="md:pl-64">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  );
}
