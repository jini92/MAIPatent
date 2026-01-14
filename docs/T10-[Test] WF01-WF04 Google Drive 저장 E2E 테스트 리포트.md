# T10-[Test] WF01-WF04 Google Drive 저장 E2E 테스트 리포트

## 테스트 개요

| 항목 | 내용 |
|------|------|
| **테스트 일시** | 2026-01-15 |
| **테스트 목적** | WF01-WF04 워크플로우 체인 실행 및 Google Drive 폴더별 파일 저장 검증 |
| **테스트 Patent ID** | PAT-289366 |
| **테스트 결과** | ✅ **성공** |

---

## 1. 사전 설정: n8n Cloud Variables 구성

### 1.1 문제 상황
- 워크플로우에서 `$vars.*` 변수로 Google Drive 폴더 ID 참조
- n8n Cloud 환경에서 Variables가 미설정되어 파일 저장 실패

### 1.2 해결: n8n Cloud Variables 설정

n8n Cloud UI (Settings → Variables)에서 아래 6개 변수 추가:

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `GOOGLE_DRIVE_PROPOSAL_FOLDER_ID` | `1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p` | 01_발명제안서 폴더 |
| `GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID` | `1CO63_auDraZymK7sBNfmN8jLZzauyyE7` | 02_선행기술 폴더 |
| `GOOGLE_DRIVE_DRAFT_FOLDER_ID` | `1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX` | 03_명세서초안 폴더 |
| `GOOGLE_DRIVE_APPROVED_FOLDER_ID` | `19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a` | 04_승인문서 폴더 |
| `GOOGLE_DRIVE_REJECTED_FOLDER_ID` | `1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg` | 05_반려문서 폴더 |
| `N8N_WEBHOOK_URL` | `https://mai-n8n.app.n8n.cloud/webhook` | Webhook 기본 URL |

---

## 2. 워크플로우 체인 테스트

### 2.1 테스트 데이터

```json
{
  "invention_title": "AI 기반 특허 명세서 자동 생성 시스템",
  "inventor_name": "김발명",
  "technical_field": "인공지능, 자연어처리",
  "background": "기존 특허 명세서 작성은 전문 변리사가 수동으로 진행하여 시간과 비용이 많이 소요됨",
  "problem_to_solve": "자동화된 특허 명세서 생성으로 작성 시간 단축 및 품질 일관성 확보",
  "solution": "LLM 기반 청구항 생성, 선행기술 자동 검색, KIPO 포맷 자동 변환",
  "key_features": [
    "Claude Code Extended Thinking을 활용한 청구항 생성",
    "KIPRIS API 연동 선행기술 검색",
    "Human-in-the-loop 검수 프로세스"
  ],
  "expected_effects": "특허 명세서 작성 시간 70% 단축, 품질 일관성 90% 이상 확보"
}
```

### 2.2 워크플로우 실행 결과

| 워크플로우 | Execution ID | 상태 | 실행 시간 |
|------------|--------------|------|-----------|
| WF01-발명제안서입력 | 162 | ✅ 성공 | ~2초 |
| WF02-선행기술검색 | 163 | ✅ 성공 | ~5초 |
| WF03-명세서생성 | 164 | ✅ 성공 | ~3초 |
| WF04-명세서검수 | 165 | ✅ 성공 (대기) | <1초 |

### 2.3 워크플로우 체인 흐름

```
WF01 (Webhook 트리거)
  ↓ HTTP Request to WF02
WF02 (선행기술 검색)
  ↓ HTTP Request to WF03
WF03 (명세서 생성)
  ↓ HTTP Request to WF04
WF04 (검수 대기)
  → Form Trigger 대기 (Human Review)
```

---

## 3. Google Drive 저장 검증

### 3.1 폴더별 저장 결과

| 폴더 | 예상 파일명 | 저장 결과 |
|------|-------------|-----------|
| 01_발명제안서 | `발명제안서_PAT-289366_20260115.json` | ✅ 저장 확인 |
| 02_선행기술 | `선행기술_PAT-289366_20260115.json` | ✅ 저장 확인 |
| 03_명세서초안 | `명세서초안_PAT-289366_20260115.md` | ✅ 저장 확인 |
| 04_승인문서 | (Human Review 후 저장) | ⏳ 대기 중 (정상) |
| 05_반려문서 | (Human Review 후 저장) | ⏳ 대기 중 (정상) |

### 3.2 Google Drive 폴더 구조

```
MAIPatent (Google Drive Root)
├── 01_발명제안서/
│   └── 발명제안서_PAT-289366_20260115.json ✅
├── 02_선행기술/
│   └── 선행기술_PAT-289366_20260115.json ✅
├── 03_명세서초안/
│   └── 명세서초안_PAT-289366_20260115.md ✅
├── 04_승인문서/
│   └── (검수 승인 시 저장)
└── 05_반려문서/
    └── (검수 반려 시 저장)
```

---

## 4. 테스트 결론

### 4.1 성공 항목

- ✅ n8n Cloud Variables 6개 모두 정상 설정
- ✅ WF01→WF02→WF03→WF04 워크플로우 체인 정상 실행
- ✅ Google Drive 폴더 3개(발명제안서, 선행기술, 명세서초안)에 파일 저장 성공
- ✅ Patent ID 기반 파일명 생성 정상 동작
- ✅ 날짜 포맷(yyyyMMdd) 정상 적용

### 4.2 대기 항목 (정상)

- ⏳ 04_승인문서: WF04 검수 Form에서 "승인" 선택 시 저장됨
- ⏳ 05_반려문서: WF04 검수 Form에서 "반려" 선택 시 저장됨

### 4.3 참고 사항

1. **n8n Cloud vs 로컬 환경 차이점**
   - 로컬: `.env` 파일에서 환경변수 로드
   - Cloud: Settings → Variables에서 `$vars.*` 변수 설정 필요

2. **Human-in-the-loop 설계**
   - WF04는 Form Trigger를 사용하여 사람의 검수 결정을 대기
   - 승인/수정요청/반려 3가지 옵션 제공
   - 검수 완료 후에만 04_승인문서 또는 05_반려문서에 저장

---

## 5. WF04 Human Review Form E2E 테스트

### 5.1 테스트 개요

| 항목 | 내용 |
|------|------|
| **테스트 일시** | 2026-01-15 16:53 KST |
| **테스트 목적** | WF04 Human-in-the-loop 검수 폼 실행 및 승인 시 Google Drive 저장 검증 |
| **테스트 Patent ID** | PAT-TEST-1768431186852 |
| **테스트 도구** | Playwright MCP (브라우저 자동화) |

### 5.2 사전 수정 사항

WF04 워크플로우 Human Review 테스트 전 다음 수정이 필요했습니다:

1. **Set 노드 Binary Data Passthrough 설정**
   - "승인 완료 출력" 노드에 `includeBinary: true` 옵션 추가
   - Binary 데이터가 Google Drive 업로드 노드까지 전달되도록 수정

2. **Google API Credential ID 수정**
   - 기존: `google-drive-credentials` (존재하지 않음)
   - 수정: `JY0NtMWoyteVhAkr` (Google Drive), `0KIpr0MhYm4rWAoP` (Google Sheets)
   - 영향 노드: 5개 (Google Drive 2개, Google Sheets 3개)

### 5.3 테스트 실행 결과

| 노드 | 상태 | 실행 시간 |
|------|------|-----------|
| 검수 Form | ✅ 성공 | 1ms |
| 승인 여부 확인 | ✅ 성공 | 3ms |
| 승인 처리 | ✅ 성공 | 1.499s |
| 승인 완료 출력 | ✅ 성공 | 1ms |
| Google Drive 업로드 (승인문서) | ✅ 성공 | 3.123s |
| Google Sheets 승인 업데이트 | ⚠️ 실패 | 1.238s |

### 5.4 Google Drive 저장 결과

| 항목 | 값 |
|------|-----|
| **파일명** | `승인_PAT-TEST-1768431186852_20260115.md` |
| **File ID** | `1Luvclp5Le4hzTAwnIuvMQwSc0HvIhf8z` |
| **저장 폴더** | 04_승인문서 (`19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a`) |
| **View Link** | https://drive.google.com/file/d/1Luvclp5Le4hzTAwnIuvMQwSc0HvIhf8z/view?usp=drivesdk |
| **MIME Type** | text/markdown |

### 5.5 알려진 이슈

**Google Sheets 승인 업데이트 노드 오류**:
- **오류 메시지**: "Column names were updated after the node's setup"
- **원인**: Google Sheets 스프레드시트의 컬럼 구조가 워크플로우 노드 설정과 불일치
- **영향**: Google Drive 파일 저장에는 영향 없음 (핵심 기능 정상 동작)
- **해결 필요**: Google Sheets 노드의 컬럼 매핑 재설정 필요

### 5.6 테스트 결론

- ✅ **Human Review Form 제출**: 정상 동작
- ✅ **승인 분기 처리**: IF 노드에서 "approved" 상태 정상 분기
- ✅ **Binary 데이터 전달**: Set 노드 → Google Drive 노드로 정상 전달
- ✅ **Google Drive 04_승인문서 폴더 저장**: **성공**
- ⚠️ **Google Sheets 상태 업데이트**: 컬럼 매핑 오류로 실패 (별도 수정 필요)

---

## 6. 관련 문서

- [T08-[Troubleshooting] n8n Cloud 환경변수 접근 제한 해결](./T08-[Troubleshooting]%20n8n%20Cloud%20환경변수%20접근%20제한%20해결.md)
- [T09-[Test] WF01-WF02 워크플로우 체인 E2E 테스트 리포트](./T09-[Test]%20WF01-WF02%20워크플로우%20체인%20E2E%20테스트%20리포트.md)

---

*문서 작성일: 2026-01-15*
*테스트 수행자: Claude Code*
*최종 업데이트: 2026-01-15 (Human Review 테스트 결과 추가)*
