# T09-[Test] WF01-WF02 워크플로우 체인 E2E 테스트 리포트

> 작성일: 2026-01-15
> 테스트 범위: WF01→WF02 워크플로우 체인 실행 및 Google Drive 저장 검증
> 결과: **PASS**

---

## 1. 테스트 개요

### 1.1. 목적
프론트엔드 폼 제출부터 n8n 워크플로우 체인(WF01→WF02) 실행, Google Drive/Sheets 저장까지 전체 E2E 플로우 검증

### 1.2. 테스트 환경

| 구성요소 | 버전/환경 |
|----------|----------|
| Frontend | GitHub Pages (https://jini92.github.io/MAIPatent/) |
| Backend | n8n Cloud (mai-n8n.app.n8n.cloud) |
| 테스트 도구 | Playwright MCP |
| Google Drive | OAuth 2.0 연동 |
| Google Sheets | OAuth 2.0 연동 |

### 1.3. 테스트 대상 워크플로우

| 워크플로우 | ID | 역할 |
|-----------|-----|------|
| WF01-발명제안서입력 | galbpC91RCA90yyi | 폼 데이터 수신 → Drive/Sheets 저장 → WF02 호출 |
| WF02-선행기술검색 | iFAXSkfG5Rh0b8Qh | 선행기술 검색(Mock) → Drive 저장 |

---

## 2. 테스트 시나리오

### 2.1. 4단계 폼 입력 데이터

**Step 1 - 기본 정보**:

| 필드 | 입력값 |
|------|--------|
| 발명의 명칭 | E2E 테스트 - 인공지능 기반 특허 명세서 자동 생성 시스템 |
| 발명자 성명 | E2E 테스트 발명자 |
| 소속 | MAIPatent 연구소 |
| 이메일 | e2e-test@maipatent.com |

**Step 2 - 기술 분야**:

| 필드 | 입력값 |
|------|--------|
| 기술 분야 | 본 발명은 자연어 처리 및 인공지능 분야에 관한 것으로... |
| 배경 기술 | 종래의 특허 명세서 작성은 발명자가 작성한 발명 제안서를... |
| 해결하려는 과제 | 본 발명은 AI 기반 자연어 처리 기술을 활용하여... |

**Step 3 - 발명 내용**:

| 필드 | 입력값 |
|------|--------|
| 발명 요약 | 본 발명은 발명 제안서를 입력받아 선행기술을 검색하고... |
| 과제 해결 수단 | 상기 목적을 달성하기 위한 본 발명의 일 측면에 따르면... |
| 기대 효과 | 본 발명에 따르면, 특허 명세서 작성 시간을 대폭 단축... |
| 키워드 | 특허 명세서, 자동 생성, AI, 자연어 처리, KIPO, LLM |

**Step 4 - 도면 및 확인**:

| 필드 | 상태 |
|------|------|
| 도면 포함 여부 | 미체크 |
| 내용 정확성 확인 | ✅ 체크 |
| 기밀 정보 미포함 확인 | ✅ 체크 |

---

## 3. 테스트 결과

### 3.1. 프론트엔드 폼 제출

| 단계 | 결과 | 비고 |
|------|------|------|
| Step 1 입력 | ✅ PASS | 기본 정보 입력 완료 |
| Step 2 입력 | ✅ PASS | 기술 분야 입력 완료 |
| Step 3 입력 | ✅ PASS | 발명 내용 입력 완료 |
| Step 4 확인 | ✅ PASS | 체크박스 선택 완료 |
| 폼 제출 | ✅ PASS | n8n Webhook 호출 성공 |

### 3.2. WF01 실행 결과

| 항목 | 값 |
|------|-----|
| Execution ID | 158 |
| Status | ✅ SUCCESS |
| Duration | 44,215ms |
| Patent ID | PAT-314919 |
| 노드 실행 수 | 12/12 (100%) |

**실행된 노드**:

| 순서 | 노드명 | 결과 |
|------|--------|------|
| 1 | 발명제안서 Form | ✅ PASS |
| 2 | 데이터 검증 | ✅ PASS |
| 3 | 데이터 보강 | ✅ PASS |
| 4 | 출력 데이터 설정 | ✅ PASS |
| 5 | JSON 파일 변환 | ✅ PASS |
| 6 | Google Drive 업로드 (발명제안서) | ✅ PASS |
| 7 | Google Sheets 저장 (메타데이터) | ✅ PASS |
| 8 | URL 포함 출력 설정 | ✅ PASS |
| 9 | WF02 선행기술검색 호출 | ✅ PASS |

### 3.3. WF02 실행 결과

| 항목 | 값 |
|------|-----|
| Execution ID | 159 |
| Status | ✅ SUCCESS |
| 시작 시간 | 2026-01-14T17:22:00.368Z |
| 종료 시간 | 2026-01-14T17:22:37.318Z |
| Duration | ~37초 |
| Message | WF02 completed successfully |

### 3.4. Google Drive 저장 결과

| 폴더 | 파일명 | File ID | 결과 |
|------|--------|---------|------|
| 01_발명제안서 | 발명제안서_PAT-314919_20260115.json | 1Aa2sRv-egF0iZ5UwZzQnOCEoIRTDcGkQ | ✅ PASS |
| 02_선행기술 | 선행기술_PAT-314919_20260115.json | 1MashgWMZ8c0KMQuYhfgnaIE_Vb76yZPV | ✅ PASS |

### 3.5. Google Sheets 저장 결과

| 필드 | 저장된 값 | 결과 |
|------|----------|------|
| Patent ID | PAT-314919 | ✅ PASS |
| 발명 명칭 | E2E 테스트 - 인공지능 기반... | ✅ PASS |
| 발명자 | E2E 테스트 발명자 | ✅ PASS |
| 상태 | generating | ✅ PASS |
| 발명제안서 URL | (Drive 링크) | ✅ PASS |
| 선행기술 URL | (Drive 링크) | ✅ PASS |

---

## 4. 테스트 결과 요약

### 4.1. 전체 결과

| 카테고리 | 총 테스트 | PASS | FAIL | 성공률 |
|----------|-----------|------|------|--------|
| 프론트엔드 폼 | 5 | 5 | 0 | 100% |
| WF01 워크플로우 | 9 | 9 | 0 | 100% |
| WF02 워크플로우 | 1 | 1 | 0 | 100% |
| Google Drive | 2 | 2 | 0 | 100% |
| Google Sheets | 6 | 6 | 0 | 100% |
| **전체** | **23** | **23** | **0** | **100%** |

### 4.2. 주요 검증 항목

- [x] 프론트엔드 4단계 폼 입력 및 제출 정상 작동
- [x] n8n Webhook 호출 및 응답 정상
- [x] WF01→WF02 워크플로우 체인 연결 정상
- [x] Google Drive 발명제안서 폴더 저장 성공
- [x] Google Drive 선행기술 폴더 저장 성공
- [x] Google Sheets 메타데이터 행 생성 성공
- [x] Patent ID 자동 생성 (PAT-XXXXXX 형식)

---

## 5. 알려진 이슈

### 5.1. 프론트엔드 성공 화면 미표시 (Non-Critical)

**현상**: 폼 제출 후 성공 모달/화면이 표시되지 않고 Step 4 화면에 머무름

**영향**: 사용자 경험(UX)에만 영향, 실제 데이터 처리는 정상

**원인 분석 필요**:
- `InventionForm.tsx` onSuccess 콜백 동작 확인
- `submit/page.tsx` 성공 상태 처리 로직 검토

**우선순위**: 낮음 (기능 정상, UI 개선 사항)

### 5.2. 로컬 개발 서버 basePath 이슈

**현상**: `localhost:3000/MAIPatent/submit/`에서 정적 리소스 404 오류

**원인**: `next.config.mjs`의 `basePath: '/MAIPatent'` 설정이 GitHub Pages 배포용으로 구성됨

**해결**: 프로덕션 환경(GitHub Pages)에서 테스트 수행

---

## 6. 환경 설정 확인

### 6.1. n8n Cloud Variables ($vars)

| 변수명 | 설정 상태 |
|--------|----------|
| GOOGLE_DRIVE_PROPOSAL_FOLDER_ID | ✅ 설정됨 |
| GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID | ✅ 설정됨 |
| GOOGLE_DRIVE_DRAFT_FOLDER_ID | ✅ 설정됨 |
| GOOGLE_DRIVE_APPROVED_FOLDER_ID | ✅ 설정됨 |
| GOOGLE_DRIVE_REJECTED_FOLDER_ID | ✅ 설정됨 |
| GOOGLE_SHEETS_TRACKING_ID | ✅ 설정됨 |
| N8N_WEBHOOK_URL | ✅ 설정됨 |

### 6.2. 워크플로우 활성화 상태

| 워크플로우 | ID | 상태 |
|-----------|-----|------|
| WF01-발명제안서입력 | galbpC91RCA90yyi | ✅ ACTIVE |
| WF02-선행기술검색 | iFAXSkfG5Rh0b8Qh | ✅ ACTIVE |
| WF03-명세서생성 | 7kZOpw4nYXj5aWIG | ✅ ACTIVE |
| WF04-명세서검수 | zSXpWko9op4hnSBr | ✅ ACTIVE |

---

## 7. 스크린샷

| 파일 | 설명 |
|------|------|
| `.playwright-mcp/e2e-test-after-submit.png` | 폼 제출 완료 후 Step 4 화면 |

---

## 8. 다음 단계

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| WF03→WF04 체인 E2E 테스트 | HIGH | 미완료 |
| 프론트엔드 성공 화면 버그 수정 | MEDIUM | 미완료 |
| 로컬 개발 환경 basePath 분리 | LOW | 미완료 |

---

## 9. 관련 문서

- [T07-[Test] Google Drive/Sheets 연동 E2E 테스트 리포트](./T07-[Test]%20Google%20Drive%20Sheets%20연동%20E2E%20테스트%20리포트.md)
- [T08-[Troubleshooting] n8n Cloud 환경변수 접근 제한 해결](./T08-[Troubleshooting]%20n8n%20Cloud%20환경변수%20접근%20제한%20해결.md)
- [I12-[Implementation] Google Drive 및 Sheets 연동 가이드](./I12-[Implementation]%20Google%20Drive%20및%20Sheets%20연동%20가이드.md)

---

*작성일: 2026-01-15*
*테스트 수행자: Claude Code*
*테스트 도구: Playwright MCP*
*버전: 1.0.0*
