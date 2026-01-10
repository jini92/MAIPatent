# I07 - MAIPatent 배포 가이드

> **n8n Cloud 워크플로우 배포 및 환경 설정 가이드**

---

## 목차

1. [환경 변수 설정](#1-환경-변수-설정)
2. [n8n Cloud 워크플로우 배포](#2-n8n-cloud-워크플로우-배포)
3. [스크립트 실행 가이드](#3-스크립트-실행-가이드)
4. [트러블슈팅 FAQ](#4-트러블슈팅-faq)

---

## 1. 환경 변수 설정

### 1.1. 환경 변수 파일 생성

```bash
# 프로젝트 루트에서 실행
cp .env.example .env
```

### 1.2. 필수 환경 변수

| 변수명 | 필수 | 설명 | 획득 방법 |
|--------|------|------|----------|
| `N8N_API_URL` | O | n8n Cloud 인스턴스 URL | n8n Cloud 대시보드 |
| `N8N_API_KEY` | O | n8n API 인증 키 | n8n Settings > API |
| `ANTHROPIC_API_KEY` | O | Claude API 키 (WF03용) | [console.anthropic.com](https://console.anthropic.com) |
| `KIPRIS_API_KEY` | X | KIPRIS API 키 | [plus.kipris.or.kr](http://plus.kipris.or.kr) |

### 1.3. 환경 변수 예시

```bash
# .env 파일 예시
N8N_API_URL=https://mai-n8n.app.n8n.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIs...
N8N_WEBHOOK_URL=https://mai-n8n.app.n8n.cloud/webhook
ANTHROPIC_API_KEY=sk-ant-api...
KIPRIS_API_KEY=your-kipris-key  # 선택사항
```

### 1.4. n8n API 키 생성 방법

1. n8n Cloud 로그인
2. Settings > API 메뉴 이동
3. "Create API Key" 클릭
4. 키 이름 입력 (예: "MAIPatent-Production")
5. 생성된 키 복사하여 `.env`에 저장

---

## 2. n8n Cloud 워크플로우 배포

### 2.1. 워크플로우 Import

```bash
# workflows/ 폴더의 JSON 파일을 n8n에 Import
workflows/
├── WF01-invention-input.json     # 발명 제안서 입력
├── WF02-prior-art-search.json    # 선행기술 검색
├── WF03-patent-generation.json   # 명세서 생성
└── WF04-human-review.json        # Human-in-the-loop 검수
```

**Import 방법:**
1. n8n Cloud 접속
2. "Import from file" 선택
3. JSON 파일 업로드
4. 워크플로우 활성화

### 2.2. Credentials 설정

각 워크플로우에서 사용하는 Credentials를 n8n에 등록해야 합니다.

| Credential 유형 | 사용 워크플로우 | 설정 위치 |
|----------------|----------------|----------|
| HTTP Header Auth | WF02 (KIPRIS) | HTTP Request 노드 |
| OpenAI/Anthropic | WF03 (Claude) | AI 노드 |

**Credentials 생성:**
1. n8n > Credentials 메뉴
2. "Add Credential" 클릭
3. 유형 선택 및 키 입력
4. 저장

### 2.3. Webhook 활성화

| 워크플로우 | Webhook 경로 | 활성화 필요 |
|-----------|-------------|------------|
| WF01 | - | Form Trigger (자동) |
| WF02 | `/wf02-prior-art-search` | O |
| WF03 | `/wf03-generate-patent-spec` | O |
| WF04 | `/wf04-review-request` | O |

**Webhook 활성화:**
1. 워크플로우 열기
2. 우측 상단 "Active" 토글 ON
3. 저장

### 2.4. 워크플로우 ID 확인

현재 배포된 워크플로우:

| 워크플로우 | n8n ID |
|-----------|--------|
| WF01-발명제안서입력 | `galbpC91RCA90yyi` |
| WF02-선행기술검색 | `iFAXSkfG5Rh0b8Qh` |
| WF03-명세서생성 | `7kZOpw4nYXj5aWIG` |
| WF04-명세서검수 | `zSXpWko9op4hnSBr` |

---

## 3. 스크립트 실행 가이드

### 3.1. 테스트 실행

```bash
# 전체 테스트 실행
node tests/run-all-tests.js

# 옵션
node tests/run-all-tests.js --json    # JSON 형식 출력
node tests/run-all-tests.js --save    # 결과 파일 저장
```

**예상 결과:**
```
═══════════════════════════════════════════════════════════
           MAIPatent 단위 테스트 실행기 v1.0
═══════════════════════════════════════════════════════════

📋 총 테스트: 42
✅ 통과: 42
❌ 실패: 0
📈 통과율: 100.0%
```

### 3.2. 명세서 변환 (Pandoc)

```bash
# DOCX 변환
node scripts/convert-patent.js <input.md> docx

# PDF 변환
node scripts/convert-patent.js <input.md> pdf

# 양쪽 모두 변환
node scripts/convert-patent.js <input.md> both
```

**예시:**
```bash
node scripts/convert-patent.js tests/sample-patent-spec.md docx
# 출력: output/sample-patent-spec_2026-01-11.docx
```

**요구사항:**
- Pandoc 3.0+ 설치 필요
- 설치 확인: `pandoc --version`

### 3.3. 명세서 검증 (KIPO 표준)

```bash
# 기본 검증
node scripts/validate-patent.js <input.md>

# JSON 형식 출력
node scripts/validate-patent.js <input.md> --json
```

**검증 항목:**
- KIPO 필수 섹션 (10개)
- 금지 어구 (과장 표현)
- 청구항 구조 및 번호 연속성
- 도면 부호 일관성
- 전제 기초 (상기 → 선행 정의)

**예시 출력:**
```
=== Patent Specification Validation Result ===

PASSED

Summary: 0 errors, 3 warnings

Warnings:
  [LANG-001] Check antecedent for: "상기 시스템"
  ...
```

---

## 4. 트러블슈팅 FAQ

### Q1. Webhook이 응답하지 않습니다

**증상:** WF02, WF03, WF04 호출 시 404 또는 타임아웃

**해결:**
1. n8n 워크플로우가 "Active" 상태인지 확인
2. Webhook 경로가 정확한지 확인
3. 워크플로우 비활성화 → 재활성화 시도

```bash
# Webhook URL 테스트
curl -X POST https://mai-n8n.app.n8n.cloud/webhook/wf02-prior-art-search \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Q2. WF03 AI 노드에서 오류 발생

**증상:** Claude AI 호출 실패, 인증 오류

**해결:**
1. n8n Credentials에 Anthropic API 키 등록 확인
2. API 키 유효성 확인 (잔액, 만료)
3. 모델명 확인 (claude-3-sonnet 등)

### Q3. Pandoc 변환 실패

**증상:** "pandoc not found" 또는 변환 오류

**해결:**
```bash
# Pandoc 설치 확인
pandoc --version

# Windows (Chocolatey)
choco install pandoc

# macOS
brew install pandoc

# Ubuntu
sudo apt install pandoc
```

### Q4. KIPRIS API 응답 없음

**증상:** 선행기술 검색 결과가 비어있음

**해결:**
- 현재 Mock 데이터 모드로 동작 중
- 실제 API 연동 시 KIPRIS API 키 필요
- [plus.kipris.or.kr](http://plus.kipris.or.kr)에서 API 키 신청

### Q5. 테스트 실패

**증상:** 일부 테스트 케이스 실패

**해결:**
1. Node.js 버전 확인 (v18+ 권장)
2. 파일 경로 확인 (Windows/Unix 차이)
3. 샘플 파일 존재 여부 확인

```bash
# Node.js 버전 확인
node --version

# 샘플 파일 확인
ls tests/sample-patent-spec.md
```

### Q6. Git에 민감 정보가 노출됨

**증상:** .env 파일이 커밋됨

**해결:**
```bash
# .gitignore 확인
cat .gitignore | grep ".env"

# 이미 커밋된 경우 히스토리에서 제거
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 부록: 환경별 설정

### 개발 환경

```bash
# .env.development
N8N_API_URL=https://mai-n8n.app.n8n.cloud
LOG_LEVEL=debug
```

### 프로덕션 환경

```bash
# .env.production
N8N_API_URL=https://mai-n8n.app.n8n.cloud
LOG_LEVEL=error
```

---

## 관련 문서

- [A02 시스템 아키텍처](./A02-[Architecture]%20시스템%20아키텍처.md)
- [I01 n8n MCP 통합 가이드](./I01-[Guide]%20n8n%20MCP%20서버%20통합.md)
- [I06 Pandoc 변환 시스템](./I06-[Implementation]%20Pandoc%20변환%20시스템.md)
- [T01 통합 테스트 리포트](./T01-[Test]%20통합%20테스트%20리포트.md)

---

*문서 버전: 1.0.0*
*작성일: 2026-01-11*
