'use client';

import { useState, useCallback } from 'react';

// 검수 상태 타입
export type ReviewStatus = 'pending' | 'approved' | 'revision_needed' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';

// 섹션별 피드백 타입
export interface SectionFeedback {
  sectionId: string;
  sectionName: string;
  content: string;
  timestamp: string;
  resolved: boolean;
}

// 검수 데이터 타입
export interface ReviewData {
  reviewId: string;
  submissionId: string;
  status: ReviewStatus;
  priority: Priority;
  specification: string;
  sections: {
    claims: string;
    description: string;
    drawingDescription: string;
    abstract: string;
  };
  feedback: {
    claims: string;
    description: string;
    drawings: string;
    general: string;
  };
  comments: SectionFeedback[];
  metadata: {
    wordCount: number;
    generatedAt: string;
    reviewRequestedAt: string;
  };
  revisionNumber: number;
}

// 검수 상태 훅 옵션
export interface UseReviewStateOptions {
  initialData?: Partial<ReviewData>;
  onStatusChange?: (status: ReviewStatus) => void;
  onSubmit?: (data: ReviewData) => Promise<void>;
}

// 검수 상태 훅 반환 타입
export interface UseReviewStateReturn {
  reviewData: ReviewData;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  // 상태 변경
  setStatus: (status: ReviewStatus) => void;
  setPriority: (priority: Priority) => void;
  // 피드백 관련
  updateFeedback: (section: keyof ReviewData['feedback'], content: string) => void;
  addComment: (comment: Omit<SectionFeedback, 'timestamp'>) => void;
  resolveComment: (sectionId: string) => void;
  // 섹션 편집
  updateSection: (section: keyof ReviewData['sections'], content: string) => void;
  // 제출
  submitReview: () => Promise<void>;
  // 리셋
  resetReview: () => void;
}

// Mock 초기 데이터
const createMockReviewData = (): ReviewData => ({
  reviewId: `REV-${Date.now()}`,
  submissionId: 'GEN-001',
  status: 'pending',
  priority: 'medium',
  specification: `# 특허 명세서

【발명의 명칭】
인공지능 기반 특허 명세서 자동 생성 시스템 및 방법

【기술분야】
본 발명은 인공지능 기술을 활용한 특허 명세서 자동 생성 시스템에 관한 것으로, 보다 상세하게는 발명 제안서를 입력받아 KIPO 표준 형식의 특허 명세서를 자동으로 생성하는 시스템 및 방법에 관한 것이다.

【배경기술】
종래의 특허 명세서 작성은 발명자가 제출한 발명 제안서를 바탕으로 변리사가 수동으로 작성하는 방식으로 진행되어 왔다. 이러한 방식은 많은 시간과 비용이 소요되며, 변리사의 숙련도에 따라 명세서의 품질이 달라지는 문제가 있었다.

【발명의 내용】
【해결하려는 과제】
본 발명은 상기와 같은 문제점을 해결하기 위하여 안출된 것으로서, 인공지능을 활용하여 발명 제안서로부터 고품질의 특허 명세서를 자동으로 생성하는 시스템 및 방법을 제공하는 것을 목적으로 한다.

【과제의 해결 수단】
상기 목적을 달성하기 위한 본 발명의 일 측면에 따르면, 발명 제안서를 수신하는 입력 모듈(100); 상기 발명 제안서를 분석하여 기술 분야 및 핵심 구성요소를 추출하는 분석 모듈(200); 추출된 정보를 바탕으로 청구항을 생성하는 청구항 생성 모듈(300); 및 KIPO 표준 형식에 따라 특허 명세서를 조립하는 명세서 조립 모듈(400);을 포함하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템이 제공된다.

【발명의 효과】
본 발명에 따르면, 발명 제안서로부터 자동으로 특허 명세서를 생성할 수 있어 명세서 작성 시간을 대폭 단축하고 일관된 품질의 명세서를 제공할 수 있는 효과가 있다.`,
  sections: {
    claims: `【청구항 1】
발명 제안서를 수신하는 입력 모듈(100);
상기 발명 제안서를 분석하여 기술 분야 및 핵심 구성요소를 추출하는 분석 모듈(200);
추출된 정보를 바탕으로 청구항을 생성하는 청구항 생성 모듈(300); 및
KIPO 표준 형식에 따라 특허 명세서를 조립하는 명세서 조립 모듈(400);
을 포함하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템.

【청구항 2】
제1항에 있어서,
상기 분석 모듈(200)은 자연어 처리(NLP) 엔진을 포함하는 것을 특징으로 하는 인공지능 기반 특허 명세서 자동 생성 시스템.`,
    description: `【기술분야】
본 발명은 인공지능 기술을 활용한 특허 명세서 자동 생성 시스템에 관한 것이다.

【배경기술】
종래의 특허 명세서 작성은 수동으로 진행되어 많은 시간과 비용이 소요되었다.`,
    drawingDescription: `【도면의 간단한 설명】
도 1은 본 발명의 일 실시예에 따른 시스템의 전체 구성도이다.
도 2는 본 발명의 일 실시예에 따른 처리 흐름도이다.`,
    abstract: `【요약】
본 발명은 발명 제안서를 입력받아 KIPO 표준 형식의 특허 명세서를 자동으로 생성하는 인공지능 기반 시스템 및 방법에 관한 것이다.`
  },
  feedback: {
    claims: '',
    description: '',
    drawings: '',
    general: ''
  },
  comments: [],
  metadata: {
    wordCount: 850,
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewRequestedAt: new Date().toISOString()
  },
  revisionNumber: 0
});

export function useReviewState(options: UseReviewStateOptions = {}): UseReviewStateReturn {
  const { initialData, onStatusChange, onSubmit } = options;

  const [reviewData, setReviewData] = useState<ReviewData>(() => ({
    ...createMockReviewData(),
    ...initialData
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상태 변경
  const setStatus = useCallback((status: ReviewStatus) => {
    setReviewData(prev => ({ ...prev, status }));
    onStatusChange?.(status);
  }, [onStatusChange]);

  const setPriority = useCallback((priority: Priority) => {
    setReviewData(prev => ({ ...prev, priority }));
  }, []);

  // 피드백 업데이트
  const updateFeedback = useCallback((section: keyof ReviewData['feedback'], content: string) => {
    setReviewData(prev => ({
      ...prev,
      feedback: { ...prev.feedback, [section]: content }
    }));
  }, []);

  // 코멘트 추가
  const addComment = useCallback((comment: Omit<SectionFeedback, 'timestamp'>) => {
    const newComment: SectionFeedback = {
      ...comment,
      timestamp: new Date().toISOString()
    };
    setReviewData(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
  }, []);

  // 코멘트 해결
  const resolveComment = useCallback((sectionId: string) => {
    setReviewData(prev => ({
      ...prev,
      comments: prev.comments.map(c =>
        c.sectionId === sectionId ? { ...c, resolved: true } : c
      )
    }));
  }, []);

  // 섹션 업데이트
  const updateSection = useCallback((section: keyof ReviewData['sections'], content: string) => {
    setReviewData(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: content }
    }));
  }, []);

  // 검수 제출
  const submitReview = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(reviewData);
      } else {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Review submitted:', reviewData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검수 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [reviewData, onSubmit]);

  // 리셋
  const resetReview = useCallback(() => {
    setReviewData(createMockReviewData());
    setError(null);
  }, []);

  return {
    reviewData,
    isLoading,
    isSubmitting,
    error,
    setStatus,
    setPriority,
    updateFeedback,
    addComment,
    resolveComment,
    updateSection,
    submitReview,
    resetReview
  };
}
