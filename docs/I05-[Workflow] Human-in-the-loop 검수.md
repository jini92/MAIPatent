# [Workflow] Human-in-the-loop 검수 워크플로우

> **WF04: 생성된 명세서의 인간 검수 및 피드백 반영 워크플로우**

---

## 1. 워크플로우 개요

| 항목 | 내용 |
|------|------|
| **워크플로우 ID** | WF04 |
| **워크플로우명** | Human-in-the-loop 검수 |
| **목적** | 생성된 특허 명세서의 품질 검수 및 피드백 반영 |
| **트리거** | WF03 Webhook / Manual |
| **출력** | 승인된 최종 명세서 / 수정 요청 피드백 |

---

## 2. 워크플로우 다이어그램

```
[Webhook Trigger] --> [검수 데이터 준비] --> [검수 Form 생성]
                                                    |
                                                    v
                                            [Wait 노드 - 검수 대기]
                                                    |
                                                    v
                                            [검수 결과 수신]
                                                    |
                              +-----------------+-------------------+
                              |                                     |
                              v                                     v
                         [승인됨]                              [수정 필요]
                              |                                     |
                              v                                     v
                    [최종 문서 저장]                        [피드백 처리]
                              |                                     |
                              v                                     v
                       [완료 알림]                         [WF03 재트리거]
```

---

## 3. 노드 상세 설계

### 3.1. Webhook Trigger 노드

**목적**: WF03(명세서 생성)에서 트리거 수신

**Input Schema:**
```json
{
  "submission_id": "GEN-xxx",
  "patent_specification": "# 특허 명세서\n\n【발명의 명칭】...",
  "word_count": 3500,
  "generated_at": "2026-01-10T10:30:00Z",
  "status": "specification_complete",
  "sections": {
    "claims": "【청구항 1】...",
    "description": "【기술분야】...",
    "drawingDescription": "【도면의 간단한 설명】..."
  }
}
```

### 3.2. 검수 데이터 준비 노드 (Code)

**목적**: 검수에 필요한 데이터 구조화

```javascript
const input = $input.first().json;

const reviewData = {
  submissionId: input.submission_id,
  specification: input.patent_specification,
  sections: input.sections,
  metadata: {
    wordCount: input.word_count,
    generatedAt: input.generated_at
  },
  reviewId: `REV-${Date.now()}`,
  reviewRequestedAt: new Date().toISOString(),
  reviewStatus: 'pending'
};

return [{ json: reviewData }];
```

### 3.3. 검수 Form 생성 노드

**목적**: 검수자가 피드백을 입력할 수 있는 Form 생성

**Form 필드:**
- 승인 여부 (radio: 승인/수정필요/반려)
- 청구항 피드백 (textarea)
- 상세설명 피드백 (textarea)
- 도면설명 피드백 (textarea)
- 전체 의견 (textarea)
- 우선순위 (select: 높음/보통/낮음)

### 3.4. Wait 노드

**목적**: 검수자의 응답을 기다림

**설정:**
- Wait Type: On form submission
- Timeout: 72시간 (영업일 3일)

### 3.5. 검수 결과 분기 노드 (IF)

**조건:**
- 승인: `approval_status === 'approved'`
- 수정필요: `approval_status === 'revision_needed'`
- 반려: `approval_status === 'rejected'`

### 3.6. 승인 처리 노드

**목적**: 승인된 명세서 최종 저장

```javascript
const reviewData = $input.first().json;

const finalDocument = {
  submissionId: reviewData.submissionId,
  specification: reviewData.specification,
  status: 'approved',
  approvedAt: new Date().toISOString(),
  reviewId: reviewData.reviewId,
  version: '1.0.0-final'
};

return [{ json: finalDocument }];
```

### 3.7. 수정 요청 처리 노드

**목적**: 피드백을 정리하여 WF03 재실행 준비

```javascript
const reviewData = $input.first().json;
const feedback = reviewData.feedback;

const revisionRequest = {
  submissionId: reviewData.submissionId,
  originalSpecification: reviewData.specification,
  feedback: {
    claims: feedback.claims_feedback,
    description: feedback.description_feedback,
    drawings: feedback.drawings_feedback,
    general: feedback.general_comments
  },
  priority: feedback.priority,
  revisionNumber: (reviewData.revisionNumber || 0) + 1,
  status: 'revision_requested',
  requestedAt: new Date().toISOString()
};

return [{ json: revisionRequest }];
```

---

## 4. 검수 Form 상세 설계

### 4.1. Form 필드 구조

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| approval_status | radio | Y | 승인/수정필요/반려 |
| claims_feedback | textarea | N | 청구항 관련 피드백 |
| description_feedback | textarea | N | 상세설명 관련 피드백 |
| drawings_feedback | textarea | N | 도면설명 관련 피드백 |
| general_comments | textarea | N | 전체적인 의견 |
| priority | select | N | 수정 우선순위 |

### 4.2. 검수 체크리스트

검수자가 확인해야 할 항목:

**청구항 검수:**
- [ ] 독립항이 발명의 핵심을 포함하는가?
- [ ] 종속항이 상위항을 정확히 인용하는가?
- [ ] 전제 기초(Antecedent Basis)가 충족되는가?
- [ ] 청구항이 하나의 문장으로 구성되는가?

**상세설명 검수:**
- [ ] 청구항의 모든 구성요소가 설명되었는가?
- [ ] KIPO 표준 식별 기호가 올바른가?
- [ ] 도면 부호가 일관되게 사용되었는가?
- [ ] 금지 어구가 사용되지 않았는가?

**전체 검수:**
- [ ] 용어가 명세서 전체에서 일관되는가?
- [ ] 실시예가 청구항 범위를 뒷받침하는가?

---

## 5. 피드백 루프 설계

### 5.1. 수정 반복 제한

- 최대 수정 횟수: 3회
- 3회 초과 시 수동 개입 필요

### 5.2. 피드백 반영 프로세스

```
[수정 요청] --> [피드백 분석] --> [WF03 재트리거]
                                        |
                                        v
                              [수정된 명세서 생성]
                                        |
                                        v
                              [WF04 재실행 (검수)]
```

---

## 6. 알림 설정

### 6.1. 검수 요청 알림

- 검수 요청 시 담당자에게 이메일/슬랙 알림
- 검수 대기 시간 48시간 초과 시 리마인더

### 6.2. 완료 알림

- 승인 완료 시 요청자에게 알림
- 수정 요청 시 담당자에게 알림

---

## 7. 출력 데이터 스키마

### 7.1. 승인 완료 시

```json
{
  "submission_id": "GEN-xxx",
  "status": "approved",
  "approved_at": "2026-01-10T15:30:00Z",
  "review_id": "REV-xxx",
  "final_specification": "# 특허 명세서\n...",
  "version": "1.0.0-final"
}
```

### 7.2. 수정 요청 시

```json
{
  "submission_id": "GEN-xxx",
  "status": "revision_requested",
  "revision_number": 1,
  "feedback": {
    "claims": "청구항 3의 범위 재검토 필요",
    "description": "배경기술 부분 보완 필요",
    "drawings": "",
    "general": "전반적으로 양호하나 일부 수정 필요"
  },
  "priority": "high"
}
```

---

## 8. 구현 결과 ✅

### 8.1. n8n 워크플로우 정보

| 항목 | 값 |
|------|-----|
| **Workflow ID** | `zSXpWko9op4hnSBr` |
| **Workflow Name** | `WF04-명세서검수` |
| **Status** | Inactive (테스트 완료 후 활성화) |
| **Local JSON** | `workflows/WF04-human-review.json` |
| **생성일** | 2026-01-10 |

### 8.2. 구현된 노드 구조 (9개)

```
[검수 요청 Webhook] --> [검수 데이터 준비] --> [검수 Form]
                                                    |
                                                    v
                                          [승인 여부 확인]
                                                    |
                              +-----------------+-------------------+
                              |                                     |
                              v                                     v
                       [승인 처리]                          [수정 요청 처리]
                              |                                     |
                              v                                     v
                    [승인 완료 출력]                        [수정 요청 출력]
                              |                                     |
                              +----------------+--------------------+
                                               |
                                               v
                                         [결과 병합]
```

### 8.3. 주요 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| Webhook 트리거 | ✅ 구현 | POST /wf04-review-request |
| 검수 데이터 준비 | ✅ 구현 | 검수 ID 생성, 메타데이터 정리 |
| 검수 Form | ✅ 구현 | 7개 필드 (승인상태, 피드백 등) |
| 승인/반려 분기 | ✅ 구현 | IF 노드 조건 분기 |
| 승인 처리 | ✅ 구현 | 최종 버전 생성 |
| 수정 요청 처리 | ✅ 구현 | 피드백 구조화 |
| 결과 병합 | ✅ 구현 | 단일 출력으로 통합 |

### 8.4. 검수 Form 필드

| 필드명 | 타입 | 필수 | 옵션 |
|--------|------|------|------|
| 검수 ID | text | Y | 자동 입력 |
| 승인 상태 | dropdown | Y | 승인/수정 필요/반려 |
| 청구항 피드백 | textarea | N | - |
| 상세설명 피드백 | textarea | N | - |
| 도면설명 피드백 | textarea | N | - |
| 전체 의견 | textarea | N | - |
| 수정 우선순위 | dropdown | N | 높음/보통/낮음 |

### 8.5. 분기 처리 로직

```
승인 상태 === "승인"
    → 승인 처리 → status: "approved", version: "1.0.0-final"

승인 상태 === "수정 필요"
    → 수정 요청 처리 → status: "revision_requested", feedback: {...}

승인 상태 === "반려"
    → 수정 요청 처리 → status: "rejected", feedback: {...}
```

### 8.6. 출력 데이터 스키마

**승인 시:**
```json
{
  "submission_id": "REV-xxx",
  "status": "approved",
  "approved_at": "2026-01-10T15:30:00Z",
  "version": "1.0.0-final",
  "message": "특허 명세서가 승인되었습니다."
}
```

**수정 요청 시:**
```json
{
  "submission_id": "REV-xxx",
  "status": "revision_requested",
  "feedback": {
    "claims": "청구항 3 범위 재검토 필요",
    "description": "",
    "drawings": "",
    "general": "전반적으로 양호"
  },
  "priority": "높음",
  "message": "수정이 요청되었습니다."
}
```

---

*문서 버전: 1.1.0*
*작성일: 2026-01-10*
*최종 수정: 2026-01-10 (구현 결과 추가)*
