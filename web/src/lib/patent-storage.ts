'use client';

import { PatentStatus } from '@/hooks/useDashboardStats';

// 확장된 명세서 데이터 타입 (폼 필드 포함)
export interface StoredPatent {
  id: string;
  title: string;
  inventorName: string;
  affiliation: string;
  email: string;
  technicalField: string;
  keywords: string[];
  status: PatentStatus;
  createdAt: string;
  updatedAt: string;
  executionId?: string;
  // 추가 메타데이터
  wordCount?: number;
  revisionCount?: number;
}

// localStorage 키
const STORAGE_KEY = 'maipatent_patents';

// ID 생성 (PAT-XXX 형식)
const generatePatentId = (): string => {
  const patents = getStoredPatents();
  const maxId = patents.reduce((max, p) => {
    const num = parseInt(p.id.replace('PAT-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `PAT-${String(maxId + 1).padStart(3, '0')}`;
};

// 모든 특허 조회
export const getStoredPatents = (): StoredPatent[] => {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read patents from localStorage:', error);
    return [];
  }
};

// 특허 저장
export const savePatent = (patent: Omit<StoredPatent, 'id' | 'createdAt' | 'updatedAt'>): StoredPatent => {
  const patents = getStoredPatents();
  const now = new Date().toISOString().split('T')[0];

  const newPatent: StoredPatent = {
    ...patent,
    id: generatePatentId(),
    createdAt: now,
    updatedAt: now,
  };

  patents.push(newPatent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patents));

  // storage 이벤트 발생 (다른 탭/컴포넌트에서 감지)
  window.dispatchEvent(new CustomEvent('patentsUpdated', { detail: newPatent }));

  return newPatent;
};

// 특허 업데이트
export const updatePatent = (id: string, updates: Partial<StoredPatent>): StoredPatent | null => {
  const patents = getStoredPatents();
  const index = patents.findIndex(p => p.id === id);

  if (index === -1) return null;

  const now = new Date().toISOString().split('T')[0];
  patents[index] = {
    ...patents[index],
    ...updates,
    updatedAt: now,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(patents));
  window.dispatchEvent(new CustomEvent('patentsUpdated', { detail: patents[index] }));

  return patents[index];
};

// 특허 상태 변경
export const updatePatentStatus = (id: string, status: PatentStatus): StoredPatent | null => {
  return updatePatent(id, { status });
};

// 단일 특허 조회
export const getPatentById = (id: string): StoredPatent | null => {
  const patents = getStoredPatents();
  return patents.find(p => p.id === id) || null;
};

// 특허 삭제
export const deletePatent = (id: string): boolean => {
  const patents = getStoredPatents();
  const filtered = patents.filter(p => p.id !== id);

  if (filtered.length === patents.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('patentsUpdated'));

  return true;
};

// 폼 데이터에서 저장용 특허 객체 생성
export const createPatentFromFormData = (
  formData: {
    inventionTitle: string;
    inventorName: string;
    inventorAffiliation: string;
    inventorEmail?: string;
    technicalField: string;
    keywords?: string | string[];
    inventionSummary?: string;
  },
  executionId?: string
): Omit<StoredPatent, 'id' | 'createdAt' | 'updatedAt'> => {
  // 단어 수 계산 (발명 요약 기준)
  const wordCount = formData.inventionSummary
    ? formData.inventionSummary.replace(/\s+/g, ' ').trim().length
    : 0;

  return {
    title: formData.inventionTitle,
    inventorName: formData.inventorName,
    affiliation: formData.inventorAffiliation,
    email: formData.inventorEmail || '',
    technicalField: formData.technicalField,
    keywords: typeof formData.keywords === 'string'
      ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : formData.keywords || [],
    status: 'generating' as PatentStatus,
    executionId,
    wordCount,
    revisionCount: 0,
  };
};

// localStorage 초기화 (테스트용)
export const clearAllPatents = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('patentsUpdated'));
};

// 샘플 데이터 초기화 (제거됨 - 실제 데이터만 사용)
export const initializeWithSampleData = (): void => {
  // 샘플 데이터 초기화 비활성화 - 실제 제출된 데이터만 표시
  // 기존 localStorage 데이터가 있으면 유지, 없으면 빈 배열로 시작
};

// 오래된 "생성 중" 상태 특허 정리 (7일 이상 경과)
export const cleanupStaleGeneratingPatents = (): number => {
  const patents = getStoredPatents();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const stalePatents = patents.filter(
    p => p.status === 'generating' && p.createdAt < sevenDaysAgoStr
  );

  if (stalePatents.length > 0) {
    // 오래된 생성 중 특허를 rejected로 변경 (타임아웃 처리)
    stalePatents.forEach(p => {
      updatePatentStatus(p.id, 'rejected');
    });
    console.log(`[cleanupStaleGeneratingPatents] Marked ${stalePatents.length} stale patents as rejected`);
  }

  return stalePatents.length;
};

// 모든 "생성 중" 특허를 "검수 대기"로 강제 업데이트 (마이그레이션용)
export const migrateGeneratingToReviewing = (): number => {
  const patents = getStoredPatents();
  const generatingPatents = patents.filter(p => p.status === 'generating');

  generatingPatents.forEach(p => {
    updatePatentStatus(p.id, 'reviewing');
  });

  if (generatingPatents.length > 0) {
    console.log(`[migrateGeneratingToReviewing] Migrated ${generatingPatents.length} patents to reviewing status`);
  }

  return generatingPatents.length;
};
