# I14 - WF05 Google Drive Export 구현

> **작성일**: 2026-01-16
> **상태**: 구현 완료 (n8n 배포 필요)
> **버전**: 2.0.0

---

## 1. 개요

WF05 문서 내보내기 워크플로우를 Mock 구현에서 실제 Google Drive Export API를 활용한 구현으로 업그레이드했습니다.

### 1.1 변경 목적

| 항목 | Before (v1.0) | After (v2.0) |
|------|---------------|--------------|
| DOCX 생성 | Mock Code 노드 (텍스트) | Google Drive Export API (실제 바이너리) |
| PDF 생성 | Mock Code 노드 (텍스트) | Google Drive Export API (실제 바이너리) |
| HWP 생성 | Mock Code 노드 (텍스트) | 미지원 (400 에러 응답) |
| Markdown 생성 | Mock Code 노드 | Google Drive Export → 텍스트 변환 |
| 에러 처리 | 미구현 | 상세 에러 코드 반환 |

---

## 2. 아키텍처

### 2.1 워크플로우 구조

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WF05 문서 내보내기 v2.0                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                                                    ┌─────────────────┐
                                               ┌───▶│  DOCX 내보내기   │──▶ Set Meta ──┐
                                               │    └─────────────────┘               │
┌──────────┐    ┌──────────┐    ┌──────────┐   │    ┌─────────────────┐               │   ┌─────────────┐
│ Webhook  │───▶│요청 파싱  │───▶│ Sheets   │───▶│───▶│  PDF 내보내기    │──▶ Set Meta ──┼──▶│   Merge     │
│ Trigger  │    │          │    │ 조회     │   │    └─────────────────┘               │   │             │
└──────────┘    └──────────┘    └──────────┘   │    ┌─────────────────┐               │   └──────┬──────┘
                                               │───▶│  텍스트 내보내기  │──▶ MD 변환 ───┤          │
                                 ┌──────────┐  │    └─────────────────┘               │          │
                                 │  필터링  │──┤                                       │          ▼
                                 │  & 검증  │  │    ┌─────────────────┐               │   ┌─────────────┐
                                 └──────────┘  └───▶│  HWP 미지원 응답 │───────────────┘   │  Upload to  │
                                       │            └─────────────────┘                   │   Exports   │
                                       │                                                  └──────┬──────┘
                                       │            ┌─────────────────┐                          │
                                       └───────────▶│ 파일 없음 에러   │                          ▼
                                     (파일ID 없음)  └─────────────────┘                   ┌─────────────┐
                                                                                         │  Success    │
                                                                                         │  Response   │
                                                                                         └─────────────┘
```

### 2.2 주요 노드 변경

#### 기존 (v1.0) - Mock Code 노드
```javascript
// DOCX 생성 로직 (Mock)
const content = $input.first().json.content;
const patentId = $('요청 파싱').item.json.patentId;

return {
  filename: `${patentId}_명세서.docx`,
  content: content,  // 텍스트만 반환
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
```

#### 신규 (v2.0) - Google Drive Export
```json
{
  "name": "DOCX 내보내기",
  "type": "n8n-nodes-base.googleDrive",
  "parameters": {
    "operation": "download",
    "fileId": "={{ $json.fileId }}",
    "options": {
      "googleFileConversion": {
        "conversion": {
          "docsToFormat": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
      }
    }
  }
}
```

---

## 3. 지원 형식

### 3.1 지원되는 형식

| 형식 | MIME Type | 설명 |
|------|-----------|------|
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Microsoft Word 형식 |
| PDF | `application/pdf` | 고정 레이아웃 문서 |
| Markdown | `text/markdown` | 텍스트 기반 마크업 |

### 3.2 미지원 형식

| 형식 | 이유 | 대안 |
|------|------|------|
| HWP | Google API 미지원 | DOCX로 내보낸 후 한글에서 열기 |

---

## 4. API 응답 형식

### 4.1 성공 응답

```json
{
  "success": true,
  "downloadUrl": "https://drive.google.com/uc?id=xxx&export=download",
  "driveUrl": "https://drive.google.com/file/d/xxx/view",
  "fileId": "1abc123...",
  "filename": "PAT-20260116-001_명세서.docx",
  "format": "docx",
  "message": "문서가 성공적으로 생성되었습니다."
}
```

### 4.2 에러 응답

#### 파일 미존재 (404)
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-001"
}
```

#### 형식 미지원 (400)
```json
{
  "success": false,
  "error": "FORMAT_NOT_SUPPORTED",
  "message": "HWP 형식은 현재 지원되지 않습니다. DOCX 또는 PDF 형식을 사용해주세요.",
  "supportedFormats": ["docx", "pdf", "markdown"]
}
```

---

## 5. 프론트엔드 변경

### 5.1 HWP 미지원 처리

```typescript
// export/page.tsx
const handleExport = async (options: ExportOptions) => {
  // HWP 형식 미지원 안내
  if (options.format === 'hwp') {
    setExportError('HWP 형식은 현재 지원되지 않습니다. DOCX 또는 PDF 형식을 사용해주세요.');
    return;
  }
  // ...
};
```

### 5.2 에러 코드별 처리

```typescript
// 에러 응답 처리
const errorMessage = result.error === 'FORMAT_NOT_SUPPORTED'
  ? 'HWP 형식은 현재 지원되지 않습니다.'
  : result.error === 'FILE_NOT_FOUND'
  ? '명세서 파일이 아직 생성되지 않았습니다.'
  : result.message || '문서 생성에 실패했습니다.';
```

### 5.3 UI 변경

```tsx
// HWP 옵션 비활성화 표시
<div className="p-3 bg-gray-50 rounded-lg opacity-60">
  <p className="font-medium text-gray-900">
    HWP (한글) <span className="text-xs text-orange-600">준비 중</span>
  </p>
  <p className="text-gray-500 text-xs mt-1">
    현재 지원되지 않습니다. DOCX로 내보낸 후 한글에서 열어주세요.
  </p>
</div>
```

---

## 6. 배포 절차

### 6.1 n8n Cloud 배포

1. n8n Cloud 접속 (https://mai-n8n.app.n8n.cloud)
2. 기존 WF05-문서내보내기 워크플로우 비활성화
3. `workflows/WF05-document-export.json` 파일 Import
4. Google OAuth2 Credentials 연결 확인
5. Variables 설정 확인:
   - `GOOGLE_SHEETS_TRACKING_ID`
   - `GOOGLE_DRIVE_EXPORTS_FOLDER_ID`
6. 워크플로우 활성화

### 6.2 테스트 절차

1. WF01~WF04로 실제 특허 데이터 생성
2. 생성된 Patent ID로 WF05 테스트
3. DOCX/PDF 다운로드 확인
4. Google Drive Exports 폴더에 파일 저장 확인

---

## 7. 관련 파일

| 파일 | 설명 |
|------|------|
| `workflows/WF05-document-export.json` | 워크플로우 JSON (v2.0) |
| `web/src/app/export/page.tsx` | 내보내기 페이지 |
| `web/src/lib/n8n-client.ts` | n8n API 클라이언트 |
| `docs/T13-*.md` | E2E 테스트 리포트 |

---

## 8. 향후 계획

### 8.1 HWP 지원 방안 검토

1. **외부 변환 서비스 연동**: CloudConvert, Zamzar 등 API 활용
2. **hwp.js 라이브러리**: Node.js 기반 HWP 생성 (제한적)
3. **DOCX → HWP 변환 워크플로우**: 별도 변환 단계 추가

### 8.2 기능 개선 계획

- [ ] 워터마크 적용 기능 (PDF)
- [ ] 도면 포함/제외 옵션 실제 구현
- [ ] 템플릿 스타일 적용

---

*문서 작성일: 2026-01-16*
*작성자: Claude Code*
