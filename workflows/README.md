# MAIPatent n8n 워크플로우

> **n8n 워크플로우 JSON 파일 저장소**

---

## 워크플로우 목록

| 파일명 | 설명 | 상태 |
|--------|------|------|
| WF01-invention-input.json | 발명 제안서 입력 | 미구현 |
| WF02-prior-art-search.json | 선행기술 검색 (KIPRIS) | 미구현 |
| WF03-patent-generation.json | Claude Code 명세서 생성 | 미구현 |
| WF04-human-review.json | Human-in-the-loop 검수 | 미구현 |

---

## 워크플로우 흐름

```
WF01 (입력) → WF02 (선행기술) → WF03 (생성) → WF04 (검수)
     │              │                │              │
     ▼              ▼                ▼              ▼
  Form Trigger   KIPRIS API    Claude Code     Wait Node
  데이터 검증     XML 파싱     청구항 생성      검수 Form
  키워드 추출    관련도 계산    상세설명 생성    승인/반려
  저장          컨텍스트 생성   도면설명 생성    Pandoc 변환
```

---

## 사용 방법

### 1. n8n에 워크플로우 가져오기

1. n8n 대시보드 접속
2. "Add workflow" → "Import from file"
3. 해당 JSON 파일 선택
4. "Import" 클릭

### 2. 환경 변수 설정

워크플로우 실행 전 다음 환경 변수 설정 필요:

```bash
KIPRIS_API_KEY=your-kipris-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_SHEETS_CREDENTIALS=your-credentials
```

### 3. Credentials 설정

n8n Settings → Credentials에서 다음 인증 정보 설정:

- **HTTP Header Auth** (KIPRIS): ServiceKey
- **Google Sheets OAuth2**
- **HTTP Request** (Claude Code 관련)

---

## 워크플로우 상세

### WF01: 발명 제안서 입력

**트리거**: n8n Form 또는 Webhook
**입력**: 발명 제안서 데이터
**출력**: 검증된 발명 데이터 + 추출 키워드
**다음 워크플로우**: WF02 트리거

### WF02: 선행기술 검색

**트리거**: WF01에서 Webhook 호출
**입력**: 검색 키워드, IPC 코드
**출력**: 선행기술 요약, 관련도 점수
**다음 워크플로우**: WF03 트리거

### WF03: Claude Code 명세서 생성

**트리거**: WF02에서 Webhook 호출
**입력**: 발명 데이터 + 선행기술 컨텍스트
**출력**: KIPO 규격 명세서 (Markdown)
**다음 워크플로우**: WF04 트리거

### WF04: Human-in-the-loop 검수

**트리거**: WF03에서 Webhook 호출
**입력**: 생성된 명세서
**출력**: 검수 완료 명세서 (DOCX/PDF)
**처리**: Wait 노드로 검수자 응답 대기

---

## 테스트

### 단위 테스트

각 워크플로우의 "Test workflow" 버튼으로 개별 테스트

### 통합 테스트

1. `tests/sample-inventions/sample-invention-001.json` 사용
2. WF01 Form에 샘플 데이터 입력
3. 전체 파이프라인 실행 확인
4. `tests/expected-outputs/`와 결과 비교

---

## 트러블슈팅

### 일반적인 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| KIPRIS API 오류 | API 키 만료/한도 초과 | 키 갱신 또는 대기 |
| Claude Code 타임아웃 | 긴 명세서 생성 | 타임아웃 증가 |
| 품질 검증 실패 | 용어 불일치 | 자동 수정 또는 수동 검수 |

---

*버전: 1.0.0*
