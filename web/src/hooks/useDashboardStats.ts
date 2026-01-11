'use client';

import { useState, useEffect, useCallback } from 'react';

// 명세서 상태 타입
export type PatentStatus = 'draft' | 'generating' | 'reviewing' | 'approved' | 'rejected';

// 명세서 데이터 타입
export interface Patent {
  id: string;
  title: string;
  inventorName: string;
  status: PatentStatus;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  revisionCount: number;
}

// 대시보드 통계 타입
export interface DashboardStats {
  total: number;
  draft: number;
  generating: number;
  reviewing: number;
  approved: number;
  rejected: number;
  thisWeek: number;
  thisMonth: number;
}

// 필터 옵션 타입
export interface PatentFilters {
  status?: PatentStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 훅 반환 타입
export interface UseDashboardStatsReturn {
  stats: DashboardStats;
  patents: Patent[];
  filteredPatents: Patent[];
  isLoading: boolean;
  error: string | null;
  filters: PatentFilters;
  setFilters: (filters: PatentFilters) => void;
  refreshData: () => Promise<void>;
}

// Mock 데이터 생성
const generateMockPatents = (): Patent[] => {
  const titles = [
    '인공지능 기반 이미지 분류 시스템',
    '블록체인 기반 디지털 인증 방법',
    '자연어 처리를 이용한 문서 요약 장치',
    '딥러닝 기반 음성 인식 시스템',
    'IoT 센서 데이터 분석 플랫폼',
    '클라우드 기반 협업 도구',
    '자율주행 차량 경로 최적화 알고리즘',
    '스마트 팩토리 예지 보전 시스템',
  ];

  const statuses: PatentStatus[] = ['draft', 'generating', 'reviewing', 'approved', 'rejected'];
  const names = ['김철수', '이영희', '박지민', '최수현', '정민우'];

  return titles.map((title, index) => {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    const updatedDate = new Date(createdDate);
    updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 5));

    return {
      id: `PAT-${String(index + 1).padStart(3, '0')}`,
      title,
      inventorName: names[Math.floor(Math.random() * names.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: createdDate.toISOString().split('T')[0],
      updatedAt: updatedDate.toISOString().split('T')[0],
      wordCount: 2000 + Math.floor(Math.random() * 3000),
      revisionCount: Math.floor(Math.random() * 3),
    };
  });
};

// 통계 계산
const calculateStats = (patents: Patent[]): DashboardStats => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: patents.length,
    draft: patents.filter(p => p.status === 'draft').length,
    generating: patents.filter(p => p.status === 'generating').length,
    reviewing: patents.filter(p => p.status === 'reviewing').length,
    approved: patents.filter(p => p.status === 'approved').length,
    rejected: patents.filter(p => p.status === 'rejected').length,
    thisWeek: patents.filter(p => new Date(p.createdAt) >= weekAgo).length,
    thisMonth: patents.filter(p => new Date(p.createdAt) >= monthAgo).length,
  };
};

// 필터링 로직
const applyFilters = (patents: Patent[], filters: PatentFilters): Patent[] => {
  let result = [...patents];

  // 상태 필터
  if (filters.status && filters.status !== 'all') {
    result = result.filter(p => p.status === filters.status);
  }

  // 검색 필터
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(searchLower) ||
      p.inventorName.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower)
    );
  }

  // 날짜 필터
  if (filters.dateFrom) {
    result = result.filter(p => p.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter(p => p.createdAt <= filters.dateTo!);
  }

  // 정렬
  const sortBy = filters.sortBy || 'updatedAt';
  const sortOrder = filters.sortOrder || 'desc';
  result.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return result;
};

export function useDashboardStats(): UseDashboardStatsReturn {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PatentFilters>({
    status: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // 데이터 로드
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = generateMockPatents();
      setPatents(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 통계 계산
  const stats = calculateStats(patents);

  // 필터링된 목록
  const filteredPatents = applyFilters(patents, filters);

  return {
    stats,
    patents,
    filteredPatents,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData,
  };
}
