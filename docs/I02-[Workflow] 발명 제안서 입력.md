# [Workflow] 발명 제안서 입력 워크플로우

> **WF01: 발명 제안서 수집 및 검증 워크플로우 상세 설계**

---

## 1. 워크플로우 개요

| 항목 | 내용 |
|------|------|
| **워크플로우 ID** | WF01 |
| **워크플로우명** | 발명 제안서 입력 |
| **목적** | 발명 제안서 수집, 검증, 저장 |
| **트리거** | Form Submit / Webhook / Google Drive |
| **출력** | 검증된 발명 데이터, WF02 트리거 |

---

## 2. 워크플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WF01: 발명 제안서 입력                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐                                                 │
│  │    TRIGGER    │                                                 │
│  │  ┌─────────┐  │                                                 │
│  │  │n8n Form │  │  ← 사용자 직접 입력                             │
│  │  └────┬────┘  │                                                 │
│  │       │       │                                                 │
│  │  ┌────┴────┐  │                                                 │
│  │  │ Webhook │  │  ← 외부 시스템 연동                             │
│  │  └────┬────┘  │                                                 │
│  │       │       │                                                 │
│  │  ┌────┴────┐  │                                                 │
│  │  │G-Drive  │  │  ← 파일 업로드                                  │
│  │  └─────────┘  │                                                 │
│  └───────┬───────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                 │
│  │ MERGE INPUT   │  ← 입력 소스 통합                               │
│  └───────┬───────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                 │
│  │   VALIDATE    │  ← 필수 필드 검증                               │
│  │               │                                                 │
│  │ - 발명 제목   │                                                 │
│  │ - 기술분야    │                                                 │
│  │ - 해결과제    │                                                 │
│  │ - 해결수단    │                                                 │
│  └───────┬───────┘                                                 │
│          │                                                          │
│     ┌────┴────┐                                                    │
│     ▼         ▼                                                    │
│  ┌─────┐  ┌─────┐                                                  │
│  │PASS │  │FAIL │                                                  │
│  └──┬──┘  └──┬──┘                                                  │
│     │        │                                                      │
│     │        ▼                                                      │
│     │   ┌─────────┐                                                │
│     │   │ ERROR   │  → 사용자에게 오류 알림                        │
│     │   │ NOTIFY  │                                                │
│     │   └─────────┘                                                │
│     │                                                               │
│     ▼                                                               │
│  ┌───────────────┐                                                 │
│  │   ENRICH      │  ← 데이터 보강                                  │
│  │               │                                                 │
│  │ - IPC 코드 추출│                                                │
│  │ - 키워드 추출 │                                                 │
│  │ - 메타데이터  │                                                 │
│  └───────┬───────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                 │
│  │    STORE      │  ← Google Sheets 저장                           │
│  └───────┬───────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                 │
│  │ TRIGGER WF02  │  → 선행기술 검색 워크플로우 호출                │
│  └───────────────┘                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 노드 상세 설계

### 3.1. Trigger: n8n Form

**Form 필드 구성:**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `invention_title` | Text | Y | 발명의 명칭 |
| `technical_field` | Text | Y | 기술분야 |
| `problem_to_solve` | Textarea | Y | 해결하려는 과제 |
| `existing_problems` | Textarea | N | 기존 해결책의 문제점 |
| `solution_description` | Textarea | Y | 발명의 핵심 구성 |
| `advantages` | Textarea | Y | 발명의 효과 |
| `drawings` | File | N | 도면 파일 (선택) |
| `drawing_descriptions` | Textarea | N | 도면 설명 |
| `applicant_name` | Text | Y | 출원인 |
| `inventor_name` | Text | Y | 발명자 |

**Form JSON 설정:**
```json
{
  "node": "n8n Form Trigger",
  "parameters": {
    "formTitle": "발명 제안서 입력",
    "formDescription": "특허 명세서 자동 생성을 위한 발명 제안서를 입력해주세요.",
    "formFields": [
      {
        "fieldLabel": "발명의 명칭",
        "fieldType": "text",
        "requiredField": true,
        "placeholder": "예: 인공지능 기반 특허 명세서 자동 생성 시스템"
      },
      {
        "fieldLabel": "기술분야",
        "fieldType": "text",
        "requiredField": true,
        "placeholder": "예: 인공지능, 자연어처리, 특허 자동화"
      },
      {
        "fieldLabel": "해결하려는 과제",
        "fieldType": "textarea",
        "requiredField": true,
        "placeholder": "발명이 해결하고자 하는 기술적 과제를 상세히 기술해주세요."
      },
      {
        "fieldLabel": "발명의 핵심 구성",
        "fieldType": "textarea",
        "requiredField": true,
        "placeholder": "발명의 핵심적인 기술적 구성을 기술해주세요."
      },
      {
        "fieldLabel": "발명의 효과",
        "fieldType": "textarea",
        "requiredField": true,
        "placeholder": "발명으로 인해 얻을 수 있는 기술적 효과를 기술해주세요."
      }
    ],
    "options": {
      "respondWith": "redirect",
      "redirectUrl": "https://maipatent.com/submission-complete"
    }
  }
}
```

### 3.2. Trigger: Webhook

**Webhook 설정:**
```json
{
  "node": "Webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "invention-input",
    "responseMode": "responseNode",
    "options": {
      "rawBody": false
    }
  }
}
```

**예상 Payload:**
```json
{
  "invention": {
    "title": "발명의 명칭",
    "technical_field": "기술분야",
    "background": {
      "problem": "해결하려는 과제",
      "existing_problems": "기존 문제점"
    },
    "solution": {
      "description": "핵심 구성",
      "advantages": "발명의 효과"
    }
  },
  "metadata": {
    "applicant": "출원인",
    "inventor": "발명자"
  }
}
```

### 3.3. Validate: Code 노드

```javascript
// 발명 제안서 검증
const input = $input.first().json;

const errors = [];

// 필수 필드 검증
const requiredFields = [
  { key: 'invention_title', label: '발명의 명칭' },
  { key: 'technical_field', label: '기술분야' },
  { key: 'problem_to_solve', label: '해결하려는 과제' },
  { key: 'solution_description', label: '발명의 핵심 구성' },
  { key: 'advantages', label: '발명의 효과' },
  { key: 'applicant_name', label: '출원인' },
  { key: 'inventor_name', label: '발명자' }
];

for (const field of requiredFields) {
  if (!input[field.key] || input[field.key].trim() === '') {
    errors.push(`${field.label}은(는) 필수 입력 항목입니다.`);
  }
}

// 최소 길이 검증
if (input.problem_to_solve && input.problem_to_solve.length < 50) {
  errors.push('해결하려는 과제는 최소 50자 이상 입력해주세요.');
}

if (input.solution_description && input.solution_description.length < 100) {
  errors.push('발명의 핵심 구성은 최소 100자 이상 입력해주세요.');
}

// 검증 결과 반환
if (errors.length > 0) {
  return [{
    json: {
      valid: false,
      errors: errors,
      input: input
    }
  }];
}

return [{
  json: {
    valid: true,
    data: input
  }
}];
```

### 3.4. Enrich: 데이터 보강

```javascript
// 데이터 보강: IPC 코드 추천, 키워드 추출
const data = $input.first().json.data;

// 키워드 추출 (간단한 버전)
const allText = `${data.invention_title} ${data.technical_field} ${data.problem_to_solve}`;
const words = allText.split(/\s+/);
const stopWords = ['및', '또는', '의', '을', '를', '이', '가', '은', '는', '에', '로', '으로'];
const keywords = [...new Set(words)]
  .filter(w => w.length > 1 && !stopWords.includes(w))
  .slice(0, 10);

// IPC 코드 추천 (키워드 기반 - 추후 API 연동)
const ipcSuggestions = suggestIPCCodes(data.technical_field);

// 메타데이터 추가
const enrichedData = {
  ...data,
  keywords: keywords,
  suggested_ipc: ipcSuggestions,
  submission_id: generateId(),
  submission_date: new Date().toISOString(),
  status: 'pending'
};

return [{ json: enrichedData }];

// Helper 함수
function suggestIPCCodes(technicalField) {
  const ipcMap = {
    '인공지능': 'G06N',
    '자연어처리': 'G06F 40',
    '특허': 'G06Q 50/18',
    '자동화': 'G05B 19',
    '딥러닝': 'G06N 3/08',
    '머신러닝': 'G06N 20'
  };

  const suggestions = [];
  for (const [keyword, ipc] of Object.entries(ipcMap)) {
    if (technicalField.includes(keyword)) {
      suggestions.push(ipc);
    }
  }
  return suggestions.length > 0 ? suggestions : ['G06F'];
}

function generateId() {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 3.5. Store: Google Sheets

**Google Sheets 노드 설정:**
```json
{
  "node": "Google Sheets",
  "parameters": {
    "operation": "appendOrUpdate",
    "documentId": "={{$env.INVENTION_SHEET_ID}}",
    "sheetName": "발명제안서",
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "submission_id": "={{$json.submission_id}}",
        "invention_title": "={{$json.invention_title}}",
        "technical_field": "={{$json.technical_field}}",
        "problem_to_solve": "={{$json.problem_to_solve}}",
        "solution_description": "={{$json.solution_description}}",
        "advantages": "={{$json.advantages}}",
        "keywords": "={{$json.keywords.join(', ')}}",
        "suggested_ipc": "={{$json.suggested_ipc.join(', ')}}",
        "applicant_name": "={{$json.applicant_name}}",
        "inventor_name": "={{$json.inventor_name}}",
        "submission_date": "={{$json.submission_date}}",
        "status": "={{$json.status}}"
      }
    }
  }
}
```

### 3.6. Trigger WF02: HTTP Request

```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "POST",
    "url": "={{$env.N8N_WEBHOOK_BASE}}/wf02-prior-art-search",
    "authentication": "none",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "submission_id",
          "value": "={{$json.submission_id}}"
        },
        {
          "name": "keywords",
          "value": "={{$json.keywords}}"
        },
        {
          "name": "suggested_ipc",
          "value": "={{$json.suggested_ipc}}"
        },
        {
          "name": "invention_title",
          "value": "={{$json.invention_title}}"
        }
      ]
    }
  }
}
```

---

## 4. 에러 처리

### 4.1. 검증 실패 시 응답

```javascript
// Error Response 노드
const errors = $input.first().json.errors;

return [{
  json: {
    success: false,
    message: '입력 데이터 검증에 실패했습니다.',
    errors: errors,
    timestamp: new Date().toISOString()
  }
}];
```

### 4.2. 시스템 오류 시

```javascript
// Error Trigger 노드
const error = $input.first().json;

// 슬랙/이메일 알림
await $http.post({
  url: process.env.SLACK_WEBHOOK_URL,
  body: {
    text: `[MAIPatent] WF01 오류 발생\n${JSON.stringify(error, null, 2)}`
  }
});

// 에러 로그 저장
return [{
  json: {
    error_id: `ERR-${Date.now()}`,
    workflow: 'WF01',
    error: error,
    timestamp: new Date().toISOString()
  }
}];
```

---

## 5. 테스트 케이스

### 5.1. 정상 케이스

**입력:**
```json
{
  "invention_title": "인공지능 기반 특허 명세서 자동 생성 시스템",
  "technical_field": "인공지능, 자연어처리",
  "problem_to_solve": "종래의 특허 명세서 작성은 전문 인력이 수동으로 작성해야 하므로 시간과 비용이 많이 소요되는 문제가 있었다...",
  "solution_description": "본 발명은 인공지능 모델을 활용하여 발명 제안서로부터 특허 명세서를 자동으로 생성하는 시스템을 제공한다...",
  "advantages": "본 발명에 따르면, 특허 명세서 작성 시간을 80% 이상 단축할 수 있다...",
  "applicant_name": "MAI특허법인",
  "inventor_name": "홍길동"
}
```

**예상 결과:**
- 검증 통과
- Google Sheets에 저장
- WF02 트리거

### 5.2. 실패 케이스

**입력:**
```json
{
  "invention_title": "",
  "technical_field": "인공지능"
}
```

**예상 결과:**
```json
{
  "valid": false,
  "errors": [
    "발명의 명칭은(는) 필수 입력 항목입니다.",
    "해결하려는 과제은(는) 필수 입력 항목입니다.",
    "발명의 핵심 구성은(는) 필수 입력 항목입니다.",
    "발명의 효과은(는) 필수 입력 항목입니다.",
    "출원인은(는) 필수 입력 항목입니다.",
    "발명자은(는) 필수 입력 항목입니다."
  ]
}
```

---

## 6. 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `INVENTION_SHEET_ID` | Google Sheets 문서 ID | `1abc...xyz` |
| `N8N_WEBHOOK_BASE` | n8n Webhook 기본 URL | `https://mai-n8n.app.n8n.cloud/webhook` |
| `SLACK_WEBHOOK_URL` | Slack 알림 URL | `https://hooks.slack.com/...` |

---

## 7. 구현 결과 ✅

### 7.1. n8n 워크플로우 정보

| 항목 | 값 |
|------|-----|
| **Workflow ID** | `galbpC91RCA90yyi` |
| **Workflow Name** | `WF01-발명제안서입력` |
| **Status** | Inactive (테스트 완료 후 활성화) |
| **Local JSON** | `workflows/WF01-invention-input.json` |
| **생성일** | 2026-01-10 |

### 7.2. 구현된 노드 구조

```
[발명제안서 Form] ──→ [데이터 검증] ──→ [검증 결과 분기]
    (form-trigger)    (validate-code)      (if-valid)
                                              │
                            ┌─────────────────┴─────────────────┐
                            ▼                                   ▼
                     [데이터 보강]                         [오류 응답]
                     (enrich-code)                      (error-response)
                            │
                            ▼
                   [출력 데이터 설정]
                      (set-output)
```

### 7.3. 구현된 Form 필드

| 필드명 | 타입 | 필수 | 한글 라벨 |
|--------|------|------|-----------|
| 발명의 명칭 | text | ✅ | 발명의 명칭 |
| 기술분야 | text | ✅ | 기술분야 |
| 해결하려는 과제 | textarea | ✅ | 해결하려는 과제 |
| 발명의 핵심 구성 | textarea | ✅ | 발명의 핵심 구성 |
| 발명의 효과 | textarea | ✅ | 발명의 효과 |
| 출원인 | text | ✅ | 출원인 |
| 발명자 | text | ✅ | 발명자 |

### 7.4. 출력 데이터 스키마

```json
{
  "submission_id": "INV-1736499600000-abc123xyz",
  "invention_title": "발명의 명칭",
  "technical_field": "기술분야",
  "problem_to_solve": "해결하려는 과제",
  "solution_description": "발명의 핵심 구성",
  "advantages": "발명의 효과",
  "applicant_name": "출원인",
  "inventor_name": "발명자",
  "keywords": ["키워드1", "키워드2", ...],
  "suggested_ipc": ["G06N", "G06F 40", ...],
  "submission_date": "2026-01-10T08:18:07.791Z",
  "status": "submitted"
}
```

### 7.5. 미구현 항목 (추후 구현)

| 항목 | 상태 | 비고 |
|------|------|------|
| Google Sheets 저장 | 🔄 Pending | Credentials 설정 필요 |
| WF02 Webhook 연결 | 🔄 Pending | WF02 구현 후 연결 |
| Slack 알림 | 🔄 Pending | Optional |

---

*문서 버전: 1.1.0*
*작성일: 2026-01-10*
*최종 수정: 2026-01-10 (구현 결과 추가)*
