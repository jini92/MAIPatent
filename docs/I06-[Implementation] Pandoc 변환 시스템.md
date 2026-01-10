# MAIPatent Pandoc 변환 시스템

> **문서 유형**: Implementation Guide
> **작성일**: 2026-01-11
> **Phase**: 3 - 포맷팅 및 출력

---

## 1. 개요

### 1.1. 목적
MAIPatent 시스템에서 생성된 마크다운 특허 명세서를 KIPO 제출용 DOCX/PDF 포맷으로 변환합니다.

### 1.2. 구성 요소
| 구성 요소 | 파일 | 설명 |
|-----------|------|------|
| 변환 스크립트 | `scripts/convert-patent.js` | MD → DOCX/PDF 변환 |
| 검증 스크립트 | `scripts/validate-patent.js` | KIPO 표준 준수 검증 |
| 템플릿 설정 | `templates/kipo-reference.docx.yaml` | Pandoc 스타일 정의 |
| 출력 디렉토리 | `output/` | 변환된 파일 저장 |

---

## 2. 시스템 요구사항

### 2.1. Pandoc
```bash
# 버전 확인
pandoc --version
# 요구 버전: 3.0 이상

# 설치 확인
✅ Pandoc 3.8.2.1 설치 완료
```

### 2.2. Node.js
```bash
# 버전 확인
node --version
# 요구 버전: 18.0 이상
```

---

## 3. 변환 스크립트 사용법

### 3.1. 기본 사용법
```bash
# DOCX 변환
node scripts/convert-patent.js <input.md> docx

# PDF 변환
node scripts/convert-patent.js <input.md> pdf

# 둘 다 변환
node scripts/convert-patent.js <input.md> both
```

### 3.2. 예시
```bash
# 샘플 명세서 DOCX 변환
node scripts/convert-patent.js tests/sample-patent-spec.md docx

# 출력:
# ✅ DOCX 변환 완료: C:\TEST\MAIPatent\output\sample-patent-spec_2026-01-11.docx
```

### 3.3. 변환 옵션
| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `docx` | DOCX 포맷으로 변환 | - |
| `pdf` | PDF 포맷으로 변환 | - |
| `both` | DOCX + PDF 모두 변환 | - |

---

## 4. 품질 검증 스크립트 사용법

### 4.1. 기본 사용법
```bash
node scripts/validate-patent.js <input.md>

# JSON 출력
node scripts/validate-patent.js <input.md> --json
```

### 4.2. 검증 항목

| 코드 | 검증 항목 | 심각도 |
|------|----------|--------|
| `KIPO-001` | KIPO 필수 섹션 존재 여부 | Error |
| `LANG-001` | 금지 어구 (과장 표현) 사용 | Warning |
| `BASIS-001` | 전제 기초 (상기 참조) 검증 | Warning |
| `REF-001` | 도면 부호 일관성 | Warning |
| `CLAIM-001` | 청구항 존재 여부 | Error |
| `CLAIM-002` | 청구항 번호 연속성 | Warning |
| `CLAIM-004` | 종속항 참조 유효성 | Error |

### 4.3. 검증 결과 예시
```
=== Patent Specification Validation Result ===

PASSED

Summary: 0 errors, 11 warnings

Warnings:
  [BASIS-001] Check antecedent for: "상기 입력" (line 47)
  [BASIS-001] Check antecedent for: "상기 검색" (line 49)
  ...

Info:
  [KIPO-001] All required sections are present.
  [REF-002] Total 12 drawing references used.
  [CLAIM-003] Total 4 claims found.
```

---

## 5. KIPO 템플릿 설정

### 5.1. 파일: `templates/kipo-reference.docx.yaml`

```yaml
# 페이지 설정
page_setup:
  size: A4
  orientation: portrait
  margins:
    top: 2.5cm
    bottom: 2.5cm
    left: 2.5cm
    right: 2.0cm

# 폰트 설정
fonts:
  main: "맑은 고딕"
  fallback: "Malgun Gothic"
  code: "Consolas"

# 본문 스타일
paragraph_styles:
  body_text:
    font_size: 11pt
    line_spacing: 1.5
```

### 5.2. KIPO 식별 기호 처리
- 【】 마커는 변환 시 볼드 처리
- 청구항 번호는 【청구항 N】 형식으로 정규화

---

## 6. n8n 워크플로우 통합

### 6.1. WF04 검수 완료 후 변환 흐름

```
[WF04 승인]
    → Code Node (validate-patent.js)
    → IF 검증 통과
        → Code Node (convert-patent.js)
        → 출력 저장
    → ELSE
        → 에러 알림
```

### 6.2. Execute Command 노드 설정

```json
{
  "command": "node",
  "args": [
    "scripts/convert-patent.js",
    "{{ $json.specPath }}",
    "docx"
  ],
  "cwd": "/path/to/MAIPatent"
}
```

---

## 7. 출력 파일 명명 규칙

### 7.1. 파일명 형식
```
{원본파일명}_{날짜}.{확장자}

예시:
- patent-spec_2026-01-11.docx
- patent-spec_2026-01-11.pdf
```

### 7.2. 출력 디렉토리 구조
```
output/
├── patent-spec_2026-01-11.docx
├── patent-spec_2026-01-11.pdf
└── patent-spec_2026-01-11.html  # PDF 변환 실패 시
```

---

## 8. 트러블슈팅

### 8.1. PDF 변환 실패
```
문제: xelatex 미설치
해결: HTML로 대체 변환됨 (자동)

또는 xelatex 설치:
# Windows: MiKTeX 설치
# macOS: brew install --cask mactex
# Linux: sudo apt install texlive-xetex
```

### 8.2. 한글 폰트 오류
```
문제: 맑은 고딕 폰트 미설치
해결: 시스템에 맑은 고딕 설치 또는 나눔고딕 사용
```

### 8.3. 【】 기호 깨짐
```
문제: 전각 기호가 올바르게 표시되지 않음
해결: UTF-8 인코딩 확인, 폰트 설정 확인
```

---

## 9. 테스트 결과

### 9.1. 변환 테스트
| 테스트 | 입력 | 출력 | 결과 |
|--------|------|------|------|
| DOCX 변환 | sample-patent-spec.md | sample-patent-spec_2026-01-11.docx | ✅ 성공 |
| 검증 | sample-patent-spec.md | 0 errors, 11 warnings | ✅ 통과 |

### 9.2. 검증 테스트 결과
- **KIPO 섹션**: 10/10 필수 섹션 포함 ✅
- **청구항**: 4개 청구항 (연속성 확인) ✅
- **도면 부호**: 12개 부호 사용 ✅
- **금지 어구**: 0개 (과장 표현 없음) ✅

---

## 10. 향후 개선 사항

### 10.1. P1 (권장)
- [ ] 실제 DOCX 참조 템플릿 제작 (.docx 파일)
- [ ] PDF 변환을 위한 xelatex 설정

### 10.2. P2 (선택)
- [ ] 도면 이미지 자동 삽입
- [ ] 표지 페이지 자동 생성
- [ ] 버전 관리 통합

---

*문서 버전: 1.0.0*
*작성자: Claude Code*
*최종 수정일: 2026-01-11*
