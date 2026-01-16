# T16 - Production Full Test 시나리오

> **문서 버전**: 1.0.0
> **작성일**: 2026-01-16
> **환경**: Production (GitHub Pages + n8n Cloud)

---

## 1. 테스트 개요

### 1.1. 목적
MAIPatent 시스템의 전체 워크플로우를 Production 환경에서 E2E(End-to-End) 검증하여 실제 사용자 시나리오에서의 안정성과 기능 정확성을 확인합니다.

### 1.2. 테스트 범위

| 영역 | 워크플로우 | 설명 |
|------|-----------|------|
| 입력 | WF01 | 발명 제안서 제출 |
| 검색 | WF02 | 선행기술 검색 |
| 생성 | WF03 | AI 명세서 생성 |
| 검수 | WF04 | Human-in-the-loop 검수 |
| 출력 | WF05 | 문서 내보내기 |

### 1.3. Production 환경

| 구성요소 | URL/값 |
|----------|--------|
| Frontend | https://jini92.github.io/MAIPatent |
| n8n Cloud | mai-n8n.app.n8n.cloud |
| WF01 Webhook | /webhook/wf01-invention-input |
| WF02 Webhook | /webhook/wf02-prior-art-search |
| WF03 Webhook | /webhook/wf03-generate-specification |
| WF04 Webhook | /webhook/wf04-human-review |
| WF05 Webhook | /webhook/wf05-export-v2 |

---

## 2. 테스트 시나리오

### Scenario 1: 발명 제안서 제출 (WF01)

#### 1.1. 기본 제출 테스트

**목적**: 발명 제안서가 정상적으로 접수되고 Google Drive/Sheets에 저장되는지 확인

**사전 조건**:
- [ ] Production Frontend 접근 가능
- [ ] n8n WF01 워크플로우 활성화 상태

**테스트 단계**:
```
1. https://jini92.github.io/MAIPatent/submit/ 접속
2. 발명 제안서 폼 작성:
   - 발명의 명칭: [테스트용 발명 제목]
   - 발명자 정보 입력
   - 기술 분야 선택
   - 발명 요약 (최소 100자)
   - 해결하려는 과제 (최소 50자)
   - 해결 수단 (최소 100자)
   - 기대 효과 입력
3. "제출" 버튼 클릭
4. 응답 확인
```

**예상 결과**:
```json
{
  "success": true,
  "patent_id": "PAT-XXXXXX",
  "submission_id": "INV-XXXXX-XXXXX",
  "message": "발명제안서가 성공적으로 제출되었습니다.",
  "drive_url": "https://drive.google.com/file/d/XXXXX/view"
}
```

**검증 항목**:
- [ ] Patent ID 형식 확인 (PAT-6자리)
- [ ] Google Drive에 JSON 파일 저장 확인
- [ ] Google Sheets에 메타데이터 행 추가 확인
- [ ] Patent ID 컬럼 값이 정상 저장 확인

#### 1.2. 입력 검증 테스트

**목적**: 불완전한 입력에 대한 검증 로직 확인

**테스트 데이터**:
```json
{
  "invention": {
    "inventionTitle": "테스트",
    "inventorName": "홍길동",
    "technicalProblem": "짧음",  // 50자 미만
    "proposedSolution": "해결책"  // 100자 미만
  }
}
```

**예상 결과**:
```json
{
  "success": false,
  "message": "입력 데이터 검증에 실패했습니다.",
  "errors": [
    "해결하려는 과제는 최소 50자 이상 입력해주세요.",
    "발명의 핵심 구성은 최소 100자 이상 입력해주세요."
  ]
}
```

---

### Scenario 2: 선행기술 검색 (WF02)

#### 2.1. 자동 트리거 검색

**목적**: WF01 완료 후 WF02가 자동으로 트리거되어 선행기술 검색이 수행되는지 확인

**사전 조건**:
- [ ] WF01 테스트 완료 (Patent ID 확보)
- [ ] WF02 워크플로우 활성화

**테스트 단계**:
```
1. WF01 제출 후 WF02 자동 실행 대기 (최대 30초)
2. n8n 실행 이력에서 WF02 실행 확인
3. Google Drive 02_선행기술 폴더 확인
4. Google Sheets 선행기술 검색 결과 컬럼 확인
```

**검증 항목**:
- [ ] WF02 자동 트리거 확인
- [ ] 선행기술 검색 결과 JSON 생성
- [ ] Google Drive에 결과 파일 저장
- [ ] 상태 업데이트: `제출완료` → `검색완료`

#### 2.2. 수동 검색 테스트

**목적**: 특정 Patent ID로 수동 선행기술 검색 가능 여부 확인

**테스트 요청**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf02-prior-art-search
Content-Type: application/json

{
  "patentId": "PAT-XXXXXX",
  "keywords": ["인공지능", "특허", "자동화"]
}
```

---

### Scenario 3: AI 명세서 생성 (WF03)

#### 3.1. 자동 명세서 생성

**목적**: WF02 완료 후 Claude AI를 통한 KIPO 규격 명세서가 자동 생성되는지 확인

**사전 조건**:
- [ ] WF02 테스트 완료
- [ ] Anthropic API 크레딧 충분

**테스트 단계**:
```
1. WF02 완료 후 WF03 자동 실행 대기 (최대 3분)
2. n8n 실행 이력에서 WF03 실행 확인
3. 생성된 명세서 품질 검증
4. Google Drive 03_명세서초안 폴더 확인
```

**검증 항목**:
- [ ] KIPO 표준 형식 준수 (【】 식별 기호)
- [ ] 청구항 구조 정확성
- [ ] 도면 부호 일관성 (100번대 체계)
- [ ] 금지 어구 미사용 확인
- [ ] 전제 기초 규칙 준수

#### 3.2. 명세서 품질 체크리스트

**KIPO 형식 검증**:
- [ ] 【발명의 명칭】 포함
- [ ] 【기술분야】 포함
- [ ] 【배경기술】 포함
- [ ] 【해결하려는 과제】 포함
- [ ] 【과제의 해결 수단】 포함
- [ ] 【발명의 효과】 포함
- [ ] 【도면의 간단한 설명】 포함
- [ ] 【발명을 실시하기 위한 구체적인 내용】 포함
- [ ] 【특허청구범위】 포함
- [ ] 【요약서】 포함

**청구항 검증**:
- [ ] 독립항 존재
- [ ] 종속항 상위항 인용 정확
- [ ] 한 문장 구성
- [ ] 전제부 → 특징부 구조

---

### Scenario 4: Human-in-the-loop 검수 (WF04)

#### 4.1. 검수 승인 테스트

**목적**: 검수자가 명세서를 승인하면 상태가 정상적으로 업데이트되는지 확인

**사전 조건**:
- [ ] WF03 테스트 완료 (명세서 생성됨)

**테스트 단계 (Frontend)**:
```
1. https://jini92.github.io/MAIPatent/review/ 접속
2. 검수 대기 목록에서 해당 Patent ID 선택
3. 명세서 내용 검토
4. "승인" 버튼 클릭
5. 확인 다이얼로그에서 "확인"
```

**테스트 단계 (API)**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf04-human-review
Content-Type: application/json

{
  "patentId": "PAT-XXXXXX",
  "action": "approve",
  "reviewerId": "reviewer@example.com",
  "comments": "검토 완료, 승인합니다."
}
```

**검증 항목**:
- [ ] 상태 업데이트: `검수대기` → `승인완료`
- [ ] 승인 시간 기록
- [ ] Google Drive 04_승인문서 폴더로 이동
- [ ] Google Sheets 상태 컬럼 업데이트

#### 4.2. 검수 반려 테스트

**목적**: 검수자가 명세서를 반려하면 피드백이 기록되고 재검토 요청이 처리되는지 확인

**테스트 요청**:
```json
{
  "patentId": "PAT-XXXXXX",
  "action": "reject",
  "reviewerId": "reviewer@example.com",
  "feedback": "청구항 3의 전제 기초가 불명확합니다. 수정 후 재검토 요청해주세요."
}
```

**검증 항목**:
- [ ] 상태 업데이트: `검수대기` → `반려`
- [ ] 피드백 내용 저장
- [ ] Google Drive 05_반려문서 폴더로 이동

#### 4.3. 수정 요청 테스트

**목적**: 부분 수정 요청이 정상 처리되는지 확인

**테스트 요청**:
```json
{
  "patentId": "PAT-XXXXXX",
  "action": "revision_requested",
  "reviewerId": "reviewer@example.com",
  "feedback": "청구항 5 구성요소 명칭 통일 필요"
}
```

---

### Scenario 5: 문서 내보내기 (WF05)

#### 5.1. DOCX 내보내기

**목적**: 승인된 명세서를 DOCX 형식으로 내보내기 가능 여부 확인

**사전 조건**:
- [ ] WF04 승인 완료 (상태: 승인완료)
- [ ] WF03에서 명세서 파일 생성됨

**테스트 단계 (Frontend)**:
```
1. https://jini92.github.io/MAIPatent/export/?id=PAT-XXXXXX 접속
2. "Microsoft Word" 형식 선택
3. 템플릿: "표준 (KIPO 표준 형식)" 선택
4. 추가 옵션 설정:
   - [x] 도면 포함
   - [x] 메타데이터 포함
   - [ ] 워터마크 추가
5. "Microsoft Word로 내보내기" 클릭
```

**테스트 단계 (API)**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2
Content-Type: application/json

{
  "patentId": "PAT-XXXXXX",
  "format": "docx",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": false,
  "template": "standard"
}
```

**예상 결과 (성공 시)**:
```json
{
  "success": true,
  "downloadUrl": "https://drive.google.com/...",
  "fileName": "PAT-XXXXXX_명세서.docx",
  "format": "docx",
  "fileSize": "2.5 MB"
}
```

**예상 결과 (파일 미존재 시)**:
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-XXXXXX"
}
```

#### 5.2. PDF 내보내기

**테스트 요청**:
```json
{
  "patentId": "PAT-XXXXXX",
  "format": "pdf",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": true,
  "template": "standard"
}
```

#### 5.3. HWP 미지원 처리

**목적**: HWP 형식 선택 시 적절한 에러 메시지가 표시되는지 확인

**테스트 단계**:
```
1. Export 페이지에서 "한글 문서" 형식 선택
2. "한글 문서로 내보내기" 클릭
3. 에러 메시지 확인
```

**예상 결과**:
- 화면에 경고 알림 표시
- 메시지: "HWP 형식은 현재 지원되지 않습니다. DOCX 또는 PDF 형식을 사용해주세요."

---

## 3. 통합 시나리오 (Full E2E Flow)

### 3.1. 전체 워크플로우 테스트

**시나리오**: 발명 제안서 제출부터 최종 문서 내보내기까지 전체 프로세스

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Full E2E Test Flow                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: 발명 제안서 제출 (WF01)                                            │
│  ───────────────────────────────────────                                    │
│  입력: 발명 제안서 데이터                                                    │
│  출력: Patent ID (PAT-XXXXXX)                                               │
│  검증: Google Drive 저장, Sheets 기록, Patent ID 정상                       │
│                              │                                              │
│                              ▼                                              │
│  Step 2: 선행기술 검색 (WF02) - 자동 트리거                                  │
│  ───────────────────────────────────────                                    │
│  입력: Patent ID                                                            │
│  출력: 선행기술 검색 결과                                                    │
│  검증: 검색 결과 저장, 상태 업데이트                                         │
│                              │                                              │
│                              ▼                                              │
│  Step 3: AI 명세서 생성 (WF03) - 자동 트리거                                 │
│  ───────────────────────────────────────                                    │
│  입력: 발명 제안서 + 선행기술                                                │
│  출력: KIPO 규격 명세서                                                      │
│  검증: KIPO 형식, 청구항 구조, 품질 기준                                     │
│                              │                                              │
│                              ▼                                              │
│  Step 4: Human-in-the-loop 검수 (WF04)                                      │
│  ───────────────────────────────────────                                    │
│  입력: 명세서 + 검수자 판단                                                  │
│  출력: 승인/반려/수정요청                                                    │
│  검증: 상태 업데이트, 폴더 이동                                              │
│                              │                                              │
│                   [승인 시]  ▼                                              │
│  Step 5: 문서 내보내기 (WF05)                                               │
│  ───────────────────────────────────────                                    │
│  입력: Patent ID + 출력 옵션                                                 │
│  출력: DOCX/PDF 파일                                                         │
│  검증: 파일 다운로드, 형식 정확성                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. 테스트 데이터 템플릿

**완전한 발명 제안서 테스트 데이터**:
```json
{
  "invention": {
    "inventionTitle": "딥러닝 기반 실시간 번역 시스템 및 방법",
    "inventorName": "김개발",
    "inventorAffiliation": "한국기술연구소",
    "technicalField": "자연어처리",
    "inventionSummary": "본 발명은 딥러닝 신경망을 활용하여 다국어 텍스트를 실시간으로 번역하는 시스템에 관한 것입니다. 특히 문맥을 고려한 번역 품질 향상과 저지연 응답 시간을 특징으로 합니다.",
    "technicalProblem": "기존 기계 번역 시스템은 문맥 이해 부족으로 인한 번역 오류가 빈번하고, 실시간 처리 시 지연 시간이 발생하여 사용자 경험을 저하시키는 문제가 있습니다. 특히 전문 용어나 관용 표현에 대한 처리가 미흡하여 전문 분야에서의 활용이 제한적입니다.",
    "proposedSolution": "본 발명은 트랜스포머 아키텍처 기반의 멀티헤드 어텐션 메커니즘을 적용하여 문맥 인식 번역을 수행합니다. 사전 학습된 대규모 언어 모델을 기반으로 도메인 특화 파인튜닝을 수행하고, 지식 증류 기법을 통해 모델 경량화를 달성합니다. 또한 캐싱 메커니즘과 배치 처리 최적화를 통해 실시간 응답 성능을 확보합니다.",
    "expectedEffects": "번역 정확도 95% 이상 달성, 응답 지연 시간 50ms 이하, 다국어 동시 지원으로 글로벌 서비스 확장 용이"
  }
}
```

---

## 4. 에러 시나리오 테스트

### 4.1. 네트워크 오류 처리

**테스트 항목**:
- [ ] n8n Webhook 타임아웃 (30초)
- [ ] Google API 연결 실패
- [ ] Anthropic API 쿼터 초과

### 4.2. 데이터 오류 처리

**테스트 항목**:
- [ ] 존재하지 않는 Patent ID 조회
- [ ] 중복 Patent ID 생성 시도
- [ ] 빈 필드로 제출 시도

### 4.3. 권한 오류 처리

**테스트 항목**:
- [ ] Google Drive 접근 권한 만료
- [ ] OAuth 토큰 갱신 실패

---

## 5. 성능 테스트

### 5.1. 응답 시간 기준

| 워크플로우 | 목표 응답 시간 | 최대 허용 시간 |
|-----------|---------------|---------------|
| WF01 제출 | < 5초 | 10초 |
| WF02 검색 | < 10초 | 30초 |
| WF03 생성 | < 3분 | 5분 |
| WF04 검수 | < 3초 | 5초 |
| WF05 내보내기 | < 10초 | 30초 |

### 5.2. 동시 처리 테스트

**테스트 시나리오**:
- 동시 5건 발명 제안서 제출
- 예상: 모든 건 정상 처리, 순차 실행

---

## 6. 테스트 실행 체크리스트

### 6.1. 사전 점검

- [ ] n8n Cloud 로그인 상태 확인
- [ ] 모든 워크플로우 ACTIVE 상태 확인
- [ ] Google OAuth 토큰 유효성 확인
- [ ] Anthropic API 크레딧 확인
- [ ] Frontend 배포 상태 확인

### 6.2. 테스트 실행

| # | 시나리오 | 담당자 | 결과 | 비고 |
|---|---------|--------|------|------|
| 1 | WF01 기본 제출 | | □ PASS / □ FAIL | |
| 2 | WF01 입력 검증 | | □ PASS / □ FAIL | |
| 3 | WF02 자동 트리거 | | □ PASS / □ FAIL | |
| 4 | WF03 명세서 생성 | | □ PASS / □ FAIL | |
| 5 | WF04 검수 승인 | | □ PASS / □ FAIL | |
| 6 | WF04 검수 반려 | | □ PASS / □ FAIL | |
| 7 | WF05 DOCX 내보내기 | | □ PASS / □ FAIL | |
| 8 | WF05 PDF 내보내기 | | □ PASS / □ FAIL | |
| 9 | WF05 HWP 미지원 | | □ PASS / □ FAIL | |
| 10 | 전체 E2E 흐름 | | □ PASS / □ FAIL | |

### 6.3. 테스트 후 정리

- [ ] 테스트 데이터 정리 (필요시)
- [ ] 테스트 결과 문서화
- [ ] 발견된 버그 이슈 등록
- [ ] 테스트 리포트 작성

---

## 7. 관련 문서

| 문서 | 설명 |
|------|------|
| [A02-Architecture](./A02-[Architecture]%20시스템%20아키텍처.md) | 시스템 아키텍처 |
| [S01-Summary](./S01-[Summary]%20프로젝트%20현황%20요약.md) | 프로젝트 현황 |
| [T15-E2E Test](./T15-[Test]%20WF01-WF05%20Production%20E2E%20테스트%20리포트.md) | 최근 E2E 테스트 결과 |
| [I14-WF05 구현](./I14-WF05-Google-Drive-Export-Implementation.md) | WF05 구현 문서 |

---

## 8. 자동화 테스트 스크립트 (참고)

### 8.1. cURL 테스트 스크립트

```bash
#!/bin/bash
# MAIPatent Production E2E Test Script

N8N_BASE="https://mai-n8n.app.n8n.cloud/webhook"

echo "=== WF01 Test: 발명 제안서 제출 ==="
RESPONSE=$(curl -s -X POST "${N8N_BASE}/wf01-invention-input" \
  -H "Content-Type: application/json" \
  -d '{
    "invention": {
      "inventionTitle": "자동화 테스트 - AI 번역 시스템",
      "inventorName": "테스트봇",
      "inventorAffiliation": "자동화팀",
      "technicalField": "인공지능",
      "inventionSummary": "본 발명은 자동화 테스트를 위한 샘플 발명 제안서입니다. 실제 특허 출원을 위한 것이 아닙니다.",
      "technicalProblem": "기존 시스템에서 자동화된 테스트 검증이 어려웠으며, 수동 테스트에 많은 시간이 소요되는 문제가 있었습니다.",
      "proposedSolution": "본 발명은 자동화된 E2E 테스트 프레임워크를 제공하여 워크플로우 전체를 검증할 수 있는 시스템을 제안합니다. cURL 기반 API 호출과 응답 검증을 통해 빠르고 정확한 테스트가 가능합니다.",
      "expectedEffects": "테스트 시간 단축, 검증 정확도 향상, 자동화율 증가"
    }
  }')

echo "Response: $RESPONSE"
PATENT_ID=$(echo $RESPONSE | grep -o '"patent_id":"[^"]*"' | cut -d'"' -f4)
echo "Patent ID: $PATENT_ID"

echo ""
echo "=== WF05 Test: 문서 내보내기 ==="
curl -s -X POST "${N8N_BASE}/wf05-export-v2" \
  -H "Content-Type: application/json" \
  -d "{
    \"patentId\": \"${PATENT_ID}\",
    \"format\": \"docx\",
    \"includeDrawings\": true,
    \"includeMetadata\": true,
    \"watermark\": false,
    \"template\": \"standard\"
  }"

echo ""
echo "=== Test Complete ==="
```

### 8.2. Playwright 테스트 (Frontend)

```javascript
// tests/e2e/full-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('MAIPatent Production E2E', () => {
  test('발명 제안서 제출 및 내보내기 흐름', async ({ page }) => {
    // Step 1: 제출 페이지 접속
    await page.goto('https://jini92.github.io/MAIPatent/submit/');
    await expect(page).toHaveTitle(/MAIPatent/);

    // Step 2: 폼 작성
    await page.fill('[name="inventionTitle"]', '테스트 발명');
    // ... 나머지 필드 작성

    // Step 3: 제출
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();

    // Step 4: 내보내기 페이지 확인
    const patentId = await page.locator('.patent-id').textContent();
    await page.goto(`https://jini92.github.io/MAIPatent/export/?id=${patentId}`);
    await expect(page.locator('h1')).toContainText('내보내기');
  });
});
```

---

*문서 작성일: 2026-01-16*
*작성자: Claude Code*
*버전: 1.0.0*
