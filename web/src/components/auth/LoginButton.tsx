'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';

export function LoginButton() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        로딩 중...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user.name}</span>
        <Button variant="outline" size="sm" onClick={logout}>
          로그아웃
        </Button>
      </div>
    );
  }

  // 데모용: 실제로는 OAuth 플로우 구현 필요
  const handleDemoLogin = () => {
    // 임시 데모 로그인
    const demoUser = {
      id: 'demo-user-1',
      name: '데모 사용자',
      email: 'demo@maipatent.ai',
    };
    // AuthProvider의 login 함수 호출을 위해 커스텀 이벤트 사용
    window.dispatchEvent(
      new CustomEvent('maipatent-login', { detail: demoUser })
    );
  };

  return (
    <Button onClick={handleDemoLogin}>
      로그인
    </Button>
  );
}
