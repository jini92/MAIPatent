'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from './AuthProvider';
import { getGoogleAuthUrl, getDemoUser } from '@/lib/auth';
import { User, LogOut, ChevronDown } from 'lucide-react';

export function LoginButton() {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        로딩 중...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="text-sm">{user.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const handleGoogleLogin = () => {
    const authUrl = getGoogleAuthUrl();
    if (authUrl && authUrl.startsWith('http')) {
      window.location.href = authUrl;
    } else {
      // n8n Webhook URL이 설정되지 않은 경우 알림
      alert('Google OAuth가 아직 설정되지 않았습니다. 데모 로그인을 사용해주세요.');
    }
  };

  const handleDemoLogin = () => {
    const demoUser = getDemoUser();
    login(demoUser);
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button>
          로그인
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleLogin}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDemoLogin}>
          <User className="mr-2 h-4 w-4" />
          데모 로그인
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
