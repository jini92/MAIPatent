'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getStoredPatents,
  initializeWithSampleData,
  StoredPatent,
} from '@/lib/patent-storage';

// 명세서 상태 타입
export type PatentStatus = 'draft' | 'generating' | 'reviewing' | 'approved' | 'rejected';

// 명세서 데이터 타입 (확장된 필드 포함)
export interface Patent {
  id: string;
  title: string;
  inventorName: string;
  affiliation?: string;
  email?: string;
  technicalField?: string;
  keywords?: string[];
  status: PatentStatus;
  createdAt: string;
  updatedAt: string;
  executionId?: string;
  wordCount?: number;
  revisionCount?: number;
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

// StoredPatent를 Patent로 변환
const convertStoredPatentToPatent = (stored: StoredPatent): Patent => ({
  id: stored.id,
  title: stored.title,
  inventorName: stored.inventorName,
  affiliation: stored.affiliation,
  email: stored.email,
  technicalField: stored.technicalField,
  keywords: stored.keywords,
  status: stored.status,
  createdAt: stored.createdAt,
  updatedAt: stored.updatedAt,
  executionId: stored.executionId,
  wordCount: stored.wordCount,
  revisionCount: stored.revisionCount,
});

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

  // 데이터 로드 (localStorage에서)
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 샘플 데이터 초기화 (데이터가 없을 경우만)
      initializeWithSampleData();

      // localStorage에서 특허 데이터 로드
      const storedPatents = getStoredPatents();
      const patentData = storedPatents.map(convertStoredPatentToPatent);
      setPatents(patentData);
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

  // localStorage 변경 감지 (다른 탭/컴포넌트에서의 변경)
  useEffect(() => {
    const handlePatentsUpdated = () => {
      refreshData();
    };

    window.addEventListener('patentsUpdated', handlePatentsUpdated);
    return () => {
      window.removeEventListener('patentsUpdated', handlePatentsUpdated);
    };
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
