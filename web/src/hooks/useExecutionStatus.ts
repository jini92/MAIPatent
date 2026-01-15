'use client';

import { useState, useEffect, useCallback } from 'react';
import { updatePatentStatus, getStoredPatents } from '@/lib/patent-storage';
import { PatentStatus } from '@/hooks/useDashboardStats';

// 워크플로우 단계 상태
export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: {
    patentSpecId?: string;
    patentContent?: string;
    priorArts?: Array<{
      id: string;
      title: string;
      relevanceScore: number;
    }>;
  };
}

export interface ExecutionState {
  executionId: string;
  overallStatus: 'pending' | 'running' | 'completed' | 'error';
  currentStep: number;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  patentContent?: string;
}

// Mock 데이터 생성 (n8n API 연동 전 테스트용)
function createMockExecutionState(executionId: string, progressStage: number): ExecutionState {
  const now = new Date().toISOString();
  const steps: WorkflowStep[] = [
    {
      id: 'wf01',
      name: '발명 제안서 접수',
      description: '발명 제안서가 시스템에 등록되었습니다',
      status: progressStage >= 1 ? 'completed' : 'running',
      startedAt: now,
      completedAt: progressStage >= 1 ? now : undefined,
    },
    {
      id: 'wf02',
      name: '선행기술 검색',
      description: 'KIPRIS API를 통해 관련 선행기술을 검색합니다',
      status: progressStage >= 2 ? 'completed' : progressStage >= 1 ? 'running' : 'pending',
      startedAt: progressStage >= 1 ? now : undefined,
      completedAt: progressStage >= 2 ? now : undefined,
      output: progressStage >= 2 ? {
        priorArts: [
          { id: 'KR10-2023-0001234', title: '인공지능 기반 문서 생성 시스템', relevanceScore: 0.85 },
          { id: 'KR10-2022-0056789', title: '자동화된 특허 명세서 작성 방법', relevanceScore: 0.72 },
        ],
      } : undefined,
    },
    {
      id: 'wf03',
      name: '명세서 생성',
      description: 'AI가 KIPO 표준 특허 명세서를 생성합니다',
      status: progressStage >= 3 ? 'completed' : progressStage >= 2 ? 'running' : 'pending',
      startedAt: progressStage >= 2 ? now : undefined,
      completedAt: progressStage >= 3 ? now : undefined,
      output: progressStage >= 3 ? {
        patentSpecId: `patent-${executionId}`,
        patentContent: MOCK_PATENT_CONTENT,
      } : undefined,
    },
    {
      id: 'wf04',
      name: '검수 대기',
      description: '변리사/연구자의 검수를 기다립니다',
      status: progressStage >= 4 ? 'completed' : progressStage >= 3 ? 'running' : 'pending',
      startedAt: progressStage >= 3 ? now : undefined,
      completedAt: progressStage >= 4 ? now : undefined,
    },
  ];

  const currentStep = Math.min(progressStage, 3);
  const overallStatus = progressStage >= 4 ? 'completed' : progressStage >= 1 ? 'running' : 'pending';

  return {
    executionId,
    overallStatus,
    currentStep,
    steps,
    createdAt: now,
    updatedAt: now,
    patentContent: progressStage >= 3 ? MOCK_PATENT_CONTENT : undefined,
  };
}

// Mock 특허 명세서 내용
const MOCK_PATENT_CONTENT = `【발명의 명칭】
인공지능 기반 특허 명세서 자동 생성 시스템 및 방법

【기술분야】
본 발명은 인공지능을 활용한 특허 명세서 자동 생성 시스템에 관한 것으로, 보다 상세하게는 발명 제안서로부터 KIPO 표준 형식의 특허 명세서를 자동으로 생성하는 시스템 및 방법에 관한 것이다.

【배경기술】
종래의 특허 명세서 작성은 변리사가 발명자로부터 기술 내용을 전달받아 수동으로 작성하는 방식으로 이루어져 왔다. 이러한 방식은 시간과 비용이 많이 소요되며, 변리사의 전문성과 경험에 따라 품질 편차가 발생하는 문제점이 있었다.

【발명의 내용】

【해결하려는 과제】
본 발명은 상기와 같은 문제점을 해결하기 위하여 안출된 것으로서, 인공지능을 활용하여 발명 제안서로부터 자동으로 특허 명세서를 생성함으로써 작성 시간을 단축하고 품질 일관성을 확보하는 시스템을 제공하는 것을 목적으로 한다.

【과제의 해결 수단】
상기 목적을 달성하기 위한 본 발명의 일 측면에 따르면, 발명 제안서를 입력받는 입력 모듈(100); 상기 입력 모듈(100)로부터 전달받은 발명 제안서를 분석하여 기술적 특징을 추출하는 분석 모듈(200); 선행기술 데이터베이스를 검색하여 관련 선행기술을 추출하는 선행기술 검색 모듈(300); 및 상기 분석 모듈(200)과 상기 선행기술 검색 모듈(300)의 출력을 기반으로 KIPO 표준 형식의 특허 명세서를 생성하는 생성 모듈(400);을 포함하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템이 제공된다.

【발명의 효과】
본 발명에 따르면, 특허 명세서 작성 시간을 대폭 단축할 수 있으며, 일관된 품질의 명세서를 생성할 수 있는 효과가 있다. 또한, 변리사의 검토 부담을 줄이고 발명자와의 협업을 효율화할 수 있다.

【도면의 간단한 설명】
도 1은 본 발명의 일 실시예에 따른 특허 명세서 자동 생성 시스템의 구성도이다.
도 2는 본 발명의 일 실시예에 따른 특허 명세서 자동 생성 방법의 흐름도이다.

【특허청구범위】

【청구항 1】
발명 제안서를 입력받는 입력 모듈(100);
상기 입력 모듈(100)로부터 전달받은 발명 제안서를 분석하여 기술적 특징을 추출하는 분석 모듈(200);
선행기술 데이터베이스를 검색하여 관련 선행기술을 추출하는 선행기술 검색 모듈(300); 및
상기 분석 모듈(200)과 상기 선행기술 검색 모듈(300)의 출력을 기반으로 KIPO 표준 형식의 특허 명세서를 생성하는 생성 모듈(400);
을 포함하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템.

【청구항 2】
제1항에 있어서,
상기 분석 모듈(200)은 자연어 처리 기술을 활용하여 발명 제안서의 기술적 특징, 해결 과제, 및 기대 효과를 추출하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템.

【요약서】
【요약】
본 발명은 인공지능을 활용하여 발명 제안서로부터 KIPO 표준 형식의 특허 명세서를 자동으로 생성하는 시스템 및 방법에 관한 것이다. 입력 모듈, 분석 모듈, 선행기술 검색 모듈, 및 생성 모듈을 포함하여 특허 명세서 작성 시간을 단축하고 품질 일관성을 확보한다.

【대표도】
도 1
`;

interface UseExecutionStatusOptions {
  pollingInterval?: number; // ms, default 2000
  enableMock?: boolean; // 개발용 mock 데이터 사용
  mockProgressSpeed?: number; // mock 진행 속도 (초당 스테이지)
  patentId?: string; // localStorage 상태 동기화용 특허 ID
}

// 워크플로우 상태를 PatentStatus로 매핑
function mapWorkflowToPatentStatus(overallStatus: string, currentStep: number): PatentStatus {
  if (overallStatus === 'error') return 'rejected';
  if (overallStatus === 'completed') return 'reviewing'; // WF04 완료 = 검수 대기
  if (currentStep >= 3) return 'reviewing'; // WF03 완료 이후 = 검수 중
  if (currentStep >= 1) return 'generating'; // WF01~WF02 = 생성 중
  return 'draft';
}

// executionId로 localStorage에서 특허 찾기
// executionId가 PAT-XXX 형식이면 직접 ID로 사용, 아니면 executionId 필드로 검색
function findPatentByExecutionId(executionId: string): string | null {
  const patents = getStoredPatents();

  // PAT-XXX 형식이면 직접 ID로 사용
  if (executionId.startsWith('PAT-')) {
    const patent = patents.find(p => p.id === executionId);
    if (patent) return patent.id;
  }

  // executionId 필드로 검색
  const patent = patents.find(p => p.executionId === executionId);
  return patent?.id || null;
}

interface UseExecutionStatusReturn {
  state: ExecutionState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useExecutionStatus(
  executionId: string | null,
  options: UseExecutionStatusOptions = {}
): UseExecutionStatusReturn {
  const {
    pollingInterval = 2000,
    enableMock = true, // 기본적으로 mock 사용 (개발 단계)
    mockProgressSpeed = 3, // 3초마다 다음 스테이지
    patentId: providedPatentId,
  } = options;

  const [state, setState] = useState<ExecutionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mockStage, setMockStage] = useState(0);

  // Mock 모드에서 진행 상태 시뮬레이션
  useEffect(() => {
    if (!enableMock || !executionId) return;

    const timer = setInterval(() => {
      setMockStage((prev) => Math.min(prev + 1, 4));
    }, mockProgressSpeed * 1000);

    return () => clearInterval(timer);
  }, [enableMock, executionId, mockProgressSpeed]);

  // 워크플로우 상태 변경 시 localStorage 동기화
  useEffect(() => {
    if (!state || !executionId) {
      console.log('[useExecutionStatus] Skipping: no state or executionId', { state: !!state, executionId });
      return;
    }

    // 제공된 patentId 또는 executionId로 특허 찾기
    const patentId = providedPatentId || findPatentByExecutionId(executionId);
    console.log('[useExecutionStatus] Finding patent:', { providedPatentId, executionId, foundPatentId: patentId });

    if (!patentId) {
      console.log('[useExecutionStatus] No patentId found, skipping update');
      return;
    }

    // 워크플로우 상태를 PatentStatus로 변환
    const newStatus = mapWorkflowToPatentStatus(state.overallStatus, state.currentStep);

    // localStorage 업데이트
    const result = updatePatentStatus(patentId, newStatus);

    console.log(`[useExecutionStatus] Patent ${patentId} status updated to: ${newStatus}`, {
      overallStatus: state.overallStatus,
      currentStep: state.currentStep,
      updateResult: !!result
    });
  }, [state, executionId, providedPatentId]);

  // 실제 API 호출 또는 Mock 데이터 반환
  const fetchStatus = useCallback(async () => {
    if (!executionId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (enableMock) {
        // Mock 데이터 사용
        const mockState = createMockExecutionState(executionId, mockStage);
        setState(mockState);
      } else {
        // 실제 API 호출
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/execution-status/${executionId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch execution status: ${response.statusText}`);
        }

        const data = await response.json();
        setState(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [executionId, enableMock, mockStage]);

  // 초기 로드 및 폴링
  useEffect(() => {
    if (!executionId) {
      setState(null);
      return;
    }

    fetchStatus();

    // 완료되지 않은 경우에만 폴링
    const shouldPoll = state?.overallStatus !== 'completed' && state?.overallStatus !== 'error';

    if (shouldPoll || !state) {
      const interval = setInterval(fetchStatus, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [executionId, fetchStatus, pollingInterval, state?.overallStatus]);

  return {
    state,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
