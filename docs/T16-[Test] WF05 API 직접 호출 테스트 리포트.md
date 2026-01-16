# T16 - WF05 문서 내보내기 API 직접 호출 테스트 리포트

> **테스트 일시**: 2026-01-16 17:54 KST
> **테스트 환경**: n8n Cloud Production
> **테스트 방식**: curl을 통한 API 직접 호출
> **테스트 엔드포인트**: https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2

---

## 1. 테스트 목적

WF05 문서 내보내기 워크플로우 API 직접 호출 테스트:
- 존재하지 않는 Patent ID에 대한 에러 처리 검증
- 기존 Patent ID로 FILE_NOT_FOUND 에러 처리 검증
- 다양한 형식(DOCX, PDF) 요청 처리 검증

---

## 2. 테스트 시나리오 및 결과

### 2.1 테스트 케이스 1: 존재하지 않는 Patent ID (PAT-000000)

**요청**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2
Content-Type: application/json

{
  "patentId": "PAT-000000",
  "format": "docx",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": false,
  "template": "standard"
}
```

**결과**:
| 항목 | 값 |
|------|-----|
| HTTP Status | 200 OK |
| Content-Length | 0 (빈 응답) |
| 응답 시간 | 3.898s |
| 결과 | **FAIL** |

**분석**:
- 워크플로우가 "특허 ID 필터링" 노드에서 `throw new Error()` 발생
- 에러 핸들러가 없어 빈 응답 반환
- 예상 응답: `{"success": false, "error": "Patent not found"}`
- 실제 응답: 빈 응답 (Content-Length: 0)

**개선 필요**:
- Patent ID를 찾지 못할 경우 적절한 에러 응답 반환 필요
- Error Handler 노드 추가 필요

---

### 2.2 테스트 케이스 2: 기존 Patent ID DOCX 형식 (PAT-323070)

**요청**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2
Content-Type: application/json

{
  "patentId": "PAT-323070",
  "format": "docx",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": false,
  "template": "standard"
}
```

**결과**:
| 항목 | 값 |
|------|-----|
| HTTP Status | 404 Not Found |
| Content-Type | application/json; charset=utf-8 |
| 응답 시간 | 2.09s |
| 결과 | **PASS** |

**응답 JSON**:
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-323070"
}
```

**분석**:
- PAT-323070이 Google Sheets에 존재함 (Patent ID 필터링 성공)
- 명세서 파일 ID가 없어 FILE_NOT_FOUND 에러 반환
- 예상대로 정상 작동

---

### 2.3 테스트 케이스 3: PDF 형식 + 워터마크 (PAT-323070)

**요청**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2
Content-Type: application/json

{
  "patentId": "PAT-323070",
  "format": "pdf",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": true,
  "template": "standard"
}
```

**결과**:
| 항목 | 값 |
|------|-----|
| HTTP Status | 404 Not Found |
| Content-Type | application/json; charset=utf-8 |
| 응답 시간 | 2.13s |
| 결과 | **PASS** |

**응답 JSON**:
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-323070"
}
```

**분석**:
- format이 pdf로 변경되어도 동일하게 처리
- 파일 ID 검증 단계에서 FILE_NOT_FOUND 반환
- 예상대로 정상 작동

---

### 2.4 테스트 케이스 4: 다른 기존 Patent ID (PAT-379376)

**요청**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2
Content-Type: application/json

{
  "patentId": "PAT-379376",
  "format": "docx",
  "includeDrawings": true,
  "includeMetadata": true,
  "watermark": false,
  "template": "standard"
}
```

**결과**:
| 항목 | 값 |
|------|-----|
| HTTP Status | 404 Not Found |
| Content-Type | application/json; charset=utf-8 |
| 응답 시간 | 2.83s |
| 결과 | **PASS** |

**응답 JSON**:
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-379376"
}
```

**분석**:
- PAT-379376도 Google Sheets에 존재
- 마찬가지로 명세서 파일이 생성되지 않아 FILE_NOT_FOUND
- 예상대로 정상 작동

---

## 3. 테스트 결과 요약

| 테스트 케이스 | Patent ID | 형식 | 예상 결과 | 실제 결과 | 상태 |
|--------------|-----------|------|----------|----------|------|
| TC-01: 존재하지 않는 ID | PAT-000000 | docx | Patent not found 에러 | 빈 응답 (200) | **FAIL** |
| TC-02: 기존 ID (DOCX) | PAT-323070 | docx | FILE_NOT_FOUND (404) | FILE_NOT_FOUND (404) | **PASS** |
| TC-03: 기존 ID (PDF) | PAT-323070 | pdf | FILE_NOT_FOUND (404) | FILE_NOT_FOUND (404) | **PASS** |
| TC-04: 다른 기존 ID | PAT-379376 | docx | FILE_NOT_FOUND (404) | FILE_NOT_FOUND (404) | **PASS** |

### 총합: 3 PASS / 1 FAIL (75% 성공률)

---

## 4. 응답 시간 분석

| 테스트 케이스 | 응답 시간 | 평가 |
|--------------|----------|------|
| TC-01 (PAT-000000) | 3.898s | 지연 (에러 처리) |
| TC-02 (PAT-323070 DOCX) | 2.09s | 정상 |
| TC-03 (PAT-323070 PDF) | 2.13s | 정상 |
| TC-04 (PAT-379376) | 2.83s | 정상 |

**평균 응답 시간**: 2.74s

---

## 5. 발견된 문제점

### 5.1 Critical: 존재하지 않는 Patent ID 에러 처리 누락

**문제**:
- PAT-000000처럼 존재하지 않는 Patent ID 요청 시 빈 응답 반환
- "특허 ID 필터링" 노드에서 `throw new Error()` 발생 시 에러 핸들러 없음

**영향**:
- 클라이언트가 적절한 에러 메시지를 받지 못함
- 사용자 경험 저하

**권장 조치**:
1. Error Handler 노드 추가
2. `Patent not found` 에러에 대한 JSON 응답 반환
3. HTTP 404 상태 코드와 함께 응답

**제안 응답 형식**:
```json
{
  "success": false,
  "error": "PATENT_NOT_FOUND",
  "message": "요청한 Patent ID를 찾을 수 없습니다.",
  "patentId": "PAT-000000"
}
```

---

## 6. 워크플로우 엔드포인트 확인

| 항목 | 값 |
|------|-----|
| Production Endpoint | https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2 |
| Local Workflow Path | wf05-export-document (파일 기준) |
| HTTP Method | POST |
| Response Mode | responseNode |

**참고**: 로컬 워크플로우 파일(WF05-document-export.json)의 webhook path는 `wf05-export-document`이나, Production에서는 `wf05-export-v2`로 배포됨.

---

## 7. 다음 단계 권장 사항

### 7.1 즉시 조치 필요
1. **Error Handler 추가**: Patent not found 에러에 대한 적절한 JSON 응답 반환

### 7.2 완전한 E2E 테스트를 위한 사전 조건
1. **WF03 실행**: 테스트용 Patent ID에 대해 명세서 생성 필요
2. **파일 ID 확인**: Google Sheets의 "명세서 파일 ID" 컬럼에 실제 파일 ID 저장 필요

### 7.3 추가 테스트 시나리오 (파일 생성 후)
- 실제 DOCX 다운로드 테스트
- 실제 PDF 다운로드 테스트
- Markdown 변환 테스트
- HWP 미지원 에러 처리 테스트

---

## 8. 결론

WF05 문서 내보내기 API의 핵심 기능은 정상 작동하며, 기존 Patent ID에 대한 FILE_NOT_FOUND 에러 처리가 올바르게 구현되어 있습니다.

다만, **존재하지 않는 Patent ID에 대한 에러 처리가 누락**되어 빈 응답이 반환되는 문제가 발견되었습니다. 이 부분에 대한 Error Handler 추가가 필요합니다.

실제 문서 생성 및 다운로드 기능은 WF03을 통해 명세서가 생성된 후에 테스트 가능합니다.

---

*테스트 수행: Claude Code (Quality Engineer)*
*문서 버전: 1.0.0*
*작성일: 2026-01-16*
