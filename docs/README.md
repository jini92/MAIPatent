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
| `P##` | Plan | 계획 문서 |
| `D##` | DevLog | 개발 로그 |
| `R##` | Reference | 참조 문서 |
| `S##` | Summary | 요약 문서 |

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
| [I09](./I09-[Implementation]%20Google%20Drive%20연동.md) | Google Drive | Google Drive/Sheets 연동 설계 |
| [I10](./I10-[Implementation]%20배포%20완료%20보고서.md) | 배포 보고서 | 시스템 배포 완료 보고서 |
| [I11](./I11-[Implementation]%20대시보드%20데이터%20연동%20개선.md) | 대시보드 연동 | 대시보드 데이터 연동 개선 |
| [I12](./I12-[Implementation]%20Google%20Drive%20및%20Sheets%20연동%20가이드.md) | Google 연동 가이드 | Google Drive/Sheets 연동 구현 가이드 (완료) |
| [I13](./I13-[Implementation]%20Google%20OAuth%20설정.md) | Google OAuth | Google OAuth 클라이언트 설정 가이드 |

---

## 테스트 문서 (T##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [T01](./T01-[Test]%20통합%20테스트%20리포트.md) | 통합 테스트 | 워크플로우 통합 테스트 리포트 |
| [T02](./T02-[Test]%20E2E%20통합%20테스트%20리포트.md) | E2E 테스트 | GitHub Pages + n8n Cloud 전체 E2E 테스트 (2026-01-12) |
| [T03](./T03-[Test]%20E2E%20시나리오%20테스트%20리포트.md) | E2E 시나리오 | 발명제안서→승인 플로우 테스트 |
| [T04](./T04-[Test]%20E2E%20시나리오%20테스트%20리포트%20(내보내기%20포함).md) | E2E 내보내기 | 내보내기 포함 전체 플로우 테스트 |
| [T05](./T05-[Test]%20E2E%20대시보드%20데이터%20연동%20테스트%20리포트.md) | 대시보드 연동 | 대시보드 데이터 연동 테스트 |
| [T06](./T06-[Test]%20E2E%20검수%20승인%20상태%20업데이트%20버그%20수정%20테스트%20리포트.md) | 버그 수정 | 검수 승인 상태 업데이트 버그 수정 |
| [T07](./T07-[Test]%20Google%20Drive%20Sheets%20연동%20E2E%20테스트%20리포트.md) | Google 연동 | Google Drive/Sheets 연동 E2E 테스트 (2026-01-13) |

---

## 계획 문서 (P##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [P01](./P01-[Plan]%20Production%20배포%20계획.md) | Production 배포 계획 | Production 환경 배포 및 운영 계획 (2026-01-12) |

---

## 요약 문서 (S##)

| 문서 ID | 제목 | 설명 |
|---------|------|------|
| [S01](./S01-[Summary]%20프로젝트%20현황%20요약.md) | 프로젝트 현황 | 전체 시스템 현황 및 배포 상태 요약 (2026-01-13) |

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

| 워크플로우 | n8n ID | Webhook 경로 | Google 연동 |
|------------|--------|--------------|-------------|
| WF01-발명제안서입력 | `galbpC91RCA90yyi` | - (Form Trigger) | Drive + Sheets |
| WF02-선행기술검색 | `iFAXSkfG5Rh0b8Qh` | `/wf02-prior-art-search` | - |
| WF03-명세서생성 | `7kZOpw4nYXj5aWIG` | `/wf03-generate-patent-spec` | Drive + Sheets |
| WF04-명세서검수 | `zSXpWko9op4hnSBr` | `/wf04-review-request` | Drive + Sheets |
| WF05-Google-OAuth | `rt2CpYYYZi55dEIw` | `/auth/google/*` | OAuth 인증 |

---

## 프로젝트 상태

| Phase | 상태 | 진행률 |
|-------|------|--------|
| Phase 1: 초기 설정 | 완료 | 100% |
| Phase 2: 워크플로우 구축 | 완료 | 100% |
| Phase 3: 포맷팅 및 출력 | 완료 | 100% |
| Phase 4: 테스트 및 품질 관리 | 완료 | 100% |
| Phase 5: 웹 UI 구현 | 완료 | 100% |

### Web UI 진행 상황
| 단계 | 상태 |
|------|------|
| Phase 1: 기반 구축 | ✅ 완료 |
| Phase 2: 핵심 폼 | ✅ 완료 |
| Phase 3: 추적 & 미리보기 | ✅ 완료 |
| Phase 4: 검수 패널 | ✅ 완료 |
| Phase 5: 대시보드 & 내보내기 | ✅ 완료 |
| Phase 6: 마무리 | ✅ 완료 |

### E2E 테스트 결과 (2026-01-13)
| 테스트 | 결과 |
|--------|------|
| 단위 테스트 (42개) | PASS |
| Webhook 응답 테스트 | PASS |
| CORS Preflight 테스트 | PASS |
| E2E 폼 제출 플로우 | PASS |
| Google Drive 연동 | PASS |
| Google Sheets 연동 | PASS |
| OAuth Credentials 검증 | PASS |

### Google 연동 현황 (2026-01-13)
| 구성요소 | 상태 |
|----------|------|
| OAuth Credentials | 설정 완료 |
| 환경변수 (7개) | 설정 완료 |
| Google Drive 폴더 | 5개 연결 완료 |
| Google Sheets 시트 | 제출이력 시트 생성 완료 |

### 최근 업데이트
- **2026-01-13**: Google Drive/Sheets 연동 완료 - WF01, WF03, WF04 연동 검증 (T07, I12 문서화)
- **2026-01-13**: n8n 환경변수 설정 완료 - 7개 환경변수 구성
- **2026-01-13**: OAuth Credentials 설정 완료 - Drive + Sheets 연결
- **2026-01-12**: 검수 승인 버그 수정 - useRef로 상태 추적 문제 해결 (T06 문서화)
- **2026-01-12**: E2E 통합 테스트 완료 - GitHub Pages + n8n Cloud 연동 검증 (T02 문서화)
- **2026-01-12**: CORS 설정 완료 - n8n Webhook 노드에서 Cross-Origin 허용
- **2026-01-11**: Web UI Phase 6 완료 - GitHub Pages 배포 완료
- **2026-01-11**: Phase 4 완료 - 단위 테스트 42개 구현 (100% 통과)
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
- Google Drive OAuth (문서 저장, 구현 완료)
- Google Sheets OAuth (메타데이터 관리, 구현 완료)

### Google 연동 폴더 구조
```
G:\My Drive\MAIPatent\
├── 01_발명제안서/   → 1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p
├── 02_선행기술/     → 1CO63_auDraZymK7sBNfmN8jLZzauyyE7
├── 03_명세서초안/   → 1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX
├── 04_승인문서/     → 19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a
└── 05_반려문서/     → 1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg

Google Sheets ID: 1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI
```

자세한 내용은 [I07 배포 가이드](./I07-[Guide]%20배포%20가이드.md) 및 [I12 Google 연동 가이드](./I12-[Implementation]%20Google%20Drive%20및%20Sheets%20연동%20가이드.md) 참조

---

*최종 수정일: 2026-01-13 (Google Drive/Sheets 연동 완료)*
