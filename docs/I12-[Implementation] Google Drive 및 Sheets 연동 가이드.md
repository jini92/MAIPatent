# I12-[Implementation] Google Drive 및 Sheets 연동 가이드

> 작성일: 2026-01-13
> 목적: 단계별 문서 저장 및 데이터베이스 연동 구현
> 우선순위: HIGH

---

## 1. 현재 상태 분석

### 1.1. 문제점

| 구성요소 | 현재 상태 | 문제점 |
|----------|----------|--------|
| 데이터 저장 | localStorage | 5MB 제한, 브라우저 의존, 기기 간 동기화 불가 |
| Google Drive | 환경변수만 설정 | n8n 워크플로우에 저장 노드 미구현 |
| Google Sheets | 환경변수만 설정 | 실제 연동 미구현 |
| 파일 내보내기 | Mock 구현 | DOCX/PDF 변환 미구현 |

### 1.2. 사용자 요구사항

단계별로 다음 Google Drive 폴더에 문서 저장:
```
G:\My Drive\MAIPatent\
├── 01_발명제안서/   → 발명 제안서 JSON/PDF
├── 02_선행기술/     → 선행기술 검색 결과
├── 03_명세서초안/   → 생성된 명세서 초안 (Markdown)
├── 04_승인문서/     → 검수 승인된 최종 문서
└── 05_반려문서/     → 검수 반려된 문서
```

### 1.3. 이미 설정된 리소스

**환경변수 (.env)**:
```bash
# Google Drive 폴더 ID
GOOGLE_DRIVE_ROOT_FOLDER_ID=10_1J2-NTVLf1w3hXz0d1fHN6f_OCBmzQ
GOOGLE_DRIVE_PROPOSAL_FOLDER_ID=1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p      # 01_발명제안서
GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID=1CO63_auDraZymK7sBNfmN8jLZzauyyE7     # 02_선행기술
GOOGLE_DRIVE_DRAFT_FOLDER_ID=1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX        # 03_명세서초안
GOOGLE_DRIVE_APPROVED_FOLDER_ID=19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a     # 04_승인문서
GOOGLE_DRIVE_REJECTED_FOLDER_ID=1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg     # 05_반려문서

# Google Sheets (데이터베이스 역할)
GOOGLE_SHEETS_TRACKING_ID=1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI
```

---

## 2. 목표 아키텍처

### 2.1. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [사용자 입력]                                                   │
│       │                                                          │
│       ▼                                                          │
│  [n8n Webhook] ─────┬────────────────────────────────────────   │
│                     │                                            │
│       ┌─────────────┼─────────────┐                             │
│       ▼             ▼             ▼                             │
│  [Google Sheets]  [Google Drive]  [localStorage]                │
│  (메타데이터)      (문서 저장)     (UI 캐시)                     │
│                                                                  │
│       │             │                                            │
│       └─────────────┼─────────────┘                             │
│                     ▼                                            │
│              [프론트엔드 대시보드]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. 워크플로우별 저장 위치

| 워크플로우 | Google Sheets | Google Drive | 설명 |
|-----------|---------------|--------------|------|
| WF01 | 신규 행 추가 | 01_발명제안서 | 제출 시 메타데이터 + 원본 저장 |
| WF02 | URL 업데이트 | 02_선행기술 | 검색 결과 저장 |
| WF03 | 상태 업데이트 | 03_명세서초안 | 생성된 명세서 저장 |
| WF04 (승인) | 상태: approved | 04_승인문서 | 최종 승인 문서 |
| WF04 (반려) | 상태: rejected | 05_반려문서 | 반려 사유 포함 |

---

## 3. Google Sheets 스키마

### 3.1. 제출이력 시트 구조

| 열 | 필드명 | 타입 | 설명 | 예시 |
|----|--------|------|------|------|
| A | Patent ID | String | 고유 ID | PAT-001 |
| B | 발명 명칭 | String | 발명 제목 | AI 기반 특허 명세서 생성 시스템 |
| C | 발명자 | String | 발명자 이름 | 홍길동 |
| D | 소속 | String | 소속 기관 | ABC 연구소 |
| E | 이메일 | String | 연락처 | hong@example.com |
| F | 기술분야 | String | 기술 분류 | 소프트웨어/AI |
| G | 키워드 | String | 쉼표 구분 | AI, 특허, 자동화 |
| H | 상태 | Enum | 현재 상태 | draft/generating/reviewing/approved/rejected |
| I | 제출일 | DateTime | 제출 시각 | 2026-01-13T10:30:00 |
| J | 수정일 | DateTime | 최종 수정 | 2026-01-13T15:45:00 |
| K | 발명제안서 URL | URL | Drive 링크 | https://drive.google.com/... |
| L | 선행기술 URL | URL | Drive 링크 | https://drive.google.com/... |
| M | 명세서초안 URL | URL | Drive 링크 | https://drive.google.com/... |
| N | 최종문서 URL | URL | Drive 링크 | https://drive.google.com/... |
| O | 검수 결과 | String | 검수 상태 | 승인/수정요청/반려 |
| P | 검수 피드백 | String | 검수 의견 | 청구항 수정 필요 |
| Q | 수정 횟수 | Number | 리비전 | 2 |

### 3.2. 초기 시트 설정

Google Sheets에 다음 헤더 행을 추가해야 합니다:

```
Patent ID | 발명 명칭 | 발명자 | 소속 | 이메일 | 기술분야 | 키워드 | 상태 | 제출일 | 수정일 | 발명제안서 URL | 선행기술 URL | 명세서초안 URL | 최종문서 URL | 검수 결과 | 검수 피드백 | 수정 횟수
```

---

## 4. n8n 워크플로우 수정 가이드

### 4.1. WF01-invention-input.json 수정

**추가할 노드**:

```
[기존: 출력 데이터 설정]
       │
       ▼
[신규: JSON to Binary] ← 발명 제안서 JSON 변환
       │
       ▼
[신규: Google Drive Upload] ← 01_발명제안서 폴더에 저장
       │
       ▼
[신규: Google Sheets Append] ← 메타데이터 행 추가
       │
       ▼
[기존: WF02 호출]
```

**Google Sheets Append 노드 설정**:
```json
{
  "operation": "appendOrUpdate",
  "documentId": "{{ $env.GOOGLE_SHEETS_TRACKING_ID }}",
  "sheetName": "제출이력",
  "columns": {
    "Patent ID": "={{ $json.patent_id }}",
    "발명 명칭": "={{ $json.invention_title }}",
    "발명자": "={{ $json.inventor_name }}",
    "소속": "={{ $json.affiliation }}",
    "이메일": "={{ $json.email }}",
    "기술분야": "={{ $json.technical_field }}",
    "키워드": "={{ $json.keywords.join(', ') }}",
    "상태": "generating",
    "제출일": "={{ $now.toISO() }}",
    "발명제안서 URL": "={{ $json.drive_url }}"
  }
}
```

**Google Drive Upload 노드 설정**:
```json
{
  "operation": "upload",
  "folderId": "{{ $env.GOOGLE_DRIVE_PROPOSAL_FOLDER_ID }}",
  "fileName": "발명제안서_{{ $json.patent_id }}.json",
  "mimeType": "application/json"
}
```

### 4.2. WF03-patent-generation.json 수정

**추가할 노드**:

```
[기존: KIPO 포맷 조립]
       │
       ▼
[신규: Text to Binary] ← Markdown 바이너리 변환
       │
       ▼
[신규: Google Drive Upload] ← 03_명세서초안 폴더에 저장
       │
       ▼
[신규: Google Sheets Update] ← 상태: reviewing, URL 업데이트
       │
       ▼
[기존: WF04 호출]
```

**Google Sheets Update 노드 설정**:
```json
{
  "operation": "update",
  "documentId": "{{ $env.GOOGLE_SHEETS_TRACKING_ID }}",
  "sheetName": "제출이력",
  "lookupColumn": "Patent ID",
  "lookupValue": "={{ $json.patent_id }}",
  "columns": {
    "상태": "reviewing",
    "명세서초안 URL": "={{ $json.draft_drive_url }}",
    "수정일": "={{ $now.toISO() }}"
  }
}
```

### 4.3. WF04-human-review.json 수정

**승인 브랜치 추가 노드**:
```
[승인 분기]
     │
     ▼
[Google Drive Upload] ← 04_승인문서 폴더
     │
     ▼
[Google Sheets Update] ← 상태: approved
```

**반려 브랜치 추가 노드**:
```
[반려 분기]
     │
     ▼
[Google Drive Upload] ← 05_반려문서 폴더
     │
     ▼
[Google Sheets Update] ← 상태: rejected
```

---

## 5. 프론트엔드 리팩토링 가이드

### 5.1. 새로운 API 함수 (n8n-client.ts)

```typescript
// Google Sheets에서 특허 목록 조회
export async function listPatentsFromSheets(): Promise<Patent[]> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/patents-list`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}

// 단일 특허 상세 조회
export async function getPatentFromSheets(patentId: string): Promise<Patent> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/patent/${patentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}

// Google Drive 문서 URL 조회
export async function getDocumentUrls(patentId: string): Promise<DocumentUrls> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/patent/${patentId}/documents`, {
    method: 'GET'
  });
  return response.json();
}
```

### 5.2. useDashboardStats.ts 수정

```typescript
// 기존: localStorage에서 직접 로드
// const patents = getStoredPatents();

// 변경: Google Sheets API 호출 + localStorage 캐시
const refreshData = useCallback(async () => {
  setIsLoading(true);
  try {
    // 1. 캐시된 데이터 즉시 표시 (빠른 초기 렌더링)
    const cached = getStoredPatents();
    if (cached.length > 0) {
      setPatents(cached);
    }

    // 2. 서버에서 최신 데이터 가져오기
    const serverPatents = await listPatentsFromSheets();

    // 3. 캐시 업데이트 및 UI 반영
    savePatentsToCache(serverPatents);
    setPatents(serverPatents);
  } catch (error) {
    console.error('Failed to refresh from server:', error);
    // 실패 시 캐시 데이터 유지
  } finally {
    setIsLoading(false);
  }
}, []);
```

### 5.3. 저장소 계층 구조

```
web/src/lib/storage/
├── index.ts           # 통합 인터페이스
├── local-cache.ts     # localStorage 캐시 레이어
├── sheets-client.ts   # Google Sheets API (n8n 경유)
└── sync-manager.ts    # 캐시-서버 동기화
```

---

## 6. 데이터 조회 워크플로우 (WF06)

### 6.1. 신규 워크플로우 생성

**파일**: `workflows/WF06-data-query.json`

**엔드포인트**:
- `GET /patents-list` - 전체 목록 조회
- `GET /patent/{id}` - 단일 특허 조회
- `GET /patent/{id}/documents` - 문서 URL 조회

**워크플로우 구조**:
```
[Webhook Trigger]
      │
      ├── [Route: /patents-list]
      │         │
      │         ▼
      │   [Google Sheets Read] ← 전체 행 조회
      │         │
      │         ▼
      │   [JSON 변환 및 응답]
      │
      ├── [Route: /patent/:id]
      │         │
      │         ▼
      │   [Google Sheets Lookup] ← Patent ID로 검색
      │         │
      │         ▼
      │   [JSON 변환 및 응답]
      │
      └── [Route: /patent/:id/documents]
                │
                ▼
          [Google Sheets Lookup] ← URL 필드만 반환
```

---

## 7. 마이그레이션 전략

### 7.1. 단계별 마이그레이션

**Stage 1: n8n 워크플로우 업데이트** (이번 작업)
- WF01, WF03, WF04에 Google Drive/Sheets 노드 추가
- 기존 localStorage 로직 유지 (병렬 운영)
- 새로운 데이터만 Sheets/Drive에 저장 시작

**Stage 2: 데이터 조회 전환** (다음 단계)
- WF06 데이터 조회 워크플로우 생성
- 프론트엔드 API 클라이언트 확장
- Sheets를 primary 데이터 소스로 전환

**Stage 3: 완전 전환** (최종 단계)
- localStorage를 캐시 전용으로 변경
- 기존 localStorage 데이터 마이그레이션
- 오프라인 지원 구현

### 7.2. 기존 데이터 마이그레이션

```typescript
// 기존 localStorage 데이터를 Sheets로 마이그레이션
async function migrateLocalStorageToSheets() {
  const localPatents = getStoredPatents();

  for (const patent of localPatents) {
    await fetch(`${N8N_WEBHOOK_URL}/migrate-patent`, {
      method: 'POST',
      body: JSON.stringify(patent)
    });
  }

  // 마이그레이션 완료 후 로컬 데이터 클리어 (선택)
  // localStorage.removeItem('maipatent_patents');
}
```

---

## 8. 테스트 체크리스트

### 8.1. n8n 워크플로우 테스트

- [ ] WF01: 발명 제안서 제출 → Sheets 행 생성 확인
- [ ] WF01: 발명 제안서 제출 → Drive 01_발명제안서 파일 생성 확인
- [ ] WF03: 명세서 생성 → Drive 03_명세서초안 파일 생성 확인
- [ ] WF03: 명세서 생성 → Sheets 상태 "reviewing" 업데이트 확인
- [ ] WF04: 검수 승인 → Drive 04_승인문서 파일 이동 확인
- [ ] WF04: 검수 승인 → Sheets 상태 "approved" 업데이트 확인
- [ ] WF04: 검수 반려 → Drive 05_반려문서 파일 이동 확인

### 8.2. 프론트엔드 테스트

- [ ] 대시보드: Sheets 데이터 로드 확인
- [ ] 대시보드: 통계 정확성 확인
- [ ] 검수 페이지: 상태 변경 후 Sheets 반영 확인
- [ ] 오프라인: localStorage 캐시 동작 확인

---

## 9. 관련 문서

- [A02-[Architecture] 시스템 아키텍처](./A02-[Architecture]%20시스템%20아키텍처.md)
- [I09-[Guide] n8n Google Drive 연동 가이드](./I09-[Guide]%20n8n%20Google%20Drive%20연동%20가이드.md)
- [I11-[Implementation] 대시보드 데이터 연동 개선](./I11-[Implementation]%20대시보드%20데이터%20연동%20개선.md)

---

## 10. 구현 완료 내역 (2026-01-13)

### 10.1. 완료된 워크플로우 수정

| 워크플로우 | 버전 | 추가된 노드 | 상태 |
|-----------|------|------------|------|
| WF01-invention-input.json | 1.2.0 | JSON 파일 변환, Google Drive 업로드 (발명제안서), Google Sheets 저장 (메타데이터), URL 포함 출력 설정 | ✅ 완료 |
| WF03-patent-generation.json | 1.2.0 | 명세서 Markdown 변환, Google Drive 업로드 (명세서초안), Google Sheets 상태 업데이트, 명세서 URL 포함 출력 | ✅ 완료 |
| WF04-human-review.json | 1.1.0 | Google Drive 업로드 (승인문서/반려문서), Google Sheets 승인/반려/수정요청 업데이트, 반려 여부 확인 분기 | ✅ 완료 |

### 10.2. 노드별 세부 사항

#### WF01 추가 노드
```
출력 데이터 설정
    │
    ▼
[JSON 파일 변환] ← Patent ID 생성, Binary 데이터 변환
    │
    ▼
[Google Drive 업로드 (발명제안서)] ← 01_발명제안서 폴더
    │
    ▼
[Google Sheets 저장 (메타데이터)] ← 신규 행 추가
    │
    ▼
[URL 포함 출력 설정] ← Drive URL, Sheets row 포함
    │
    ▼
WF02 호출
```

#### WF03 추가 노드
```
출력 데이터 설정
    │
    ▼
[명세서 Markdown 변환] ← KIPO 포맷 조립, Binary 변환
    │
    ▼
[Google Drive 업로드 (명세서초안)] ← 03_명세서초안 폴더
    │
    ▼
[Google Sheets 상태 업데이트] ← 상태: reviewing
    │
    ▼
[명세서 URL 포함 출력]
    │
    ▼
WF04 호출
```

#### WF04 추가 노드
```
승인 처리 ────────────────────────────────────────┐
    │                                              │
    ▼                                              │
[승인 완료 출력]                                    │
    │                                              │
    ▼                                              │
[Google Drive 업로드 (승인문서)] ← 04_승인문서 폴더  │
    │                                              │
    ▼                                              │
[Google Sheets 승인 업데이트] ← 상태: approved       │
    │                                              │
    └──────────────────────────────────────────┐   │
                                               │   │
수정 요청 처리 ────────────────────────────────┼───┘
    │                                          │
    ▼                                          │
[수정 요청 출력]                               │
    │                                          │
    ▼                                          │
[반려 여부 확인] ─────────────────┐            │
    │                            │             │
    │ (반려)                     │ (수정요청)  │
    ▼                            ▼             │
[Drive 업로드 (반려문서)]   [Sheets 수정요청]   │
    │                            │             │
    ▼                            │             │
[Sheets 반려 업데이트]           │             │
    │                            │             │
    └────────────────────────────┴─────────────┘
                    │
                    ▼
              [결과 병합]
```

### 10.3. 완료된 설정 (2026-01-13)

| 항목 | 설명 | 상태 |
|------|------|------|
| n8n 크리덴셜 설정 | Google OAuth2 설정 | ✅ 완료 |
| E2E 테스트 | 전체 흐름 검증 | ✅ 완료 |
| 환경변수 설정 | n8n Cloud 환경변수 | ✅ 완료 |
| Google Sheets 시트 | 제출이력 시트 및 헤더 | ✅ 완료 |

### 10.4. 다음 단계 (미구현)

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| WF06-data-query.json | 데이터 조회 워크플로우 생성 | MEDIUM |
| 프론트엔드 리팩토링 | Sheets API 호출로 전환 | MEDIUM |

### 10.5. 완료된 배포 작업

1. **✅ n8n에서 Google OAuth2 크리덴셜 설정 완료**
   - Google Cloud Console에서 OAuth 2.0 클라이언트 생성
   - n8n에서 `google-drive-credentials` (ID: JY0NtMWoyteVhAkr) 생성
   - n8n에서 `google-sheets-credentials` (ID: 0KIpr0MhYm4rWAoP) 생성
   - WF01, WF03, WF04 워크플로우에 credentials 연결 완료

2. **✅ 환경변수 설정 완료**
   ```bash
   # n8n Cloud에 설정됨
   GOOGLE_DRIVE_PROPOSAL_FOLDER_ID=1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p
   GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID=1CO63_auDraZymK7sBNfmN8jLZzauyyE7
   GOOGLE_DRIVE_DRAFT_FOLDER_ID=1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX
   GOOGLE_DRIVE_APPROVED_FOLDER_ID=19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a
   GOOGLE_DRIVE_REJECTED_FOLDER_ID=1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg
   GOOGLE_SHEETS_TRACKING_ID=1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI
   N8N_WEBHOOK_URL=https://mai-n8n.app.n8n.cloud/webhook
   ```

3. **✅ Google Sheets 시트 헤더 설정 완료**
   - 시트명: "제출이력"
   - 열: Patent ID, 발명 명칭, 발명자, 소속, 기술분야, 키워드, 상태, 제출일, 발명제안서 URL, 선행기술 URL, 명세서초안 URL, 최종문서 URL, 검수완료일, 반려사유, 수정요청사항

4. **✅ E2E 테스트 완료**
   - WF01: 발명제안서 Form → Google Drive 업로드 → Google Sheets 저장 ✅
   - WF03: 명세서 생성 → Drive 업로드 → Sheets 상태 업데이트 ✅
   - WF04: 검수 승인/반려 → Drive 저장 → Sheets 상태 업데이트 ✅

---

## 11. 워크플로우 현황

| 워크플로우 | ID | 활성화 | 노드 수 | Google 연동 |
|-----------|-----|--------|---------|-------------|
| WF01-발명제안서입력 | galbpC91RCA90yyi | ✅ | 11 | Drive + Sheets |
| WF02-선행기술검색 | iFAXSkfG5Rh0b8Qh | ✅ | 11 | - |
| WF03-명세서생성 | 7kZOpw4nYXj5aWIG | ✅ | 15 | Drive + Sheets |
| WF04-명세서검수 | zSXpWko9op4hnSBr | ✅ | 15 | Drive + Sheets |
| WF05-Google-OAuth | rt2CpYYYZi55dEIw | ✅ | 12 | OAuth 인증 |

---

*작성일: 2026-01-13*
*업데이트: 2026-01-13 (Phase 5 E2E 테스트 완료, 전체 구현 완료)*
*버전: 1.2.0*
