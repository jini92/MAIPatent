'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseOAuthCallback, setStoredAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('인증 정보를 처리하는 중...');

  useEffect(() => {
    const processCallback = async () => {
      const { user, error } = parseOAuthCallback();

      if (error) {
        setStatus('error');
        setMessage(`인증 실패: ${error}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (user) {
        setStoredAuth(user);
        setStatus('success');
        setMessage(`환영합니다, ${user.name}님!`);
        setTimeout(() => router.push('/dashboard/'), 2000);
        return;
      }

      // 파라미터가 없는 경우 (직접 접근)
      setStatus('error');
      setMessage('유효한 인증 정보가 없습니다.');
      setTimeout(() => router.push('/'), 3000);
    };

    processCallback();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            {status === 'loading' ? '로그인 처리 중' : status === 'success' ? '로그인 성공' : '로그인 실패'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {status === 'success' && '잠시 후 대시보드로 이동합니다...'}
          {status === 'error' && '잠시 후 홈으로 이동합니다...'}
        </CardContent>
      </Card>
    </div>
  );
}
