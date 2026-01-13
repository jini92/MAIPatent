# S01-[Summary] MAIPatent 프로젝트 현황 요약

> 작성일: 2026-01-13
> 버전: 1.0.0
> 상태: **운영 중 (Production)**

---

## 1. 프로젝트 개요

### 1.1. 시스템 명칭
**MAIPatent** - n8n & Claude Code 기반 지능형 특허 명세서 작성 자동화 시스템

### 1.2. 핵심 기능
| 기능 | 설명 | 상태 |
|------|------|------|
| 발명 제안서 입력 | 웹 폼을 통한 발명 정보 수집 | 운영 중 |
| 선행기술 검색 | KIPRIS API 연동 선행기술 조회 | 운영 중 (Mock) |
| 명세서 자동 생성 | Claude AI 기반 KIPO 표준 명세서 생성 | 운영 중 |
| Human-in-the-loop 검수 | 전문가 검수 및 피드백 반영 | 운영 중 |
| 문서 저장 | Google Drive 자동 저장 | 운영 중 |
| 메타데이터 관리 | Google Sheets 이력 관리 | 운영 중 |

### 1.3. 기술 스택

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 14 + TypeScript + Tailwind CSS + Shadcn/UI         │
│  GitHub Pages: https://jini92.github.io/MAIPatent           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Workflow Engine                          │
│  n8n Cloud: mai-n8n.app.n8n.cloud                           │
│  Workflows: WF01 ~ WF05                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI Engine                              │
│  Claude AI (Anthropic API)                                   │
│  Extended Thinking for Claims Generation                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                            │
│  Google Drive: 문서 저장 (5개 폴더)                          │
│  Google Sheets: 메타데이터 관리                              │
│  localStorage: 프론트엔드 캐시                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 배포 현황

### 2.1. 인프라 상태

| 구성요소 | URL/식별자 | 상태 |
|----------|-----------|------|
| Web UI | https://jini92.github.io/MAIPatent | 운영 중 |
| n8n Cloud | mai-n8n.app.n8n.cloud | 운영 중 |
| WF01 Form | /form/galbpC91RCA90yyi | 활성화 |
| WF05 OAuth | /webhook/auth/google/* | 활성화 |

### 2.2. n8n 워크플로우 현황

| ID | 워크플로우 | 노드 수 | Google 연동 | 상태 |
|----|-----------|---------|-------------|------|
| galbpC91RCA90yyi | WF01-발명제안서입력 | 11 | Drive + Sheets | ACTIVE |
| iFAXSkfG5Rh0b8Qh | WF02-선행기술검색 | 11 | - | ACTIVE |
| 7kZOpw4nYXj5aWIG | WF03-명세서생성 | 15 | Drive + Sheets | ACTIVE |
| zSXpWko9op4hnSBr | WF04-명세서검수 | 15 | Drive + Sheets | ACTIVE |
| rt2CpYYYZi55dEIw | WF05-Google-OAuth | 12 | OAuth 인증 | ACTIVE |

### 2.3. Google 연동 리소스

**OAuth Credentials**:
| 서비스 | Credential ID | 상태 |
|--------|---------------|------|
| Google Drive | JY0NtMWoyteVhAkr | 연결됨 |
| Google Sheets | 0KIpr0MhYm4rWAoP | 연결됨 |

**환경변수 (7개)**:
| 변수명 | 용도 |
|--------|------|
| GOOGLE_DRIVE_PROPOSAL_FOLDER_ID | 01_발명제안서 폴더 |
| GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID | 02_선행기술 폴더 |
| GOOGLE_DRIVE_DRAFT_FOLDER_ID | 03_명세서초안 폴더 |
| GOOGLE_DRIVE_APPROVED_FOLDER_ID | 04_승인문서 폴더 |
| GOOGLE_DRIVE_REJECTED_FOLDER_ID | 05_반려문서 폴더 |
| GOOGLE_SHEETS_TRACKING_ID | 제출이력 스프레드시트 |
| N8N_WEBHOOK_URL | Webhook 기본 URL |

**Google Drive 폴더 구조**:
```
G:\My Drive\MAIPatent\
├── 01_발명제안서/   → 1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p
├── 02_선행기술/     → 1CO63_auDraZymK7sBNfmN8jLZzauyyE7
├── 03_명세서초안/   → 1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX
├── 04_승인문서/     → 19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a
└── 05_반려문서/     → 1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg
```

---

## 3. 문서 현황

### 3.1. 문서 통계

| 카테고리 | 접두사 | 문서 수 | 비고 |
|----------|--------|---------|------|
| 분석/연구 | A## | 5 | PRD, 아키텍처, 연구 |
| 구현/가이드 | I## | 13 | 워크플로우, 구현, 가이드 |
| 테스트 | T## | 7 | E2E, 통합, 버그수정 |
| 계획 | P## | 1 | 배포 계획 |
| 요약 | S## | 1 | 현황 요약 |
| **총계** | | **27** | |

### 3.2. 핵심 문서

| 문서 | 용도 |
|------|------|
| A01-PRD | 제품 요구사항 정의 |
| A02-Architecture | 시스템 아키텍처 설계 |
| I07-배포 가이드 | 환경 설정 및 배포 방법 |
| I12-Google 연동 가이드 | Google Drive/Sheets 설정 |
| T07-Google 연동 테스트 | E2E 테스트 결과 (40개 PASS) |

---

## 4. 테스트 현황

### 4.1. 테스트 결과 요약

| 테스트 유형 | 케이스 수 | PASS | FAIL | 성공률 |
|-------------|-----------|------|------|--------|
| 단위 테스트 | 42 | 42 | 0 | 100% |
| E2E 테스트 | 40 | 40 | 0 | 100% |
| **총계** | **82** | **82** | **0** | **100%** |

### 4.2. 검증된 시나리오

- [x] 발명제안서 폼 제출 → WF01 실행
- [x] 선행기술 검색 → WF02 실행
- [x] 명세서 생성 → WF03 실행 (Claude AI)
- [x] 검수 승인/반려 → WF04 실행
- [x] Google Drive 파일 업로드
- [x] Google Sheets 메타데이터 저장
- [x] 프론트엔드 상태 동기화

---

## 5. 개발 완료 항목

### 5.1. Phase 진행 현황

| Phase | 내용 | 상태 | 완료일 |
|-------|------|------|--------|
| Phase 1 | 초기 설정 | ✅ 완료 | 2026-01-10 |
| Phase 2 | 워크플로우 구축 | ✅ 완료 | 2026-01-10 |
| Phase 3 | 포맷팅 및 출력 | ✅ 완료 | 2026-01-11 |
| Phase 4 | 테스트 및 품질 관리 | ✅ 완료 | 2026-01-11 |
| Phase 5 | 웹 UI 구현 | ✅ 완료 | 2026-01-12 |
| Phase 6 | Google 연동 | ✅ 완료 | 2026-01-13 |

### 5.2. 주요 기능 완성도

| 기능 | 완성도 | 비고 |
|------|--------|------|
| 발명제안서 입력 | 100% | 웹 폼 + 검증 |
| 선행기술 검색 | 80% | Mock 데이터 (KIPRIS API 미연동) |
| 명세서 생성 | 100% | Claude AI Extended Thinking |
| 검수 프로세스 | 100% | 승인/반려/수정요청 |
| 문서 내보내기 | 80% | Markdown 지원 (DOCX/PDF 미구현) |
| Google 저장 | 100% | Drive + Sheets 완료 |

---

## 6. 향후 계획

### 6.1. 미구현 항목

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| KIPRIS API 실제 연동 | MEDIUM | 미구현 |
| DOCX/PDF 변환 | LOW | Mock 구현 |
| WF06 데이터 조회 워크플로우 | MEDIUM | 미구현 |
| 프론트엔드 Sheets API 직접 연동 | LOW | 미구현 |
| 모니터링 체계 구축 | LOW | 미구현 |

### 6.2. 개선 사항

| 개선 항목 | 설명 |
|-----------|------|
| 실시간 동기화 | Sheets 데이터 실시간 반영 |
| 오프라인 지원 | localStorage 캐시 강화 |
| 버전 관리 | 명세서 버전 히스토리 |

---

## 7. 연락처 및 리소스

### 7.1. 저장소
- **GitHub**: https://github.com/jini92/MAIPatent
- **Web UI**: https://jini92.github.io/MAIPatent

### 7.2. 관련 문서
- [README.md](./README.md) - 문서 인덱스
- [CLAUDE.md](../CLAUDE.md) - 특허 명세서 작성 지침
- [I07-배포 가이드](./I07-[Guide]%20배포%20가이드.md) - 배포 방법

---

*작성일: 2026-01-13*
*최종 업데이트: 2026-01-13 (Google Drive 5개 폴더 저장 플로우 검증 완료)*
*작성자: Claude Code*
*버전: 1.1.0*
