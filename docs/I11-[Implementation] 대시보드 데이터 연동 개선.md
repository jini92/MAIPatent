# I11 - 대시보드 데이터 연동 개선

> 작성일: 2026-01-12
> 분류: 아키텍처 개선
> 상태: 분석 완료, 구현 대기

---

## 1. 문제 개요

### 발견 배경
T04 E2E 테스트 수행 중 다음 이슈 발견:
- 폼 제출 후 생성된 명세서가 대시보드 목록에 표시되지 않음
- 대시보드 필드 정보가 폼 입력 필드와 불일치

### 현재 상태
- **대시보드**: Mock 데이터 8개만 표시 (하드코딩)
- **폼 제출**: n8n Webhook으로 전송되지만 조회 불가
- **데이터 영속성**: 없음 (GitHub Pages 정적 호스팅 제한)

---

## 2. 문제 분석

### 2.1. 데이터 플로우 현황

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  발명 제안서  │     │   n8n      │     │  Google    │
│  폼 제출     │────►│   WF01     │────►│  Drive     │
│             │     │  Webhook   │     │  (저장)     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ✗ 조회 연동 없음
                          │
┌─────────────┐     ┌─────────────┐
│  대시보드    │◄────│   Mock     │
│  (UI)       │     │   Data     │
└─────────────┘     └─────────────┘
```

### 2.2. 핵심 파일 분석

#### `web/src/hooks/useDashboardStats.ts`
```typescript
// Line 165-167: Mock 데이터만 사용
const refreshData = useCallback(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockData = generateMockPatents();  // ← 하드코딩된 8개
  setPatents(mockData);
}, []);
```

#### `web/src/lib/n8n-client.ts`
```typescript
// 정의되어 있지만 사용되지 않음
export async function listPatentSpecs(params?: {...}): Promise<{ items: PatentSpec[]; total: number }>
export async function getPatentSpec(patentId: string): Promise<PatentSpec>
```

### 2.3. 필드 불일치

| 폼 입력 (Step 1-4) | Patent 인터페이스 | 대시보드 표시 | 상태 |
|-------------------|------------------|--------------|------|
| inventionTitle | title | ✅ 표시 | 일치 |
| inventorName | inventorName | ✅ 표시 | 일치 |
| inventorAffiliation | ❌ 없음 | ❌ 미표시 | **누락** |
| inventorEmail | ❌ 없음 | ❌ 미표시 | **누락** |
| keywords | ❌ 없음 | ❌ 미표시 | **누락** |
| technicalField | ❌ 없음 | ❌ 미표시 | **누락** |
| - | wordCount | ✅ 표시 | Mock 전용 |
| - | revisionCount | ✅ 표시 | Mock 전용 |

---

## 3. 개선 방안

### Option A: Google Sheets 연동 (권장)

#### 아키텍처
```
폼 제출 → n8n WF01 → Google Sheets 저장
                         ↓
대시보드 ← n8n WF06 ← Google Sheets 조회
```

#### 장점
- 데이터 영속성 확보
- Google Drive 연동 이미 구현됨 (I09)
- n8n에서 Sheets 노드 지원
- 관리자가 직접 Sheets에서 데이터 확인/수정 가능

#### 구현 사항
1. **WF01 수정**: Google Sheets 저장 노드 추가
2. **WF06 신규**: 대시보드 데이터 조회 워크플로우
3. **useDashboardStats 수정**: 실제 API 호출

#### Google Sheets 스키마 (제안)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | string | PAT-XXX 형식 |
| title | string | 발명의 명칭 |
| inventorName | string | 발명자 성명 |
| affiliation | string | 소속 |
| email | string | 이메일 |
| status | string | draft/generating/reviewing/approved/rejected |
| technicalField | string | 기술 분야 |
| keywords | string | 키워드 (쉼표 구분) |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |
| executionId | string | n8n 실행 ID |

### Option B: localStorage 캐싱 (단기 해결)

#### 아키텍처
```
폼 제출 → localStorage 저장 + n8n 전송
           ↓
대시보드 ← localStorage 조회
```

#### 장점
- 빠른 구현 (1-2시간)
- 추가 인프라 불필요

#### 단점
- 브라우저 한정 (다른 기기에서 접근 불가)
- 데이터 영속성 제한 (브라우저 데이터 삭제 시 유실)
- 사용자 간 데이터 공유 불가

### Option C: Supabase/Firebase 연동 (장기)

#### 장점
- 완전한 백엔드 솔루션
- 실시간 동기화
- 인증 연동

#### 단점
- 추가 서비스 비용
- 구현 복잡도 증가

---

## 4. 권장 솔루션

### 단기 (즉시): Option B - localStorage
- 빠른 UX 개선
- Mock 데이터 대체

### 중기 (1주): Option A - Google Sheets
- 데이터 영속성 확보
- 기존 인프라 활용

### 장기 (필요시): Option C - Supabase
- 확장성 고려 시

---

## 5. 구현 로드맵

### Phase 1: 인터페이스 확장 (1일)
```typescript
// web/src/hooks/useDashboardStats.ts
export interface Patent {
  id: string;
  title: string;
  inventorName: string;
  affiliation?: string;      // 추가
  email?: string;            // 추가
  keywords?: string[];       // 추가
  technicalField?: string;   // 추가
  status: PatentStatus;
  createdAt: string;
  updatedAt: string;
  executionId?: string;      // 추가
}
```

### Phase 2: localStorage 연동 (0.5일)
```typescript
// web/src/lib/patent-storage.ts
export const savePatent = (patent: Patent) => {
  const patents = getPatents();
  patents.push(patent);
  localStorage.setItem('maipatent_patents', JSON.stringify(patents));
};

export const getPatents = (): Patent[] => {
  const data = localStorage.getItem('maipatent_patents');
  return data ? JSON.parse(data) : [];
};
```

### Phase 3: Google Sheets 연동 (2-3일)
1. WF01에 Sheets 저장 노드 추가
2. WF06 대시보드 조회 워크플로우 생성
3. useDashboardStats 훅 수정

---

## 6. 관련 파일

| 파일 | 역할 | 수정 필요 |
|------|------|----------|
| `web/src/hooks/useDashboardStats.ts` | 대시보드 데이터 관리 | ✅ |
| `web/src/types/invention.ts` | 타입 정의 | ✅ |
| `web/src/lib/n8n-client.ts` | n8n API 클라이언트 | ✅ |
| `web/src/components/forms/InventionForm.tsx` | 폼 제출 | ⚪ |
| `workflows/WF01-invention-input.json` | 발명 제안서 워크플로우 | ✅ |
| **신규** `workflows/WF06-dashboard-data.json` | 조회 워크플로우 | ✅ |

---

## 7. 관련 문서

| 문서 | 설명 |
|------|------|
| `docs/I09-[Implementation] Google Drive 연동.md` | 기존 Drive 연동 설정 |
| `docs/T04-[Test] E2E 시나리오 테스트 리포트 (내보내기 포함).md` | 이슈 발견 테스트 |
| `docs/A02-[Architecture] 시스템 아키텍처.md` | 전체 아키텍처 |

---

## 8. 결론

현재 대시보드는 Mock 데이터만 표시하여 실제 폼 제출 데이터가 반영되지 않습니다.

**권장 접근 방식**:
1. **즉시**: localStorage로 빠른 UX 개선
2. **1주 내**: Google Sheets 연동으로 데이터 영속성 확보
3. **필요시**: Supabase 등 완전한 백엔드 고려

이 개선을 통해 E2E 워크플로우의 완전성을 확보하고, 사용자 경험을 개선할 수 있습니다.

---

*문서 버전: 1.0.0*
*작성자: Claude Code*
