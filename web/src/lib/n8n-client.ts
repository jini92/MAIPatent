// n8n Cloud Webhook API 클라이언트

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://mai-n8n.app.n8n.cloud/webhook';

// WF05 Production URL 사용 (2026-01-16 n8n UI에서 JSON import로 재생성 완료)
// 참고: T12 테스트 리포트 - API 생성 워크플로우 404 이슈 해결됨

export interface InventionData {
  inventionTitle: string;
  inventorName: string;
  inventorAffiliation: string;
  technicalField: string;
  inventionSummary: string;
  technicalProblem: string;
  proposedSolution: string;
  expectedEffects: string;
  keywords?: string[];
  drawings?: string[];
  drawingDescriptions?: string[];
}

export interface PriorArtSearchResult {
  id: string;
  title: string;
  applicant: string;
  applicationDate: string;
  relevanceScore: number;
  summary: string;
}

export interface PatentSpec {
  id: string;
  title: string;
  status: 'draft' | 'reviewing' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  content?: string;
  priorArts?: PriorArtSearchResult[];
}

export interface ExecutionStatus {
  id: string;
  status: 'pending' | 'running' | 'success' | 'error';
  workflowName: string;
  startedAt: string;
  finishedAt?: string;
  data?: unknown;
}

// WF01 응답 타입
export interface SubmitInventionResponse {
  success: boolean;
  patent_id: string;
  submission_id: string;
  message: string;
  drive_url?: string;
}

// WF01: 발명 제안서 제출
export async function submitInvention(data: InventionData): Promise<SubmitInventionResponse> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf01-invention-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invention: data }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit invention: ${response.statusText}`);
  }

  const result = await response.json();

  // WF01 응답 정규화 (다양한 응답 형식 호환)
  return {
    success: result.success ?? true,
    patent_id: result.patent_id || result.patentId || result.id || '',
    submission_id: result.submission_id || result.submissionId || '',
    message: result.message || '제출이 완료되었습니다.',
    drive_url: result.drive_url || result.driveUrl,
  };
}

// WF02: 선행기술 검색 트리거
export async function triggerPriorArtSearch(inventionId: string): Promise<{ executionId: string }> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf02-prior-art-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inventionId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger prior art search: ${response.statusText}`);
  }

  return response.json();
}

// WF03: 명세서 생성 트리거
export async function triggerPatentGeneration(
  inventionId: string,
  priorArts: PriorArtSearchResult[]
): Promise<{ executionId: string }> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf03-generate-patent-spec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inventionId, priorArts }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger patent generation: ${response.statusText}`);
  }

  return response.json();
}

// WF04: 검수 요청
export async function submitReview(
  patentId: string,
  reviewData: {
    status: 'approved' | 'revision' | 'rejected';
    feedback?: string;
    sections?: Record<string, string>;
  }
): Promise<{ success: boolean }> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf04-review-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ patentId, ...reviewData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit review: ${response.statusText}`);
  }

  return response.json();
}

// 실행 상태 조회 (폴링용)
export async function getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/execution-status/${executionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get execution status: ${response.statusText}`);
  }

  return response.json();
}

// 특허 명세서 조회
export async function getPatentSpec(patentId: string): Promise<PatentSpec> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/patent/${patentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get patent spec: ${response.statusText}`);
  }

  return response.json();
}

// 특허 명세서 목록 조회
export async function listPatentSpecs(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: PatentSpec[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const url = `${N8N_WEBHOOK_URL}/patents?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list patent specs: ${response.statusText}`);
  }

  return response.json();
}

// WF05: 문서 내보내기 (DOCX/PDF 생성)
export interface ExportOptions {
  format: 'docx' | 'pdf' | 'hwp' | 'markdown';
  includeDrawings: boolean;
  includeMetadata: boolean;
  watermark: boolean;
  template: 'standard' | 'detailed' | 'minimal';
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  driveUrl?: string;
  fileId?: string;
  filename?: string;
  format?: string;
  message?: string;
  error?: 'FILE_NOT_FOUND' | 'FORMAT_NOT_SUPPORTED' | string;
}

export async function exportPatentDocument(
  patentId: string,
  options: ExportOptions
): Promise<ExportResponse> {
  // WF05: n8n Cloud webhook path는 wf05-export-v2 (2026-01-16 확인)
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf05-export-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ patentId, ...options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to export document: ${response.statusText}`);
  }

  return response.json();
}
