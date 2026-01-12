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

// 샘플 데이터로 초기화 (데모용)
export const initializeWithSampleData = (): void => {
  const existingPatents = getStoredPatents();
  if (existingPatents.length > 0) return; // 이미 데이터가 있으면 스킵

  const samplePatents: StoredPatent[] = [
    {
      id: 'PAT-001',
      title: '인공지능 기반 이미지 분류 시스템',
      inventorName: '이영희',
      affiliation: 'AI 연구소',
      email: 'lee@example.com',
      technicalField: '인공지능, 컴퓨터 비전',
      keywords: ['AI', '이미지', '분류'],
      status: 'generating',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-11',
      wordCount: 2500,
      revisionCount: 0,
    },
    {
      id: 'PAT-002',
      title: '블록체인 기반 디지털 인증 방법',
      inventorName: '정민우',
      affiliation: '보안 연구소',
      email: 'jung@example.com',
      technicalField: '블록체인, 보안',
      keywords: ['블록체인', '인증', '보안'],
      status: 'draft',
      createdAt: '2026-01-09',
      updatedAt: '2026-01-10',
      wordCount: 3200,
      revisionCount: 1,
    },
    {
      id: 'PAT-003',
      title: '자연어 처리를 이용한 문서 요약 장치',
      inventorName: '이영희',
      affiliation: 'NLP Lab',
      email: 'lee@example.com',
      technicalField: '자연어 처리',
      keywords: ['NLP', '요약', '문서'],
      status: 'draft',
      createdAt: '2026-01-08',
      updatedAt: '2026-01-09',
      wordCount: 2800,
      revisionCount: 0,
    },
    {
      id: 'PAT-004',
      title: '딥러닝 기반 음성 인식 시스템',
      inventorName: '이영희',
      affiliation: '음성 AI Lab',
      email: 'lee@example.com',
      technicalField: '딥러닝, 음성인식',
      keywords: ['딥러닝', '음성', 'STT'],
      status: 'approved',
      createdAt: '2026-01-05',
      updatedAt: '2026-01-12',
      wordCount: 4100,
      revisionCount: 2,
    },
    {
      id: 'PAT-005',
      title: 'IoT 센서 데이터 분석 플랫폼',
      inventorName: '최수현',
      affiliation: 'IoT Lab',
      email: 'choi@example.com',
      technicalField: 'IoT, 빅데이터',
      keywords: ['IoT', '센서', '분석'],
      status: 'reviewing',
      createdAt: '2026-01-07',
      updatedAt: '2026-01-11',
      wordCount: 3500,
      revisionCount: 1,
    },
    {
      id: 'PAT-006',
      title: '클라우드 기반 협업 도구',
      inventorName: '정민우',
      affiliation: '클라우드 연구소',
      email: 'jung@example.com',
      technicalField: '클라우드, SaaS',
      keywords: ['클라우드', '협업', 'SaaS'],
      status: 'generating',
      createdAt: '2026-01-11',
      updatedAt: '2026-01-12',
      wordCount: 2100,
      revisionCount: 0,
    },
    {
      id: 'PAT-007',
      title: '자율주행 차량 경로 최적화 알고리즘',
      inventorName: '최수현',
      affiliation: '자동차 연구소',
      email: 'choi@example.com',
      technicalField: '자율주행, 경로계획',
      keywords: ['자율주행', '경로', '최적화'],
      status: 'rejected',
      createdAt: '2026-01-03',
      updatedAt: '2026-01-08',
      wordCount: 3800,
      revisionCount: 3,
    },
    {
      id: 'PAT-008',
      title: '스마트 팩토리 예지 보전 시스템',
      inventorName: '박지민',
      affiliation: '스마트 제조 Lab',
      email: 'park@example.com',
      technicalField: '스마트팩토리, 예지보전',
      keywords: ['스마트팩토리', 'PdM', 'AI'],
      status: 'draft',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-11',
      wordCount: 2900,
      revisionCount: 0,
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePatents));
  window.dispatchEvent(new CustomEvent('patentsUpdated'));
};
