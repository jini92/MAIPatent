'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, FileText, Search, Loader2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExecutionStatus, WorkflowStep, StepStatus } from '@/hooks/useExecutionStatus';
import { PatentPreview } from '@/components/patent/PatentPreview';

const stepIcons: Record<string, React.ElementType> = {
  wf01: FileText,
  wf02: Search,
  wf03: FileText,
  wf04: CheckCircle,
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const executionId = searchParams.get('id');
  const patentId = searchParams.get('patentId'); // localStorage 상태 동기화용
  const [showPreview, setShowPreview] = useState(false);

  const { state, isLoading, error, refetch } = useExecutionStatus(executionId, {
    pollingInterval: 2000,
    enableMock: true,
    mockProgressSpeed: 3,
    patentId: patentId || undefined, // localStorage 상태 업데이트용
  });

  if (!executionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">실행 ID가 없습니다</h3>
          <p className="text-muted-foreground">발명 제안서를 제출하면 진행 상황을 추적할 수 있습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">상태 조회 실패</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">실행 ID</p>
          <p className="font-mono text-sm">{executionId}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              업데이트 중...
            </div>
          )}
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>워크플로우 진행 상태</CardTitle>
              <CardDescription>각 단계별 처리 상태를 실시간으로 확인할 수 있습니다</CardDescription>
            </div>
            {state?.overallStatus && <StatusBadge status={state.overallStatus} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {state?.steps.map((step, index) => (
              <WorkflowStepItem key={step.id} step={step} index={index} isLast={index === (state?.steps.length ?? 0) - 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      {state?.patentContent && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">생성된 명세서</h3>
            <Button onClick={() => setShowPreview(!showPreview)} variant={showPreview ? 'default' : 'outline'}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? '미리보기 닫기' : '미리보기 열기'}
            </Button>
          </div>
          {showPreview && (
            <div className="h-[600px]">
              <PatentPreview content={state.patentContent} title="AI 생성 특허 명세서" />
            </div>
          )}
        </>
      )}

      <div className={cn(
        'rounded-lg border p-4',
        state?.overallStatus === 'completed' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
      )}>
        {state?.overallStatus === 'completed' ? (
          <>
            <h4 className="font-medium text-green-900 mb-2">처리 완료</h4>
            <p className="text-sm text-green-800">모든 워크플로우가 완료되었습니다.</p>
          </>
        ) : (
          <>
            <h4 className="font-medium text-blue-900 mb-2">자동 새로고침</h4>
            <p className="text-sm text-blue-800">이 페이지는 2초마다 자동으로 새로고침됩니다.</p>
          </>
        )}
      </div>
    </>
  );
}

function WorkflowStepItem({ step, index, isLast }: { step: WorkflowStep; index: number; isLast: boolean }) {
  const StepIcon = stepIcons[step.id] || FileText;
  const isCompleted = step.status === 'completed';
  const isRunning = step.status === 'running';
  const isPending = step.status === 'pending';
  const isError = step.status === 'error';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
          isCompleted && 'border-green-500 bg-green-500 text-white',
          isRunning && 'border-blue-500 bg-blue-50 text-blue-500',
          isPending && 'border-muted bg-muted text-muted-foreground',
          isError && 'border-red-500 bg-red-50 text-red-500'
        )}>
          {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : isCompleted ? <CheckCircle className="h-5 w-5" /> : isError ? <AlertCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
        </div>
        {!isLast && <div className={cn('w-0.5 flex-1 my-2 transition-colors', isCompleted ? 'bg-green-500' : 'bg-muted')} />}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2">
          <h4 className={cn('font-medium', isPending && 'text-muted-foreground')}>{step.name}</h4>
          <StepStatusBadge status={step.status} />
        </div>
        <p className={cn('text-sm mt-1', isPending ? 'text-muted-foreground/50' : 'text-muted-foreground')}>{step.description}</p>
        {isError && step.error && <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">{step.error}</p>}
        {step.completedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            <Clock className="inline h-3 w-3 mr-1" />
            {new Date(step.completedAt).toLocaleString('ko-KR')} 완료
          </p>
        )}
        {step.output?.priorArts && step.output.priorArts.length > 0 && (
          <div className="mt-3 bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium mb-2">검색된 선행기술</p>
            <ul className="space-y-1">
              {step.output.priorArts.map((art) => (
                <li key={art.id} className="text-xs flex justify-between">
                  <span className="truncate flex-1 mr-2">{art.title}</span>
                  <span className="text-muted-foreground">{(art.relevanceScore * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: '대기 중', className: 'bg-gray-100 text-gray-600' },
    running: { label: '처리 중', className: 'bg-blue-100 text-blue-600' },
    completed: { label: '완료', className: 'bg-green-100 text-green-600' },
    error: { label: '오류', className: 'bg-red-100 text-red-600' },
  }[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <span className={cn('text-xs px-3 py-1 rounded-full font-medium', config.className)}>{config.label}</span>;
}

function StepStatusBadge({ status }: { status: StepStatus }) {
  const config = {
    pending: null,
    running: { label: '진행 중', className: 'bg-blue-100 text-blue-600' },
    completed: { label: '완료', className: 'bg-green-100 text-green-600' },
    error: { label: '오류', className: 'bg-red-100 text-red-600' },
  }[status];
  if (!config) return null;
  return <span className={cn('text-xs px-2 py-0.5 rounded-full', config.className)}>{config.label}</span>;
}

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">진행 상황 추적</h1>
        <p className="text-muted-foreground">발명 제안서의 처리 진행 상황을 확인합니다</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <TrackingContent />
      </Suspense>
    </div>
  );
}
