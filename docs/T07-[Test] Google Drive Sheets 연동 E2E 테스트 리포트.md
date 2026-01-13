# T07-[Test] Google Drive/Sheets 연동 E2E 테스트 리포트

> 작성일: 2026-01-13
> 테스트 범위: WF01, WF03, WF04 Google 연동 검증
> 결과: **PASS**

---

## 1. 테스트 개요

### 1.1. 목적
n8n 워크플로우(WF01, WF03, WF04)의 Google Drive 및 Google Sheets 연동 기능 검증

### 1.2. 테스트 환경

| 구성요소 | 버전/환경 |
|----------|----------|
| n8n Cloud | mai-n8n.app.n8n.cloud |
| Google Drive API | OAuth 2.0 |
| Google Sheets API | OAuth 2.0 |
| 테스트 도구 | Playwright MCP |

### 1.3. 사전 조건

- [x] Google Cloud Console OAuth 2.0 클라이언트 생성 완료
- [x] n8n Cloud에 Google Drive/Sheets Credentials 설정 완료
- [x] n8n 환경변수 7개 설정 완료
- [x] Google Sheets "제출이력" 시트 및 헤더 생성 완료

---

## 2. 테스트 케이스

### 2.1. TC-01: OAuth Credentials 연결 검증

| 항목 | 결과 |
|------|------|
| Google Drive OAuth2 API 연결 | PASS |
| Google Sheets OAuth2 API 연결 | PASS |
| Credential ID (Drive) | JY0NtMWoyteVhAkr |
| Credential ID (Sheets) | 0KIpr0MhYm4rWAoP |

### 2.2. TC-02: 환경변수 설정 검증

| 환경변수 | 값 | 결과 |
|----------|-----|------|
| GOOGLE_DRIVE_PROPOSAL_FOLDER_ID | 1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p | PASS |
| GOOGLE_DRIVE_PRIOR_ART_FOLDER_ID | 1CO63_auDraZymK7sBNfmN8jLZzauyyE7 | PASS |
| GOOGLE_DRIVE_DRAFT_FOLDER_ID | 1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX | PASS |
| GOOGLE_DRIVE_APPROVED_FOLDER_ID | 19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a | PASS |
| GOOGLE_DRIVE_REJECTED_FOLDER_ID | 1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg | PASS |
| GOOGLE_SHEETS_TRACKING_ID | 1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI | PASS |
| N8N_WEBHOOK_URL | https://mai-n8n.app.n8n.cloud/webhook | PASS |

### 2.3. TC-03: WF01 발명제안서 입력 플로우

**테스트 시나리오**:
1. Form Trigger에서 발명 제안서 데이터 입력
2. 데이터 검증 및 보강
3. JSON 파일로 변환 (Binary 형식)
4. Google Drive 01_발명제안서 폴더에 업로드
5. Google Sheets 제출이력 시트에 메타데이터 추가
6. WF02 호출

| 단계 | 노드명 | 결과 |
|------|--------|------|
| 1 | 발명제안서 Form | PASS |
| 2 | 데이터 검증 | PASS |
| 3 | 데이터 보강 | PASS |
| 4 | 출력 데이터 설정 | PASS |
| 5 | JSON 파일 변환 | PASS |
| 6 | Google Drive 업로드 (발명제안서) | PASS |
| 7 | Google Sheets 저장 (메타데이터) | PASS |
| 8 | URL 포함 출력 설정 | PASS |
| 9 | WF02 선행기술검색 호출 | PASS |

### 2.4. TC-04: WF03 명세서 생성 플로우

**테스트 시나리오**:
1. WF02에서 전달받은 데이터로 명세서 생성
2. Markdown 형식으로 명세서 조립
3. Google Drive 03_명세서초안 폴더에 업로드
4. Google Sheets 상태를 "reviewing"으로 업데이트
5. WF04 호출

| 단계 | 노드명 | 결과 |
|------|--------|------|
| 1 | 명세서 Markdown 변환 | PASS |
| 2 | Google Drive 업로드 (명세서초안) | PASS |
| 3 | Google Sheets 상태 업데이트 | PASS |
| 4 | WF04 호출 | PASS |

### 2.5. TC-05: WF04 검수 승인/반려 플로우

**테스트 시나리오 A (승인)**:
1. 검수 결과 "approved" 수신
2. 최종 문서 Google Drive 04_승인문서 폴더에 업로드
3. Google Sheets 상태를 "approved"로 업데이트

**테스트 시나리오 B (반려)**:
1. 검수 결과 "rejected" 수신
2. 반려 문서 Google Drive 05_반려문서 폴더에 업로드
3. Google Sheets 상태를 "rejected"로 업데이트

| 시나리오 | 결과 |
|----------|------|
| 승인 플로우 | PASS |
| 반려 플로우 | PASS |
| 수정요청 플로우 | PASS |

---

## 3. Google Sheets 스키마 검증

### 3.1. 시트 구조

| 열 | 필드명 | 검증 결과 |
|----|--------|----------|
| A | Patent ID | PASS |
| B | 발명 명칭 | PASS |
| C | 발명자 | PASS |
| D | 소속 | PASS |
| E | 기술분야 | PASS |
| F | 키워드 | PASS |
| G | 상태 | PASS |
| H | 제출일 | PASS |
| I | 발명제안서 URL | PASS |
| J | 선행기술 URL | PASS |
| K | 명세서초안 URL | PASS |
| L | 최종문서 URL | PASS |
| M | 검수완료일 | PASS |
| N | 반려사유 | PASS |
| O | 수정요청사항 | PASS |

### 3.2. 데이터 무결성

- [x] Patent ID 고유성 확인
- [x] 상태 값 Enum 검증 (draft/generating/reviewing/approved/rejected)
- [x] URL 형식 검증
- [x] 날짜 형식 검증 (yyyy-MM-dd)

---

## 4. 워크플로우 현황

| 워크플로우 | ID | 활성화 | 노드 수 | Google 연동 |
|-----------|-----|--------|---------|-------------|
| WF01-발명제안서입력 | galbpC91RCA90yyi | ACTIVE | 11 | Drive + Sheets |
| WF02-선행기술검색 | iFAXSkfG5Rh0b8Qh | ACTIVE | 11 | - |
| WF03-명세서생성 | 7kZOpw4nYXj5aWIG | ACTIVE | 15 | Drive + Sheets |
| WF04-명세서검수 | zSXpWko9op4hnSBr | ACTIVE | 15 | Drive + Sheets |
| WF05-Google-OAuth | rt2CpYYYZi55dEIw | ACTIVE | 12 | OAuth 인증 |

---

## 5. 테스트 결과 요약

### 5.1. 전체 결과

| 카테고리 | 총 테스트 | PASS | FAIL | 성공률 |
|----------|-----------|------|------|--------|
| OAuth Credentials | 2 | 2 | 0 | 100% |
| 환경변수 | 7 | 7 | 0 | 100% |
| WF01 플로우 | 9 | 9 | 0 | 100% |
| WF03 플로우 | 4 | 4 | 0 | 100% |
| WF04 플로우 | 3 | 3 | 0 | 100% |
| Sheets 스키마 | 15 | 15 | 0 | 100% |
| **전체** | **40** | **40** | **0** | **100%** |

### 5.2. 주요 성과

1. **Google OAuth 연동 완료**: Drive + Sheets 모두 정상 연결
2. **환경변수 기반 구성**: 하드코딩 제거, 환경변수로 폴더 ID 관리
3. **데이터 일관성**: Sheets 메타데이터와 Drive 문서 간 동기화 확인
4. **상태 추적**: 워크플로우 진행에 따른 상태 업데이트 정상 작동

### 5.3. 해결된 이슈

| 이슈 | 해결 방법 |
|------|----------|
| Binary 형식 오류 | `prepareBinaryData()` 함수 사용으로 해결 |
| Sheets OAuth 재인증 필요 | n8n Cloud에서 credentials 재연결 |
| 환경변수 접근 오류 | n8n Cloud Settings에서 환경변수 직접 설정 |

---

## 6. 다음 단계

| 항목 | 우선순위 | 상태 |
|------|---------|------|
| WF06 데이터 조회 워크플로우 | MEDIUM | 미구현 |
| 프론트엔드 Sheets API 연동 | MEDIUM | 미구현 |
| 실시간 동기화 구현 | LOW | 미구현 |

---

## 7. 관련 문서

- [I12-[Implementation] Google Drive 및 Sheets 연동 가이드](./I12-[Implementation]%20Google%20Drive%20및%20Sheets%20연동%20가이드.md)
- [I09-[Implementation] Google Drive 연동](./I09-[Implementation]%20Google%20Drive%20연동.md)
- [T06-[Test] E2E 검수 승인 상태 업데이트 버그 수정 테스트 리포트](./T06-[Test]%20E2E%20검수%20승인%20상태%20업데이트%20버그%20수정%20테스트%20리포트.md)

---

*작성일: 2026-01-13*
*테스트 수행자: Claude Code*
*버전: 1.0.0*
