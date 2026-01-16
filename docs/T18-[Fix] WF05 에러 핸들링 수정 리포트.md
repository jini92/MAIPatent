# T18 - WF05 에러 핸들링 수정 리포트

## 개요
- **수정일**: 2026-01-17
- **대상 워크플로우**: WF05-문서내보내기 (ID: aJ88MvFMNvV7rCkkgcv_t)
- **이슈 발견**: T17 Production Full Test에서 발견

## 문제 현상

### 증상
존재하지 않는 Patent ID로 WF05 API 호출 시:
- HTTP 200 반환 (정상 상태코드)
- Response Body가 빈 문자열 (`""`)
- 클라이언트에서 에러 판단 불가

### 테스트 케이스
```bash
curl -X POST "https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2" \
  -H "Content-Type: application/json" \
  -d '{"patentId": "PAT-NONEXISTENT-12345", "format": "docx"}'

# 수정 전 결과: (empty response)
# 기대 결과: {"success": false, "error": "PATENT_NOT_FOUND", ...}
```

## 근본 원인 분석

### 문제 코드 (수정 전)
```javascript
// "특허 ID 필터링" Code 노드
const matchingItem = allItems.find(item =>
  item.json['Patent ID'] === patentId || ...
);
if (!matchingItem) {
  throw new Error(`Patent not found: ${patentId}`);  // ← 문제!
}
```

### 원인
1. n8n Code 노드에서 `throw new Error()` 사용
2. Error Handler 노드가 연결되지 않음
3. 에러 발생 시 워크플로우가 중단되어 Respond to Webhook 노드에 도달하지 못함
4. n8n이 빈 응답을 HTTP 200으로 반환

## 수정 내용

### 1. "특허 ID 필터링" 노드 코드 수정

```javascript
const patentId = $('요청 파싱').item.json.patentId;
const allItems = $input.all();
const matchingItem = allItems.find(item =>
  item.json['Patent ID'] === patentId ||
  item.json['patent_id'] === patentId ||
  item.json['patentId'] === patentId
);

// 에러를 throw하지 않고 found 플래그로 처리
if (!matchingItem) {
  return {
    found: false,
    patentId: patentId,
    error: 'PATENT_NOT_FOUND',
    message: `해당 특허를 찾을 수 없습니다: ${patentId}`,
    fileId: null
  };
}

return {
  found: true,
  patentId: patentId,
  title: matchingItem.json['발명의 명칭'] || matchingItem.json['title'] || '특허 명세서',
  fileId: matchingItem.json['명세서 파일 ID'] || matchingItem.json['fileId'],
  status: matchingItem.json['상태'] || matchingItem.json['status'],
  format: $('요청 파싱').item.json.format,
  includeMetadata: $('요청 파싱').item.json.includeMetadata
};
```

### 2. "파일 ID 검증" IF 노드 조건 수정

**수정 전:**
- 조건: `fileId notEmpty`

**수정 후:**
- 조건: `found === true` AND `fileId notEmpty`

### 3. "파일 없음 에러" Respond to Webhook 노드 수정

**수정 후 응답 로직:**
```javascript
$json.found === false
  ? { success: false, error: 'PATENT_NOT_FOUND', message: $json.message, patentId: $json.patentId }
  : { success: false, error: 'FILE_NOT_FOUND', message: '명세서 파일이 아직 생성되지 않았습니다...', patentId: $json.patentId }
```

## 수정 후 워크플로우 흐름

```
[요청] → [파싱] → [Google Sheets 조회] → [특허 ID 필터링]
                                              ↓
                                    found: true/false 반환
                                              ↓
                                      [파일 ID 검증]
                                       /          \
                              found=true      found=false
                              fileId있음       OR fileId없음
                                 ↓                  ↓
                          [출력 형식 라우터]   [파일 없음 에러]
                                 ↓                  ↓
                          [문서 생성...]    404 JSON 응답
```

## 테스트 결과

### 테스트 1: 존재하지 않는 특허 ID
```bash
curl -X POST "https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2" \
  -H "Content-Type: application/json" \
  -d '{"patentId": "PAT-NONEXISTENT-12345", "format": "docx"}'
```

**결과:** ✅ PASS
```json
{
  "success": false,
  "error": "PATENT_NOT_FOUND",
  "message": "해당 특허를 찾을 수 없습니다: PAT-NONEXISTENT-12345",
  "patentId": "PAT-NONEXISTENT-12345"
}
```

### 테스트 2: 존재하는 특허 ID (파일 없음)
```bash
curl -X POST "https://mai-n8n.app.n8n.cloud/webhook/wf05-export-v2" \
  -H "Content-Type: application/json" \
  -d '{"patentId": "PAT-613131", "format": "docx"}'
```

**결과:** ✅ PASS
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-613131"
}
```

## 결론

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 존재하지 않는 특허 ID | HTTP 200, 빈 응답 | HTTP 404, JSON 에러 |
| 에러 메시지 | 없음 | 명확한 에러 코드/메시지 |
| 클라이언트 처리 | 불가 | 가능 |

## 권장 사항

1. **n8n Code 노드 개발 가이드라인**: `throw new Error()` 대신 플래그 기반 에러 처리 권장
2. **Error Handler 연결**: 불가피하게 throw를 사용해야 할 경우 반드시 Error Handler 노드 연결
3. **테스트 케이스 추가**: 에러 케이스를 항상 테스트 시나리오에 포함
