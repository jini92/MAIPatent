'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InventionForm } from '@/components/forms/InventionForm';

export default function SubmitPage() {
  const router = useRouter();
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSuccess = (executionId: string) => {
    setSubmittedId(executionId);
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">제출 완료</CardTitle>
            <CardDescription>
              발명 제안서가 성공적으로 제출되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">실행 ID</p>
              <p className="font-mono text-sm">{submittedId}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">다음 단계</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. 선행기술 검색이 자동으로 진행됩니다 (약 1-2분)</li>
                <li>2. AI가 KIPO 표준 특허 명세서를 생성합니다 (약 3-5분)</li>
                <li>3. 검수 대기 목록에 추가됩니다</li>
                <li>4. 검수 완료 후 최종 문서를 다운로드할 수 있습니다</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={() => router.push(`/tracking/?id=${submittedId}`)}
              >
                진행 상황 확인
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dashboard/')}
              >
                대시보드로 이동
              </Button>
            </div>

            <Button
              variant="link"
              className="w-full"
              onClick={() => setSubmittedId(null)}
            >
              새로운 발명 제안서 작성
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">발명 제안서 작성</h1>
        <p className="text-muted-foreground mt-2">
          단계별로 발명 정보를 입력하면 AI가 KIPO 표준 특허 명세서를 자동으로 생성합니다
        </p>
      </div>

      <InventionForm onSuccess={handleSuccess} />
    </div>
  );
}
