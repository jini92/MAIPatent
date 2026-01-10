# MAIPatent 문서 인덱스

> **n8n & Claude Code 기반 지능형 특허 명세서 작성 자동화 시스템**

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

### 최근 업데이트
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
└── CLAUDE.md                # Claude Code 특허 작성 지침
```

---

*최종 수정일: 2026-01-11 (프로젝트 Phase 1-4 완료)*
