# MAIPatent 문서 인덱스

> **n8n & Claude Code 기반 지능형 특허 명세서 작성 자동화 시스템**

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![Phase](https://img.shields.io/badge/Phase-4%2F4-blue)
![Tests](https://img.shields.io/badge/Tests-42%20Passed-success)

---

## 퀵스타트 가이드

### 1. 환경 설정
```bash
# 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키 입력 (N8N_API_KEY, ANTHROPIC_API_KEY)
```

### 2. 테스트 실행
```bash
node tests/run-all-tests.js
```

### 3. 명세서 생성
1. n8n Cloud에서 WF01 Form 접속
2. 발명 제안서 입력 및 제출
3. 자동으로 WF02→WF03→WF04 파이프라인 실행
4. 검수 완료 후 최종 명세서 출력

### 4. 명세서 변환/검증
```bash
# DOCX 변환
node scripts/convert-patent.js patent.md docx

# KIPO 표준 검증
node scripts/validate-patent.js patent.md
```

---

## 문서 명명 규칙

| 접두사 | 유형 | 설명 |
|--------|------|------|
| `A##` | Analysis/Architecture/Research | 분석, 아키텍처, 연구 문서 |
| `I##` | Implementation/Integration/Guide | 구현, 통합, 가이드 문서 |
| `T##` | Test | 테스트 문서 |
| `D##` | DevLog | 개발 로그 |
| `R##` | Reference | 참조 문서 |

---

## 분석/연구 문서 (A##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [A01](./A01-[PRD]%20n8n%20%26%20Claude%20Code%20기반%20지능형%20특허%20명세서%20작성%20자동화%20시스템.md) | PRD | 제품 요구사항 정의서 |
| [A02](./A02-[Architecture]%20시스템%20아키텍처.md) | Architecture | 시스템 아키텍처 설계 문서 |
| [A03](./A03-[Research]%20KIPRIS%20API%20분석.md) | KIPRIS API | KIPRIS 특허 검색 API 분석 |
| [A04](./A04-[Research]%20특허%20명세서%20구조.md) | 명세서 구조 | KIPO 표준 특허 명세서 구조 분석 |
| [A05](./A05-[Design]%20상세%20시스템%20설계.md) | 상세 설계 | 에이전틱 엔진 및 파이프라인 상세 설계 |

---

## 구현/가이드 문서 (I##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [I01](./I01-[Guide]%20n8n%20MCP%20서버%20통합.md) | n8n MCP 통합 | Claude Code와 n8n MCP 서버 통합 가이드 |
| [I02](./I02-[Workflow]%20발명%20제안서%20입력.md) | WF01 | 발명 제안서 입력 워크플로우 |
| [I03](./I03-[Workflow]%20Claude%20Code%20명세서%20생성.md) | WF03 | Claude Code 명세서 생성 워크플로우 |
| [I04](./I04-[Workflow]%20선행기술%20검색.md) | WF02 | KIPRIS 선행기술 검색 워크플로우 |
| [I05](./I05-[Workflow]%20Human-in-the-loop%20검수.md) | WF04 | Human-in-the-loop 검수 워크플로우 |
| [I06](./I06-[Implementation]%20Pandoc%20변환%20시스템.md) | Pandoc 변환 | MD→DOCX/PDF 변환 및 KIPO 표준 검증 |
| [I07](./I07-[Guide]%20배포%20가이드.md) | 배포 가이드 | 환경 설정, n8n 배포, 트러블슈팅 |
| [I08](./I08-[Implementation]%20Web%20UI%20구현.md) | Web UI | 웹 프론트엔드 구현 (Next.js + Shadcn/UI) |

---

## 테스트 문서 (T##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [T01](./T01-[Test]%20통합%20테스트%20리포트.md) | 통합 테스트 | 워크플로우 통합 테스트 및 E2E 테스트 리포트 |

---

## 워크플로우 구조

```
┌─────────────────┐
│ WF01            │ Form Trigger
│ 발명 제안서 입력  │ ─────────────┐
└─────────────────┘               │
                                  ▼
┌─────────────────┐    HTTP    ┌─────────────────┐
│ WF02            │ ◄───────── │ Webhook         │
│ 선행기술 검색    │            │ /wf02-prior-art │
└─────────────────┘            └─────────────────┘
         │
         ▼ HTTP Request
┌─────────────────┐    HTTP    ┌─────────────────┐
│ WF03            │ ◄───────── │ Webhook         │
│ 명세서 생성      │            │ /wf03-generate  │
└─────────────────┘            └─────────────────┘
         │
         ▼ HTTP Request
┌─────────────────┐    HTTP    ┌─────────────────┐
│ WF04            │ ◄───────── │ Webhook         │
│ Human-in-the-loop│           │ /wf04-review    │
└─────────────────┘            └─────────────────┘
         │
         ▼
    최종 출력
```

---

## n8n 워크플로우 ID

| 워크플로우 | n8n ID | Webhook 경로 |
|------------|--------|--------------|
| WF01-발명제안서입력 | `galbpC91RCA90yyi` | - (Form Trigger) |
| WF02-선행기술검색 | `iFAXSkfG5Rh0b8Qh` | `/wf02-prior-art-search` |
| WF03-명세서생성 | `7kZOpw4nYXj5aWIG` | `/wf03-generate-patent-spec` |
| WF04-명세서검수 | `zSXpWko9op4hnSBr` | `/wf04-review-request` |

---

## 프로젝트 상태

| Phase | 상태 | 진행률 |
|-------|------|--------|
| Phase 1: 초기 설정 | 완료 | 100% |
| Phase 2: 워크플로우 구축 | 완료 | 100% |
| Phase 3: 포맷팅 및 출력 | 완료 | 100% |
| Phase 4: 테스트 및 품질 관리 | 완료 | 100% |
| Phase 5: 웹 UI 구현 | 진행 중 | 50% |

### Web UI 진행 상황
| 단계 | 상태 |
|------|------|
| Phase 1: 기반 구축 | 완료 |
| Phase 2: 핵심 폼 | 완료 |
| Phase 3: 추적 & 미리보기 | 완료 |
| Phase 4: 검수 패널 | 대기 |
| Phase 5: 대시보드 & 내보내기 | 대기 |
| Phase 6: 마무리 | 대기 |

### 최근 업데이트
- **2026-01-11**: Web UI Phase 3 완료 - 실시간 추적 및 명세서 미리보기 (useExecutionStatus, PatentPreview)
- **2026-01-11**: Web UI Phase 2 완료 - InventionForm 4단계 폼 (React Hook Form + Zod)
- **2026-01-11**: Web UI Phase 1 완료 - Next.js 14 프로젝트 초기화, Shadcn/UI 설정
- **2026-01-11**: Phase 4 완료 - 단위 테스트 42개 구현 (100% 통과)
- **2026-01-11**: Phase 3 완료 - Pandoc 변환 시스템 및 KIPO 표준 검증 구현
- **2026-01-11**: A05 상세 시스템 설계 문서 작성 (에이전틱 엔진, 보안, 파이프라인)
- **2026-01-11**: E2E 파이프라인 테스트 완료 (WF02→WF03→WF04)
- **2026-01-10**: Phase 2 워크플로우 구축 완료

---

## 관련 파일

```
MAIPatent/
├── docs/                    # 문서 폴더 (현재 위치)
├── web/                     # 웹 프론트엔드 (Next.js 14)
│   ├── src/
│   │   ├── app/             # App Router 페이지
│   │   ├── components/      # React 컴포넌트
│   │   ├── lib/             # 유틸리티 및 API 클라이언트
│   │   └── types/           # TypeScript/Zod 타입
│   └── package.json
├── prompts/                 # AI 프롬프트 템플릿
├── templates/               # KIPO 명세서 템플릿
├── workflows/               # n8n 워크플로우 JSON
├── scripts/                 # 변환 및 검증 스크립트
│   ├── convert-patent.js    # MD → DOCX/PDF 변환
│   └── validate-patent.js   # KIPO 표준 검증
├── tests/                   # 테스트 데이터 및 스크립트
│   ├── run-all-tests.js     # 전체 테스트 실행기
│   ├── sample-patent-spec.md# 샘플 특허 명세서
│   └── unit/                # 단위 테스트 (42 tests)
├── output/                  # 변환된 파일 출력
├── tasks.md                 # 프로젝트 태스크 트래킹
├── CLAUDE.md                # Claude Code 특허 작성 지침
├── .env.example             # 환경 변수 템플릿
└── .gitignore               # Git 제외 패턴
```

---

## 배포 정보

### n8n Cloud
- **인스턴스**: `mai-n8n.app.n8n.cloud`
- **워크플로우**: 4개 (WF01~WF04)
- **상태**: 운영 중

### 필수 요구사항
- Node.js v18+
- Pandoc v3.0+ (문서 변환용)
- n8n API Key
- Anthropic API Key (WF03 Claude AI 호출용)

### 선택 요구사항
- KIPRIS API Key (선행기술 검색, 미설정 시 Mock 데이터)
- Google Drive (문서 저장, 미구현)

자세한 내용은 [I07 배포 가이드](./I07-[Guide]%20배포%20가이드.md) 참조

---

*최종 수정일: 2026-01-11 (Web UI Phase 3 완료)*
