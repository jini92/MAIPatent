# T02-[Test] E2E 통합 테스트 리포트

> **문서 버전**: 1.0.0
> **작성일**: 2026-01-12
> **테스트 환경**: GitHub Pages + n8n Cloud

---

## 1. 개요

MAIPatent 시스템의 전체 E2E(End-to-End) 통합 테스트 결과를 문서화합니다. 이 테스트는 GitHub Pages에 배포된 프론트엔드와 n8n Cloud 백엔드 간의 Webhook 연동을 검증합니다.

### 테스트 범위

| 테스트 유형 | 대상 | 도구 |
|-------------|------|------|
| 단위 테스트 | 입력 검증, 파서, 포맷터 | Node.js Test Runner |
| API 테스트 | Webhook 엔드포인트 | cURL |
| E2E 테스트 | 전체 폼 제출 플로우 | Playwright MCP |

---

## 2. 테스트 결과 요약

### 전체 결과: ✅ ALL PASSED

| 구분 | 항목 | 결과 | 비고 |
|------|------|------|------|
| 단위 테스트 | 42개 테스트 | ✅ PASS (100%) | 4개 테스트 파일 |
| API 테스트 | Webhook 응답 | ✅ PASS | executionId 반환 확인 |
| API 테스트 | CORS Preflight | ✅ PASS | Cross-Origin 허용 |
| E2E 테스트 | 폼 제출 플로우 | ✅ PASS | 4단계 전체 완료 |

---

## 3. 단위 테스트 상세

### 3.1 테스트 파일 구성

```
tests/
├── input-validation.test.js  - 입력 유효성 검증
├── kipris-parser.test.js     - KIPRIS API 응답 파싱
├── kipo-format.test.js       - KIPO 표준 형식 변환
└── validate-script.test.js   - 스크립트 유효성 검증
```

### 3.2 테스트 결과

```
📊 테스트 실행 결과
━━━━━━━━━━━━━━━━━━━━━━━━━
총 테스트: 42개
통과: 42개 (100%)
실패: 0개
━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.3 검증 항목

- **입력 검증**: 필수 필드, 이메일 형식, 문자열 길이 제한
- **KIPRIS 파싱**: API 응답 XML/JSON 파싱, 에러 핸들링
- **KIPO 형식**: 식별 기호 변환, 도면 부호 생성, 청구항 포맷팅
- **스크립트 검증**: 유효성 검사 스크립트 동작 확인

---

## 4. API 테스트 상세

### 4.1 Webhook 응답 테스트

**엔드포인트**: `POST /webhook/wf01-invention-input`

**요청**:
```bash
curl -s -X POST https://mai-n8n.app.n8n.cloud/webhook/wf01-invention-input \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**응답**:
```json
{
  "executionId": "WF01-1768171338326",
  "status": "received",
  "message": "발명 제안서가 성공적으로 접수되었습니다"
}
```

**검증 결과**:
- ✅ HTTP 200 응답
- ✅ executionId가 `WF01-{timestamp}` 형식으로 반환
- ✅ status가 "received"
- ✅ 한글 메시지 정상 인코딩

### 4.2 CORS Preflight 테스트

**요청**:
```bash
curl -s -X OPTIONS https://mai-n8n.app.n8n.cloud/webhook/wf01-invention-input \
  -H "Origin: https://jini92.github.io" \
  -H "Access-Control-Request-Method: POST"
```

**검증 결과**:
- ✅ HTTP 204 No Content
- ✅ `Access-Control-Allow-Origin: *` 헤더 존재
- ✅ GitHub Pages 도메인에서 CORS 허용

---

## 5. E2E 브라우저 테스트 상세

### 5.1 테스트 환경

| 항목 | 값 |
|------|-----|
| 테스트 URL | https://jini92.github.io/MAIPatent/submit/ |
| 브라우저 | Chromium (Playwright) |
| 테스트 도구 | Playwright MCP |

### 5.2 테스트 시나리오

발명 제안서 4단계 폼 제출 전체 플로우를 검증합니다.

#### Step 1: 기본 정보
| 필드 | 입력값 |
|------|--------|
| 발명의 명칭 | AI 기반 특허 명세서 자동 생성 시스템 |
| 발명자 성명 | 테스트 발명자 |
| 소속 | 테스트 연구소 |
| 이메일 | test@example.com |

#### Step 2: 기술 분야
| 필드 | 입력값 |
|------|--------|
| 기술 분야 | 본 발명은 자연어 처리 및 인공지능 분야에 관한 것으로, 특히 특허 명세서 자동 생성 기술에 관한 것이다. |
| 배경 기술 | 종래의 특허 명세서 작성은 발명자가 작성한 발명 제안서를 기반으로 변리사가 수작업으로 작성하였다... |
| 해결하려는 과제 | 본 발명은 AI 기반 자연어 처리 기술을 활용하여 발명 제안서로부터 KIPO 표준 특허 명세서를 자동으로 생성하는 시스템을 제공하는 것을 목적으로 한다. |

#### Step 3: 발명 내용
| 필드 | 입력값 |
|------|--------|
| 발명 요약 | 본 발명은 발명 제안서를 입력받아 선행기술을 검색하고, AI를 활용하여 KIPO 표준 특허 명세서를 자동 생성하는 시스템에 관한 것이다... |
| 과제 해결 수단 | 상기 목적을 달성하기 위한 본 발명의 일 측면에 따르면, 발명 제안서를 입력받는 입력 모듈; KIPRIS API를 활용하여 선행기술을 검색하는 검색 모듈... |
| 기대 효과 | 본 발명에 따르면, 특허 명세서 작성 시간을 대폭 단축하고, 일관된 품질의 명세서를 생성할 수 있는 효과가 있다... |
| 키워드 | 특허 명세서, 자동 생성, AI, 자연어 처리, KIPO, LLM |

#### Step 4: 최종 확인
| 필드 | 상태 |
|------|------|
| 도면 포함 여부 | 미체크 |
| 내용 정확성 확인 | ✅ 체크 |
| 기밀 정보 미포함 확인 | ✅ 체크 |

### 5.3 테스트 결과

**✅ 제출 성공**

```
실행 ID: WF01-1768171629123
상태: 제출 완료
메시지: 발명 제안서가 성공적으로 제출되었습니다
```

**증빙 자료**: `.playwright-mcp/e2e-submit-success.png`

---

## 6. 해결된 이슈

### 6.1 executionId 빈 문자열 반환 문제

| 항목 | 내용 |
|------|------|
| **문제** | n8n Webhook 노드에서 "Respond Immediately" 모드 사용 시 `$execution.id`가 빈 문자열 반환 |
| **원인** | 즉시 응답 모드에서는 실행 ID가 아직 생성되지 않음 |
| **해결** | 타임스탬프 기반 고유 ID 생성으로 변경 |

**수정 내용**:
```javascript
// Before (문제 발생)
"executionId": "{{ $execution.id }}"

// After (해결)
"executionId": "{{ 'WF01-' + $now.toMillis() }}"
```

### 6.2 CORS 오류

| 항목 | 내용 |
|------|------|
| **문제** | GitHub Pages에서 n8n Cloud Webhook 호출 시 CORS 차단 |
| **원인** | Cross-Origin 요청에 대한 서버 설정 미비 |
| **해결** | Webhook 노드에서 CORS 설정 활성화 |

**n8n Webhook 노드 설정**:
- Response Headers에 `Access-Control-Allow-Origin: *` 추가
- CORS Preflight (OPTIONS) 요청 처리 활성화

---

## 7. 알려진 이슈 (Non-Critical)

### 7.1 basePath 중복 문제

| 항목 | 내용 |
|------|------|
| **현상** | 내부 링크가 `/MAIPatent/MAIPatent/`로 중복 생성됨 |
| **영향** | 네비게이션 링크 클릭 시 404 오류 |
| **직접 접근** | 정상 작동 |
| **우선순위** | 낮음 (핵심 기능에 영향 없음) |

**향후 개선 방안**:
- Next.js `next.config.js`의 basePath 설정 검토
- 컴포넌트 내 Link href 검토

---

## 8. 결론

### 8.1 검증 완료 항목

- ✅ 단위 테스트 전체 통과 (42/42)
- ✅ Webhook 응답 정상 (executionId 반환)
- ✅ CORS 설정 정상 (Cross-Origin 요청 허용)
- ✅ E2E 폼 제출 플로우 정상

### 8.2 배포 상태

| 컴포넌트 | 상태 | URL |
|----------|------|-----|
| Frontend | ✅ 배포 완료 | https://jini92.github.io/MAIPatent/ |
| Backend (n8n) | ✅ Webhook 활성화 | https://mai-n8n.app.n8n.cloud |
| 통합 테스트 | ✅ 통과 | - |

### 8.3 권장 사항

1. **모니터링 설정**: n8n Cloud에서 Webhook 호출 로그 모니터링 활성화
2. **basePath 이슈 해결**: 네비게이션 UX 개선을 위해 basePath 중복 문제 해결
3. **부하 테스트**: 프로덕션 전 동시 접속 테스트 권장

---

## 9. 관련 문서

| 문서 | 설명 |
|------|------|
| [I08-[Implementation] Web UI 구현](I08-[Implementation]%20Web%20UI%20구현.md) | 프론트엔드 구현 상세 |
| [I02-[Workflow] 발명 제안서 입력](I02-[Workflow]%20발명%20제안서%20입력.md) | WF01 워크플로우 설계 |
| [T01-[Test] 통합 테스트 리포트](T01-[Test]%20통합%20테스트%20리포트.md) | 이전 테스트 리포트 |
| [I07-[Guide] 배포 가이드](I07-[Guide]%20배포%20가이드.md) | 배포 절차 |

---

*문서 작성: Claude Code*
*테스트 도구: Node.js Test Runner, Playwright MCP, cURL*
