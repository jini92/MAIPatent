'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, FileText, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const workflowSteps = [
  {
    id: 'wf01',
    name: '발명 제안서 접수',
    description: '발명 제안서가 시스템에 등록되었습니다',
    icon: FileText,
    status: 'completed',
  },
  {
    id: 'wf02',
    name: '선행기술 검색',
    description: 'KIPRIS API를 통해 관련 선행기술을 검색합니다',
    icon: Search,
    status: 'in_progress',
  },
  {
    id: 'wf03',
    name: '명세서 생성',
    description: 'AI가 KIPO 표준 특허 명세서를 생성합니다',
    icon: FileText,
    status: 'pending',
  },
  {
    id: 'wf04',
    name: '검수 대기',
    description: '변리사/연구자의 검수를 기다립니다',
    icon: CheckCircle,
    status: 'pending',
  },
];

function TrackingContent() {
  const searchParams = useSearchParams();
  const executionId = searchParams.get('id');

  return (
    <>
      {executionId && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground mb-1">실행 ID</p>
          <p className="font-mono text-sm">{executionId}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>워크플로우 진행 상태</CardTitle>
          <CardDescription>
            각 단계별 처리 상태를 실시간으로 확인할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflowSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isPending = step.status === 'pending';

              return (
                <div key={step.id} className="flex gap-4">
                  {/* 상태 아이콘 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2',
                        isCompleted && 'border-green-500 bg-green-500 text-white',
                        isInProgress && 'border-blue-500 bg-blue-50 text-blue-500',
                        isPending && 'border-muted bg-muted text-muted-foreground'
                      )}
                    >
                      {isInProgress ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 my-2',
                          isCompleted ? 'bg-green-500' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>

                  {/* 단계 정보 */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          'font-medium',
                          isPending && 'text-muted-foreground'
                        )}
                      >
                        {step.name}
                      </h4>
                      {isInProgress && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                          진행 중
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                          완료
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        isPending ? 'text-muted-foreground/50' : 'text-muted-foreground'
                      )}
                    >
                      {step.description}
                    </p>
                    {isCompleted && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <Clock className="inline h-3 w-3 mr-1" />
                        2026-01-11 07:30:15 완료
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2">자동 새로고침</h4>
        <p className="text-sm text-blue-800">
          이 페이지는 2초마다 자동으로 새로고침되어 최신 진행 상황을 표시합니다.
          처리가 완료되면 알림을 받을 수 있습니다.
        </p>
      </div>
    </>
  );
}

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">진행 상황 추적</h1>
        <p className="text-muted-foreground">
          발명 제안서의 처리 진행 상황을 확인합니다
        </p>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">로딩 중...</div>}>
        <TrackingContent />
      </Suspense>
    </div>
  );
}
