# MAIPatent 상세 시스템 설계서

> **문서 유형**: Design Document
> **작성일**: 2026-01-11
> **버전**: 1.0.0
> **목적**: n8n과 Claude Code를 결합한 에이전틱 특허 명세서 작성 엔진의 상세 설계

---

## 1. 시스템 아키텍처 개요

### 1.1. 설계 철학: 오케스트라 비유

본 시스템은 **숙련된 명세사가 지휘하는 오케스트라**와 같은 구조로 설계되었습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎼 MAIPatent 오케스트라                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 지휘자 (n8n Orchestrator)                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 연주 순서 제어 (워크플로우 체인: WF01→WF02→WF03→WF04)   │   │
│  │ • 외부 연주자 초청 (KIPRIS API, Google Drive)             │   │
│  │ • 청중(검수자) 피드백 수집 (Human-in-the-loop)            │   │
│  │ • 악보 배포 (컨텍스트 전달)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  🎻 수석 연주자 (Claude Code Agentic Engine)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 각 악장(섹션) 완벽 연주 (청구항, 상세설명, 도면설명)      │   │
│  │ • 악보(CLAUDE.md) 해석 및 실행                           │   │
│  │ • 자체 교정 (품질 검증 루프)                              │   │
│  │ • Extended Thinking으로 복잡한 구절 해석                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  📜 교향곡 (KIPO 규격 특허 명세서)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 법적 안정성 확보 (전제 기초, 용어 일관성)                │   │
│  │ • 전문가 수준 품질 (변리사 검수 통과)                     │   │
│  │ • KIPO 표준 형식 준수 (【】 식별 기호)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2. 핵심 구성요소

| 구성요소 | 역할 | 기술 스택 |
|----------|------|-----------|
| **오케스트레이터** | 전체 프로세스 지휘, 외부 API 연동, 작업 순서 제어 | n8n Cloud |
| **에이전틱 엔진** | 실질적인 기술 분석 및 문서 생성, 자율적 품질 검증 | Claude Code CLI |
| **데이터 인프라** | 입출력 관리, 보안 격리 | Google Drive, Docker |
| **품질 게이트** | Human-in-the-loop 검수, 피드백 반영 | n8n Wait Node + Form |

### 1.3. 시스템 흐름도

```
발명자                    n8n (지휘자)                Claude Code (연주자)
   │                          │                              │
   │ 발명 제안서 제출          │                              │
   │ ─────────────────────→   │                              │
   │                          │ 데이터 검증                   │
   │                          │ ───────────────────────────→ │
   │                          │                              │ 키워드/IPC 추출
   │                          │                              │
   │                          │ KIPRIS API 호출              │
   │                          │ ←───────────────────────────│
   │                          │                              │
   │                          │ 명세서 생성 요청              │
   │                          │ ───────────────────────────→ │
   │                          │                              │ 청구항 생성
   │                          │                              │ 상세설명 생성
   │                          │                              │ 도면설명 생성
   │                          │                              │ KIPO 포맷팅
   │                          │ 초안 완성                    │
   │                          │ ←───────────────────────────│
   │                          │                              │
검수자                        │ 검수 요청                    │
   │ ←────────────────────── │                              │
   │ 피드백 제출              │                              │
   │ ─────────────────────→  │                              │
   │                          │ (승인/수정 분기)             │
   │                          │                              │
   │ 최종 명세서 수령          │                              │
   │ ←────────────────────── │                              │
```

---

## 2. n8n 워크플로우 상세 설계

### 2.1. 핵심 노드 구성

#### 2.1.1. 데이터 수집 노드

| 노드 유형 | 용도 | 설정 |
|-----------|------|------|
| **Form Trigger** | 발명 제안서 직접 입력 | 7개 필수 필드 |
| **Webhook Trigger** | 외부 시스템 연동 | POST /wf0X-path |
| **Google Drive Node** | 파일 업로드 감지 | Watch 모드 |

#### 2.1.2. 외부 API 연동 노드

```javascript
// HTTP Request Node - KIPRIS API 설정
{
  "method": "GET",
  "url": "http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/freeSearch",
  "queryParameters": {
    "word": "={{ $json.keywords }}",
    "patent": "true",
    "utility": "true",
    "numOfRows": "10",
    "pageNo": "1",
    "ServiceKey": "={{ $env.KIPRIS_API_KEY }}"
  },
  "options": {
    "timeout": 30000,
    "retry": {
      "maxRetries": 3,
      "interval": 1000
    }
  }
}
```

#### 2.1.3. Claude Code 실행 노드

**현재 구현 (n8n Cloud - OpenAI Node 활용)**:
```javascript
// OpenAI Node 설정 (Claude API 호환)
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.claude_md_content }}"
    },
    {
      "role": "user",
      "content": "{{ $json.generation_prompt }}"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 16000
}
```

**향후 Self-hosted 옵션 (Execute Command Node)**:
```javascript
// Execute Command Node - Claude Code CLI 호출
{
  "command": "claude",
  "arguments": [
    "-p",
    "{{ $json.prompt }}",
    "--output-format", "json"
  ],
  "options": {
    "cwd": "/app/patent-workspace",
    "env": {
      "ANTHROPIC_API_KEY": "{{ $env.ANTHROPIC_API_KEY }}"
    },
    "timeout": 300000
  }
}
```

#### 2.1.4. 데이터 처리 노드

```javascript
// Code Node - KIPO 포맷 변환
const sections = $input.all();

// 【】 식별 기호 삽입
const formatKIPO = (content) => {
  const sectionHeaders = {
    'title': '【발명의 명칭】',
    'technical_field': '【기술분야】',
    'background': '【배경기술】',
    'problem': '【해결하려는 과제】',
    'solution': '【과제의 해결 수단】',
    'effect': '【발명의 효과】',
    'drawings': '【도면의 간단한 설명】',
    'detailed': '【발명을 실시하기 위한 구체적인 내용】',
    'claims': '【특허청구범위】',
    'abstract': '【요약서】'
  };

  // 섹션별 포맷팅 로직
  return formattedContent;
};

return sections.map(item => ({
  json: {
    formatted_spec: formatKIPO(item.json)
  }
}));
```

#### 2.1.5. Human-in-the-loop 노드

```javascript
// Wait Node 설정
{
  "resume": "form",
  "formTitle": "특허 명세서 검수",
  "formDescription": "생성된 명세서를 검토하고 피드백을 제공해주세요.",
  "formFields": [
    {
      "fieldLabel": "승인 상태",
      "fieldType": "dropdown",
      "requiredField": true,
      "fieldOptions": ["승인", "수정필요", "반려"]
    },
    {
      "fieldLabel": "청구항 피드백",
      "fieldType": "textarea",
      "requiredField": false
    },
    {
      "fieldLabel": "상세설명 피드백",
      "fieldType": "textarea",
      "requiredField": false
    }
  ],
  "timeout": "72h"
}
```

### 2.2. 보안 및 권한 설정

#### 2.2.1. n8n 환경 변수

```bash
# n8n 2.0+ Execute Command 노드 활성화 (Self-hosted 전용)
NODES_EXCLUDE="[]"

# API 키 관리
KIPRIS_API_KEY="your-kipris-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GOOGLE_DRIVE_CREDENTIALS="base64-encoded-credentials"

# 보안 설정
N8N_SECURE_COOKIE=true
N8N_SSL_KEY=/path/to/ssl/key
N8N_SSL_CERT=/path/to/ssl/cert
```

#### 2.2.2. API 키 관리 전략

| 키 유형 | 저장 위치 | 접근 제어 |
|---------|-----------|-----------|
| KIPRIS API Key | n8n Credentials | 워크플로우 내 암호화 |
| Anthropic API Key | n8n Credentials | Enterprise 등급 (ZDR) |
| Google OAuth | n8n Credentials | OAuth2 토큰 자동 갱신 |

---

## 3. Claude Code 에이전틱 엔진 설계

### 3.1. 실행 전략

#### 3.1.1. Print Mode (현재 구현)

n8n 워크플로우 내에서 Claude Code를 호출할 때 **Print Mode**를 사용하여 특정 섹션을 생성하고 즉시 종료합니다.

```bash
# CLI 호출 예시 (Self-hosted 환경)
claude -p "다음 발명 제안서를 기반으로 특허 청구항을 생성하세요: ..." --output-format json

# 플래그 설명
# -p, --prompt: 프롬프트 전달 후 즉시 종료
# --output-format json: JSON 형식 출력 (파싱 용이)
```

**n8n Cloud 환경에서의 구현**:
- OpenAI 호환 API를 통해 Claude 모델 직접 호출
- 각 섹션별 독립적인 AI 노드 실행

#### 3.1.2. Extended Thinking 활용

복잡한 논리 구조가 필요한 **청구항 작성** 시 Anthropic의 심층 사고 기능을 활용합니다.

```javascript
// Extended Thinking 설정
{
  "model": "claude-sonnet-4-20250514",
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  },
  "messages": [
    {
      "role": "user",
      "content": `
        ## 발명 제안서
        ${inventionData}

        ## 선행기술 분석
        ${priorArtContext}

        ## 작성 지침
        1. 독립항을 통해 권리 범위를 먼저 확정하세요
        2. 선행기술과의 차별점을 명확히 하세요
        3. 신규성과 진보성을 극대화하세요
        4. 종속항은 독립항을 구체화하세요
      `
    }
  ]
}
```

**Extended Thinking 적용 시점**:

| 섹션 | Extended Thinking | 이유 |
|------|-------------------|------|
| 청구항 (Claims) | ✅ 활성화 | 권리 범위 설정, 진보성 판단 필요 |
| 상세한 설명 | ❌ 비활성화 | 청구항 기반 확장, 단순 기술 |
| 도면 설명 | ❌ 비활성화 | 구조적 설명, 단순 나열 |
| 요약서 | ❌ 비활성화 | 청구항 요약, 단순 축약 |

### 3.2. 컨텍스트 관리 (CLAUDE.md)

#### 3.2.1. 지침 구조

프로젝트 루트의 `CLAUDE.md` 파일을 통해 다음 지침을 시스템에 주입합니다:

```markdown
# MAIPatent 특허 명세서 작성 지침

## 1. KIPO 표준 준수 (필수)
- 【】 전각 식별 기호 사용
- 섹션 순서 엄격 준수
- 아라비아 숫자 문단 번호

## 2. 금지 어구
| 금지 | 권장 |
|------|------|
| 완벽한, 절대적인 | 효과적인, 실질적인 |
| 최고의, 혁신적인 | 향상된, 개선된 |
| 100% 정확한 | 높은 정확도의 |

## 3. 도면 부호 규칙
- 100번대: 주요 구성요소 (100, 200, 300)
- 10번대: 세부 구성요소 (110, 120, 210)
- S100: 단계 표시 (S100, S200)

## 4. 전제 기초 (Antecedent Basis)
- 최초 언급: "프로세서"
- 이후 언급: "상기 프로세서"
```

#### 3.2.2. 용어집 관리

```yaml
# terminology.yaml - 프로젝트별 용어 정의
terms:
  - term: "발명 제안서"
    definition: "발명자가 작성한 발명 아이디어 기술 문서"
    usage: "상기 발명 제안서로부터..."

  - term: "선행기술"
    definition: "본 발명 이전에 공개된 관련 기술"
    usage: "선행기술 검색 결과에 따르면..."

  - term: "청구항"
    definition: "특허권의 보호 범위를 정의하는 기재"
    usage: "제1항의 청구항에 따르면..."
```

---

## 4. 명세서 생성 파이프라인 상세

### 4.1. 전체 파이프라인

한 번의 요청으로 전체를 작성하지 않고, **상호 검증하며 순차적으로 생성**합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    명세서 생성 파이프라인                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1단계] 데이터 수집 및 분석                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 발명 제안서에서 핵심 기술 요소 추출                       │   │
│  │ • 키워드 및 IPC 코드 자동 추출                             │   │
│  │ • KIPRIS 선행기술 검색 및 컨텍스트 구성                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  [2단계] 청구항 선행 생성 (Extended Thinking)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 독립항: 권리 범위 확정 (넓은 범위)                       │   │
│  │ • 종속항: 독립항 구체화 (좁은 범위)                        │   │
│  │ • 선행기술 대비 차별점 명확화                              │   │
│  │ • 신규성/진보성 극대화                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  [3단계] 본문 확장                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 【발명을 실시하기 위한 구체적인 내용】 작성               │   │
│  │ • 청구항 용어와 동일한 용어 사용 (일관성)                  │   │
│  │ • 도면 부호 체계적 적용                                   │   │
│  │ • 【도면의 간단한 설명】 작성                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  [4단계] 최종 검증 및 변환                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 자체 품질 검증:                                         │   │
│  │   - 청구항 용어 = 상세설명 용어? (일관성)                  │   │
│  │   - 전제 기초 검사 ("상기" 선행 정의 존재?)                │   │
│  │   - 도면 부호 일관성 검사                                 │   │
│  │ • KIPO 포맷 최종 적용                                     │   │
│  │ • Pandoc 변환 (.md → .docx/.pdf)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2. 단계별 상세

#### 4.2.1. 데이터 수집 및 분석

```javascript
// WF01: 발명 제안서 분석
const analyzeInvention = async (proposalData) => {
  // 1. 필수 필드 검증
  validateRequiredFields(proposalData);

  // 2. 키워드 추출
  const keywords = extractKeywords(proposalData.technical_description);

  // 3. IPC 코드 추천
  const ipcCodes = recommendIPC(keywords, proposalData.technical_field);

  // 4. 선행기술 검색 쿼리 생성
  const searchQuery = buildSearchQuery(keywords, ipcCodes);

  return {
    ...proposalData,
    extracted_keywords: keywords,
    recommended_ipc: ipcCodes,
    search_query: searchQuery
  };
};
```

#### 4.2.2. 청구항 선행 생성

```javascript
// WF03: 청구항 생성 프롬프트
const claimsPrompt = `
## 역할
당신은 한국 특허청(KIPO) 규격을 완벽히 준수하는 특허 명세서 전문가입니다.

## 입력 정보
### 발명 제안서
${inventionData}

### 선행기술 분석
${priorArtSummary}

## 작성 지침
1. **독립항 (청구항 1)**
   - 발명의 핵심 구성요소만 포함
   - 가능한 넓은 권리 범위 설정
   - 선행기술과 명확히 구별되는 특징 강조

2. **종속항 (청구항 2~N)**
   - "제N항에 있어서," 형식 사용
   - 독립항의 구체적 실시예 기술
   - 각 종속항은 하나의 추가 한정만 포함

3. **형식 요구사항**
   - 각 청구항은 단일 문장
   - 전제부 → 특징부 구조
   - "~을 특징으로 하는" 종결

## 출력 형식
【특허청구범위】
【청구항 1】
[독립항 내용]

【청구항 2】
[종속항 내용]
...
`;
```

#### 4.2.3. 본문 확장

```javascript
// WF03: 상세설명 생성 프롬프트
const descriptionPrompt = `
## 역할
당신은 특허 명세서의 상세한 설명 섹션을 작성하는 전문가입니다.

## 입력 정보
### 생성된 청구항
${generatedClaims}

### 발명 제안서
${inventionData}

## 핵심 원칙
1. **용어 일관성**: 청구항에서 사용한 용어를 정확히 동일하게 사용
2. **도면 부호**: 100번대(주요), 10번대(세부) 체계 준수
3. **전제 기초**: 최초 언급 시 정의, 이후 "상기" 사용

## 섹션별 작성 지침
### 【기술분야】
- 1-2문장으로 간결하게
- "본 발명은 ~에 관한 것으로, 보다 상세하게는 ~에 관한 것이다."

### 【배경기술】
- 종래 기술의 문제점 기술
- 선행기술 문헌 인용

### 【해결하려는 과제】
- "본 발명은 상기와 같은 문제점을 해결하기 위하여 안출된 것으로서,"

### 【과제의 해결 수단】
- 청구항 내용을 설명적으로 풀어서 기술

### 【발명의 효과】
- 구체적이고 측정 가능한 효과

### 【발명을 실시하기 위한 구체적인 내용】
- 실시예를 통한 상세 설명
- 도면 부호 사용
`;
```

#### 4.2.4. 최종 검증

```javascript
// 품질 검증 로직
const validateSpecification = (spec) => {
  const errors = [];
  const warnings = [];

  // 1. 용어 일관성 검사
  const claimsTerms = extractTerms(spec.claims);
  const descriptionTerms = extractTerms(spec.description);
  const inconsistentTerms = findInconsistencies(claimsTerms, descriptionTerms);
  if (inconsistentTerms.length > 0) {
    errors.push(`용어 불일치: ${inconsistentTerms.join(', ')}`);
  }

  // 2. 전제 기초 검사
  const antecedentIssues = checkAntecedentBasis(spec);
  if (antecedentIssues.length > 0) {
    errors.push(`전제 기초 오류: ${antecedentIssues.join(', ')}`);
  }

  // 3. 도면 부호 일관성
  const drawingRefIssues = checkDrawingReferences(spec);
  if (drawingRefIssues.length > 0) {
    warnings.push(`도면 부호 불일치: ${drawingRefIssues.join(', ')}`);
  }

  // 4. 금지 어구 검사
  const forbiddenPhrases = checkForbiddenPhrases(spec);
  if (forbiddenPhrases.length > 0) {
    warnings.push(`금지 어구 발견: ${forbiddenPhrases.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
```

---

## 5. 데이터 보안 및 규정 준수

### 5.1. 제로 데이터 보존 (ZDR)

**Enterprise API 설정**:
- Anthropic Enterprise 등급 API 키 사용
- 입력된 발명 기밀 데이터가 모델 학습에 활용되지 않음
- 30일 후 자동 데이터 삭제

```javascript
// API 호출 시 ZDR 헤더
{
  "headers": {
    "anthropic-beta": "prompt-caching-2024-07-31",
    "x-api-data-retention": "none"
  }
}
```

### 5.2. 로컬 격리 (향후 Self-hosted 옵션)

```dockerfile
# Docker 컨테이너 설정
FROM node:20-slim

# 보안 사용자 생성
RUN useradd -m -s /bin/bash patent-agent

# 작업 디렉토리 격리
WORKDIR /app/patent-workspace
RUN chown -R patent-agent:patent-agent /app

# Claude Code CLI 설치
RUN npm install -g @anthropic-ai/claude-code

# 비특권 사용자로 실행
USER patent-agent

# 임시 파일 자동 정리
CMD ["sh", "-c", "claude -p \"$PROMPT\" && rm -rf /tmp/*"]
```

**보안 조치**:
- Docker 컨테이너 환경에서 실행
- 작업 완료 후 임시 파일 즉시 삭제
- 네트워크 격리 (필요한 API만 허용)

### 5.3. KIPO 가이드라인 준수

**2025년 최신 명세서 기재 요령 준수**:

| 항목 | 요구사항 | 구현 방법 |
|------|----------|-----------|
| 식별 기호 | 【】 전각 문자 | Code Node 자동 삽입 |
| 문단 번호 | 아라비아 숫자 | 자동 넘버링 |
| 섹션 순서 | KIPO 표준 순서 | 템플릿 기반 조립 |
| 용어 정의 | "(이하 'OOO'라 함)" | 프롬프트 지침 |

---

## 6. 배포 아키텍처

### 6.1. 현재 구성 (n8n Cloud)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Production                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    n8n Cloud                            │   │
│  │                (mai-n8n.app.n8n.cloud)                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │  WF01   │→ │  WF02   │→ │  WF03   │→ │  WF04   │   │   │
│  │  │ (Form)  │  │(KIPRIS) │  │  (AI)   │  │(Review) │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  External Services                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │   │
│  │  │ Claude  │  │ KIPRIS  │  │ Google  │                 │   │
│  │  │   API   │  │   API   │  │  Drive  │                 │   │
│  │  └─────────┘  └─────────┘  └─────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**장점**:
- 빠른 배포 및 운영
- 관리 오버헤드 최소화
- 자동 스케일링

**제한사항**:
- Execute Command Node 미지원
- 로컬 파일 시스템 접근 불가

### 6.2. 향후 옵션 (Self-hosted)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Self-hosted (Ubuntu Server)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Docker Compose                       │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                  n8n Container                   │   │   │
│  │  │  • NODES_EXCLUDE="[]"                           │   │   │
│  │  │  • Execute Command 활성화                       │   │   │
│  │  │  • Claude Code CLI 설치                         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                          │                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              PostgreSQL Container               │   │   │
│  │  │  • 워크플로우 데이터                             │   │   │
│  │  │  • 실행 이력                                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                          │                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │               Redis Container                   │   │   │
│  │  │  • 큐 관리                                      │   │   │
│  │  │  • 세션 캐시                                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Nginx Reverse Proxy                   │   │
│  │  • SSL/TLS 종단                                         │   │
│  │  • 로드 밸런싱                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Docker Compose 예시**:
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - NODES_EXCLUDE=[]
      - N8N_SECURE_COOKIE=true
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./patent-workspace:/app/patent-workspace
      - ./claude-config:/home/node/.claude
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

---

## 7. 통합 및 확장 포인트

### 7.1. MCP 서버 연동

**현재 연동된 MCP 서버**:

| MCP 서버 | 용도 | 연동 방식 |
|----------|------|-----------|
| n8n-mcp | 워크플로우 관리 | Claude Code 내장 |
| context7 | 라이브러리 문서 | Claude Code 내장 |
| playwright | 브라우저 자동화 | 향후 테스트용 |

**향후 확장 가능**:
- Serena MCP: 프로젝트 메모리 관리
- Sequential MCP: 복잡한 분석 태스크

### 7.2. 추가 API 연동

**현재 연동**:
- KIPRIS API (한국특허정보원)
- Google Drive API (파일 저장)
- Anthropic API (Claude)

**향후 확장**:

| API | 용도 | 우선순위 |
|-----|------|----------|
| Google Patents | KIPRIS Fallback | P1 |
| USPTO API | 미국 특허 검색 | P2 |
| EPO API | 유럽 특허 검색 | P2 |
| Pandoc | 문서 변환 | P1 |

---

## 8. 구현 현황 및 다음 단계

### 8.1. 현재 구현 완료

| 구성요소 | 상태 | n8n ID |
|----------|------|--------|
| WF01: 발명 제안서 입력 | ✅ 완료 | galbpC91RCA90yyi |
| WF02: 선행기술 검색 | ✅ 완료 | iFAXSkfG5Rh0b8Qh |
| WF03: 명세서 생성 | ✅ 완료 | 7kZOpw4nYXj5aWIG |
| WF04: Human-in-the-loop | ✅ 완료 | zSXpWko9op4hnSBr |
| E2E 파이프라인 테스트 | ✅ 완료 | - |

### 8.2. 다음 단계 (Phase 3-4)

| 태스크 | 우선순위 | 상태 |
|--------|----------|------|
| KIPRIS API 키 연동 | P1 | 대기 |
| Pandoc 문서 변환 | P1 | 대기 |
| KIPO 표준 템플릿 | P1 | 대기 |
| 품질 검증 자동화 | P2 | 대기 |
| 워크플로우 단위 테스트 | P2 | 대기 |

---

## 참고 자료

### 문서 참조
- A01-[PRD] 특허 명세서 자동화 시스템
- A02-[Architecture] 시스템 아키텍처
- A03-[Research] KIPRIS API 분석
- A04-[Research] 특허 명세서 구조
- CLAUDE.md 특허 작성 지침

### 외부 참조
- [n8n Documentation](https://docs.n8n.io/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [KIPO 특허 명세서 작성 가이드](https://www.kipo.go.kr/)
- [KIPRIS API 가이드](https://plus.kipris.or.kr/)

---

*문서 버전: 1.0.0*
*작성자: Claude Code*
*최종 수정일: 2026-01-11*
