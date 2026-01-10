# [Workflow] Claude Code 명세서 생성

> **WF03: Claude Code 기반 특허 명세서 자동 생성 워크플로우**

---

## 1. 개요

이 문서는 Claude Code를 활용하여 발명 제안서로부터 KIPO 규격 특허 명세서를 자동 생성하는 워크플로우(WF03)의 상세 설계를 기술합니다.

### 1.1. 워크플로우 목표

- **입력**: 검증된 발명 제안서 + 선행기술 컨텍스트
- **출력**: KIPO 표준 특허 명세서 (Markdown)
- **핵심 가치**: 작성 시간 80% 단축, 법적 안정성 확보

### 1.2. 생성 순서 (PRD 명시)

```
청구항 (Claims) → 상세한 설명 (Description) → 도면의 간단한 설명 (Drawing Description)
```

> **중요**: 청구항을 먼저 작성하여 권리 범위를 확정한 후, 이를 기반으로 상세 설명을 작성합니다.

---

## 2. 워크플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WF03: Claude Code 명세서 생성                      │
└─────────────────────────────────────────────────────────────────────────┘

[Webhook Trigger] ──→ [Load Context] ──→ [Generate Claims]
        │                    │                   │
        │                    ▼                   │ Extended Thinking
        │            ┌──────────────┐            │
        │            │ 발명 제안서   │            ▼
        │            │ 선행기술 요약 │      ┌──────────────┐
        │            │ IPC 코드     │      │ 청구항 생성   │
        │            └──────────────┘      │ (독립항/종속항)│
        │                                   └──────┬───────┘
        │                                          │
        │                                          ▼
        │                                   [Generate Description]
        │                                          │
        │                                          ▼
        │                                   ┌──────────────┐
        │                                   │ 상세한 설명   │
        │                                   │ 생성         │
        │                                   └──────┬───────┘
        │                                          │
        │                                          ▼
        │                                   [Generate Drawing Desc]
        │                                          │
        │                                          ▼
        │                                   ┌──────────────┐
        │                                   │ 도면 설명    │
        │                                   │ 생성         │
        │                                   └──────┬───────┘
        │                                          │
        │                                          ▼
        │                                   [Format KIPO]
        │                                          │
        │                                          ▼
        │                                   ┌──────────────┐
        │                                   │ KIPO 표준    │
        │                                   │ 포맷팅       │
        │                                   └──────┬───────┘
        │                                          │
        │                                          ▼
        │                                   [Export & Trigger WF04]
        │                                          │
        │                                          ▼
        │                                   ┌──────────────┐
        │                                   │ 명세서 저장   │
        │                                   │ → 검수 요청   │
        │                                   └──────────────┘
```

---

## 3. 노드 상세 설계

### 3.1. Webhook Trigger 노드

**목적**: WF02(선행기술 검색)에서 트리거 수신

```json
{
  "node": "Webhook",
  "parameters": {
    "path": "generate-patent-spec",
    "httpMethod": "POST",
    "responseMode": "onReceived",
    "options": {}
  }
}
```

**Input Schema:**
```json
{
  "invention_id": "INV-2026-0001",
  "invention_data": {
    "title": "발명의 명칭",
    "technical_field": "기술분야",
    "background": { "problem": "...", "existing_solutions": "..." },
    "solution": { "technical_means": "...", "key_features": [...] },
    "effects": [...],
    "drawings": [...]
  },
  "prior_art_context": {
    "summary": "선행기술 요약",
    "patents": [...],
    "relevance_scores": {...}
  },
  "ipc_codes": ["G06F 40/166", "G06N 3/08"]
}
```

### 3.2. Load Context 노드 (Code)

**목적**: 발명 데이터와 선행기술 컨텍스트 통합

```javascript
// Load Context - 발명 데이터 및 선행기술 통합
const input = $input.first().json;

const inventionData = input.invention_data;
const priorArt = input.prior_art_context;
const ipcCodes = input.ipc_codes;

// CLAUDE.md 지침 로드 (프로젝트 루트에서)
const claudeInstructions = `
## 금지 어구
- "완벽한", "절대적인", "최고의" 등 과장 표현 금지
- "일 실시예에서" 대신 "본 발명의 일 실시예에 따르면" 사용

## 도면 부호 규칙
- 100번대: 주요 구성요소 (100, 200, 300...)
- 10번대: 세부 구성요소 (110, 120, 210...)
- S100: 단계(Step) 표시 (S100, S200...)

## 용어 일관성
- 동일 구성요소는 명세서 전체에서 동일한 용어 사용
- 첫 등장 시 "(이하 'OOO'라 함)" 형식으로 정의
`;

// 컨텍스트 구성
const context = {
  invention: inventionData,
  priorArt: priorArt,
  ipcCodes: ipcCodes,
  instructions: claudeInstructions,
  metadata: {
    inventionId: input.invention_id,
    timestamp: new Date().toISOString()
  }
};

return [{ json: context }];
```

### 3.3. Generate Claims 노드 (Execute Command)

**목적**: Claude Code CLI를 통한 청구항 생성 (Extended Thinking 활용)

```json
{
  "node": "Execute Command",
  "parameters": {
    "command": "claude --print \"{{ $json.claimPrompt }}\" --output-format json",
    "cwd": "/workspace/maipatent"
  }
}
```

**Set 노드 (프롬프트 준비):**
```javascript
// 청구항 생성 프롬프트 구성
const context = $input.first().json;

const claimPrompt = `
당신은 숙련된 한국 변리사입니다. 다음 발명 제안서를 분석하여 특허 청구항을 작성하세요.

## 발명 정보
- 발명의 명칭: ${context.invention.title}
- 기술분야: ${context.invention.technical_field}
- 해결하려는 과제: ${context.invention.background.problem}
- 기술적 수단: ${context.invention.solution.technical_means}
- 핵심 특징: ${context.invention.solution.key_features.join(', ')}

## 선행기술 분석
${context.priorArt.summary}

## 작성 지침
${context.instructions}

## 청구항 작성 규칙
1. 독립항은 발명의 핵심 구성요소를 모두 포함
2. 종속항은 독립항의 구성을 구체화하거나 추가 특징 한정
3. 전제부(preamble) → 특징부(characterizing portion) 구조 사용
4. 선행기술 대비 신규성과 진보성을 명확히 표현

## 출력 형식
JSON 형식으로 출력:
{
  "independent_claims": ["청구항 1", "청구항 5"],
  "dependent_claims": ["청구항 2", "청구항 3", "청구항 4"],
  "claim_tree": { "1": ["2", "3", "4"], "5": ["6", "7"] }
}
`;

return [{ json: { ...context, claimPrompt } }];
```

### 3.4. Generate Description 노드 (Execute Command)

**목적**: 청구항 기반 상세한 설명 생성

```javascript
// 상세한 설명 생성 프롬프트
const context = $input.first().json;
const claims = $input.first().json.generatedClaims;

const descriptionPrompt = `
당신은 숙련된 한국 변리사입니다. 앞서 작성된 청구항을 기반으로 상세한 설명을 작성하세요.

## 청구항
${JSON.stringify(claims, null, 2)}

## 발명 정보
- 발명의 명칭: ${context.invention.title}
- 기술분야: ${context.invention.technical_field}
- 도면 목록: ${context.invention.drawings.map(d => d.figure_number).join(', ')}

## 작성 지침
${context.instructions}

## 상세한 설명 구조
1. 【기술분야】
2. 【배경기술】
3. 【발명의 내용】
   - 【해결하려는 과제】
   - 【과제의 해결 수단】
   - 【발명의 효과】
4. 【발명을 실시하기 위한 구체적인 내용】

## 출력 형식
각 섹션을 KIPO 표준 식별 기호와 함께 마크다운으로 출력
`;

return [{ json: { ...context, claims, descriptionPrompt } }];
```

### 3.5. Generate Drawing Description 노드

**목적**: 도면의 간단한 설명 생성

```javascript
// 도면 설명 생성 프롬프트
const context = $input.first().json;
const drawings = context.invention.drawings;

const drawingPrompt = `
당신은 숙련된 한국 변리사입니다. 다음 도면 정보를 바탕으로 "도면의 간단한 설명"을 작성하세요.

## 도면 목록
${drawings.map(d => `- ${d.figure_number}: ${d.description}`).join('\n')}

## 도면 부호 규칙
- 100번대: 주요 구성요소
- 10번대: 세부 구성요소
- S100: 단계 표시

## 출력 형식
【도면의 간단한 설명】
도 1은 본 발명의 일 실시예에 따른 OOO의 전체 구성을 나타내는 블록도이다.
도 2는 ...
`;

return [{ json: { ...context, drawingPrompt } }];
```

### 3.6. Format KIPO 노드 (Code)

**목적**: 생성된 섹션들을 KIPO 표준 형식으로 통합

```javascript
// KIPO 표준 포맷 조립
const context = $input.first().json;
const claims = context.generatedClaims;
const description = context.generatedDescription;
const drawingDesc = context.generatedDrawingDesc;

// KIPO 표준 명세서 템플릿
const kipoDocument = `
【발명의 명칭】
${context.invention.title}

【기술분야】
${description.technical_field}

【배경기술】
${description.background}

【발명의 내용】

【해결하려는 과제】
${description.problem_to_solve}

【과제의 해결 수단】
${description.solution_means}

【발명의 효과】
${description.effects}

【도면의 간단한 설명】
${drawingDesc}

【발명을 실시하기 위한 구체적인 내용】
${description.detailed_description}

【특허청구범위】
${claims.independent_claims.concat(claims.dependent_claims).map((claim, i) =>
  `【청구항 ${i + 1}】\n${claim}`
).join('\n\n')}

【요약서】
【요약】
${description.abstract}

【대표도】
도 1
`;

// 메타데이터 추가
const output = {
  document: kipoDocument,
  metadata: {
    inventionId: context.metadata.inventionId,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    claimCount: claims.independent_claims.length + claims.dependent_claims.length,
    wordCount: kipoDocument.split(/\s+/).length
  }
};

return [{ json: output }];
```

### 3.7. Export & Trigger WF04 노드

**목적**: 명세서 저장 및 검수 워크플로우 트리거

```javascript
// Google Drive에 명세서 저장
const output = $input.first().json;
const inventionId = output.metadata.inventionId;
const fileName = `${inventionId}_명세서_v${output.metadata.version}.md`;

// 저장 경로 구성
const savePath = {
  driveFolder: 'MAIPatent/Generated',
  fileName: fileName,
  content: output.document
};

// WF04 트리거 데이터
const reviewRequest = {
  inventionId: inventionId,
  documentPath: `${savePath.driveFolder}/${savePath.fileName}`,
  metadata: output.metadata,
  requestedAt: new Date().toISOString(),
  reviewType: 'initial_review'
};

return [{ json: { savePath, reviewRequest } }];
```

---

## 4. Extended Thinking 활용

### 4.1. 청구항 작성 시 활용

Claude의 Extended Thinking 기능은 복잡한 논리 구조가 필요한 청구항 작성에 특히 유용합니다.

**활용 시나리오:**
- 독립항의 범위 설정 (신규성/진보성 극대화)
- 선행기술 회피 전략 수립
- 종속항 계층 구조 설계

**프롬프트 패턴:**
```
<thinking>
선행기술 분석 결과를 바탕으로 본 발명의 핵심 차별점을 파악합니다.
1. 선행기술 A는 ~를 개시하지만, ~가 부족함
2. 선행기술 B는 ~를 해결했으나, ~의 문제가 있음
3. 본 발명은 ~를 통해 이러한 문제를 해결함

따라서 청구항 1의 특징부에는 ~를 포함해야 합니다.
</thinking>
```

### 4.2. API 호출 설정

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 16000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  }
}
```

---

## 5. 에러 처리

### 5.1. 생성 실패 시 재시도

```javascript
// Error Trigger 노드
const error = $input.first().json;
const maxRetries = 3;
const currentRetry = $input.first().json.retryCount || 0;

if (currentRetry < maxRetries) {
  // 재시도
  return [{
    json: {
      action: 'retry',
      retryCount: currentRetry + 1,
      delay: Math.pow(2, currentRetry) * 1000 // 지수 백오프
    }
  }];
} else {
  // 수동 검토 요청
  return [{
    json: {
      action: 'manual_review',
      error: error.message,
      context: error.context
    }
  }];
}
```

### 5.2. 품질 검증 실패

```javascript
// 품질 검증 노드
const document = $input.first().json.document;

const qualityChecks = {
  // 용어 일관성 검사
  termConsistency: checkTermConsistency(document),
  // 전제 기초 검사
  antecedentBasis: checkAntecedentBasis(document),
  // 도면 부호 일관성
  drawingReferences: checkDrawingReferences(document),
  // 금지 어구 검사
  forbiddenPhrases: checkForbiddenPhrases(document)
};

const failedChecks = Object.entries(qualityChecks)
  .filter(([key, result]) => !result.passed);

if (failedChecks.length > 0) {
  return [{
    json: {
      action: 'quality_fix',
      issues: failedChecks.map(([key, result]) => ({
        check: key,
        details: result.issues
      }))
    }
  }];
}

return [{ json: { action: 'proceed', document } }];
```

---

## 6. 성능 최적화

### 6.1. 병렬 처리

독립적인 섹션은 병렬로 생성하여 속도 향상:

```
                    ┌── [도면 설명 생성] ──┐
[청구항 생성] ──→  │                      ├── [Format KIPO]
                    └── [요약서 생성] ────┘
```

### 6.2. 캐싱 전략

- 유사한 기술분야의 이전 생성 결과 참조
- IPC 코드별 템플릿 문구 캐싱
- 도면 부호 패턴 재사용

---

## 7. 출력 예시

### 7.1. 생성된 청구항 예시

```markdown
【청구항 1】
인공지능을 이용한 특허 명세서 자동 생성 시스템에 있어서,
발명 제안서를 수신하는 입력 모듈;
상기 발명 제안서로부터 키워드를 추출하고 선행기술을 검색하는 선행기술 분석 모듈;
상기 선행기술 분석 결과를 기반으로 청구항을 생성하는 청구항 생성 모듈; 및
상기 청구항에 기초하여 상세한 설명을 생성하는 명세서 작성 모듈;
을 포함하는 것을 특징으로 하는 특허 명세서 자동 생성 시스템.

【청구항 2】
제1항에 있어서,
상기 청구항 생성 모듈은,
Extended Thinking 기능을 활용하여 신규성 및 진보성을 극대화하는 청구항 범위를 결정하는 것을 특징으로 하는 특허 명세서 자동 생성 시스템.
```

---

## 8. WF04 연계

생성 완료 후 WF04(Human-in-the-loop 검수)로 전달:

```json
{
  "inventionId": "INV-2026-0001",
  "documentPath": "MAIPatent/Generated/INV-2026-0001_명세서_v1.0.0.md",
  "metadata": {
    "generatedAt": "2026-01-10T10:30:00Z",
    "claimCount": 7,
    "wordCount": 3500
  },
  "reviewType": "initial_review"
}
```

---

## 9. 구현 결과 ✅

### 9.1. n8n 워크플로우 정보

| 항목 | 값 |
|------|-----|
| **Workflow ID** | `7kZOpw4nYXj5aWIG` |
| **Workflow Name** | `WF03-명세서생성` |
| **Status** | Inactive (테스트 완료 후 활성화) |
| **Local JSON** | `workflows/WF03-patent-generation.json` |
| **생성일** | 2026-01-10 |

### 9.2. 구현된 노드 구조 (10개)

```
[Webhook Trigger] --> [컨텍스트 로드] --> [청구항 프롬프트 준비]
                                               |
                                               v
                                      [청구항 생성 (AI)]
                                               |
                                               v
                                  [상세설명 프롬프트 준비]
                                               |
                                               v
                                    [상세설명 생성 (AI)]
                                               |
                                               v
                                  [도면설명 프롬프트 준비]
                                               |
                                               v
                                    [도면설명 생성 (AI)]
                                               |
                                               v
                                      [KIPO 포맷 조립]
                                               |
                                               v
                                    [출력 데이터 설정]
```

### 9.3. 주요 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| Webhook 트리거 | ✅ 구현 | POST /wf03-generate-patent-spec |
| 컨텍스트 통합 | ✅ 구현 | 발명 데이터 + 선행기술 통합 |
| 청구항 생성 (AI) | ✅ 구현 | GPT-4o 기반, 독립항+종속항 |
| 상세설명 생성 (AI) | ✅ 구현 | 청구항 기반 KIPO 규격 설명 |
| 도면설명 생성 (AI) | ✅ 구현 | 도면의 간단한 설명 자동 생성 |
| KIPO 포맷 조립 | ✅ 구현 | 전체 섹션 통합, 표준 식별 기호 |
| 품질 검증 | ⏳ 향후 | 용어 일관성, 전제 기초 검사 |

### 9.4. 생성 순서 (PRD 준수)

```
1. 청구항 (Claims) - 권리 범위 확정
2. 상세한 설명 (Description) - 청구항 기반 구체화
3. 도면의 간단한 설명 (Drawing Description) - 도면 참조 설명
```

### 9.5. AI 모델 설정

| 항목 | 값 |
|------|-----|
| **모델** | GPT-4o |
| **청구항 생성 max_tokens** | 2000 |
| **상세설명 생성 max_tokens** | 4000 |
| **도면설명 생성 max_tokens** | 1000 |
| **Temperature** | 0.3 (일관성 우선) |

### 9.6. 출력 데이터 스키마

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

### 9.7. OpenAI 자격 증명 설정 필요

> **참고**: 워크플로우 실행을 위해 n8n에서 OpenAI API 자격 증명을 설정해야 합니다.
> - n8n Cloud → Credentials → OpenAI API 추가
> - 워크플로우 내 AI 노드에 자격 증명 연결

---

*문서 버전: 1.1.0*
*작성일: 2026-01-10*
*최종 수정: 2026-01-10 (구현 결과 추가)*
