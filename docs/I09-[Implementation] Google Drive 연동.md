# I09-[Implementation] Google Drive 연동

> **MAIPatent 시스템의 Google Drive/Sheets 통합 구현 가이드**

---

## 1. 개요

### 1.1 목적
MAIPatent 워크플로우에 Google Drive 및 Google Sheets를 통합하여 발명 제안서 및 특허 명세서의 중앙 집중식 관리를 구현합니다.

### 1.2 통합 범위

| 워크플로우 | 연동 서비스 | 용도 |
|-----------|------------|------|
| WF01 | Google Sheets | 발명 제안서 제출 이력 추적 |
| WF03 | Google Drive | 생성된 명세서 저장 |
| WF04 | Google Drive | 승인된 최종 문서 저장 |

### 1.3 폴더 구조

```
MAIPatent (Google Drive Root)/
├── 01_발명제안서/
│   ├── 2026/
│   │   ├── 01/
│   │   └── ...
│   └── ...
├── 02_선행기술/
│   └── 검색결과_[submission_id].json
├── 03_명세서초안/
│   └── 초안_[submission_id].md
├── 04_승인문서/
│   └── 최종_[submission_id].[docx|pdf]
└── 05_반려문서/
    └── 반려_[submission_id].md
```

---

## 2. 사전 준비

### 2.1 Google Cloud Console 설정

1. **프로젝트 생성**
   - Google Cloud Console 접속: https://console.cloud.google.com
   - 새 프로젝트 생성: `maipatent-automation`

2. **API 활성화**
   ```
   - Google Drive API
   - Google Sheets API
   ```

3. **OAuth 2.0 클라이언트 생성**
   - API 및 서비스 > 사용자 인증 정보
   - OAuth 클라이언트 ID 생성 (웹 애플리케이션)
   - 리디렉션 URI 추가:
     ```
     https://mai-n8n.app.n8n.cloud/rest/oauth2-credential/callback
     ```

### 2.2 n8n Credential 설정

1. **Google Drive Credential**
   - n8n Settings > Credentials > New
   - Type: Google Drive OAuth2 API
   - Client ID / Client Secret 입력
   - Scopes: `https://www.googleapis.com/auth/drive`

2. **Google Sheets Credential**
   - Type: Google Sheets OAuth2 API
   - Scopes: `https://www.googleapis.com/auth/spreadsheets`

### 2.3 환경 변수 추가

`.env` 파일에 추가:
```bash
# Google Drive 설정
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id
GOOGLE_SHEETS_TRACKING_ID=your-tracking-sheet-id
```

---

## 3. 워크플로우 구현

### 3.1 WF01 업데이트: Google Sheets 저장

**추가 노드**: `Save to Google Sheets`

```json
{
  "id": "save-to-sheets",
  "name": "Google Sheets 저장",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.5,
  "position": [1000, -100],
  "credentials": {
    "googleSheetsOAuth2Api": {
      "id": "google-sheets-cred",
      "name": "Google Sheets OAuth2"
    }
  },
  "parameters": {
    "operation": "appendOrUpdate",
    "documentId": {
      "__rl": true,
      "mode": "id",
      "value": "={{ $env.GOOGLE_SHEETS_TRACKING_ID }}"
    },
    "sheetName": "제출이력",
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "Submission ID": "={{ $json.submission_id }}",
        "발명 명칭": "={{ $json.invention_title }}",
        "출원인": "={{ $json.applicant_name }}",
        "발명자": "={{ $json.inventor_name }}",
        "기술분야": "={{ $json.technical_field }}",
        "제출일시": "={{ $json.submission_date }}",
        "상태": "={{ $json.status }}",
        "키워드": "={{ $json.keywords.join(', ') }}"
      }
    }
  }
}
```

**Google Sheets 스키마**:
| 열 | 필드명 | 설명 |
|----|--------|------|
| A | Submission ID | 고유 제출 ID |
| B | 발명 명칭 | 발명의 제목 |
| C | 출원인 | 출원인 이름 |
| D | 발명자 | 발명자 이름 |
| E | 기술분야 | 기술 분야 |
| F | 제출일시 | ISO 8601 형식 |
| G | 상태 | pending/processing/completed/rejected |
| H | 키워드 | 추출된 키워드 (쉼표 구분) |
| I | 명세서 링크 | Google Drive 문서 링크 |
| J | 검수 결과 | 승인/수정/반려 |

### 3.2 WF03 업데이트: Google Drive 저장

**추가 노드**: `Save to Google Drive`

```json
{
  "id": "save-to-drive",
  "name": "Google Drive 저장",
  "type": "n8n-nodes-base.googleDrive",
  "typeVersion": 3,
  "position": [1900, 0],
  "credentials": {
    "googleDriveOAuth2Api": {
      "id": "google-drive-cred",
      "name": "Google Drive OAuth2"
    }
  },
  "parameters": {
    "operation": "upload",
    "name": "초안_{{ $json.submission_id }}.md",
    "folderId": {
      "__rl": true,
      "mode": "id",
      "value": "={{ $env.GOOGLE_DRIVE_DRAFT_FOLDER_ID }}"
    },
    "binaryPropertyName": "data",
    "options": {
      "mimeType": "text/markdown"
    }
  }
}
```

**Binary 변환 노드 추가**:
```json
{
  "id": "convert-to-binary",
  "name": "Markdown to Binary",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1800, 0],
  "parameters": {
    "jsCode": "const markdown = $json.patent_specification;\nconst buffer = Buffer.from(markdown, 'utf-8');\n\nreturn [{\n  json: $json,\n  binary: {\n    data: {\n      data: buffer.toString('base64'),\n      mimeType: 'text/markdown',\n      fileName: `초안_${$json.submission_id}.md`\n    }\n  }\n}];"
  }
}
```

### 3.3 WF04 업데이트: 승인 문서 저장

**승인 처리 브랜치에 추가**:

```json
{
  "id": "save-approved",
  "name": "승인 문서 저장",
  "type": "n8n-nodes-base.googleDrive",
  "typeVersion": 3,
  "position": [1100, -200],
  "credentials": {
    "googleDriveOAuth2Api": {
      "id": "google-drive-cred",
      "name": "Google Drive OAuth2"
    }
  },
  "parameters": {
    "operation": "upload",
    "name": "최종_{{ $json.submission_id }}.md",
    "folderId": {
      "__rl": true,
      "mode": "id",
      "value": "={{ $env.GOOGLE_DRIVE_APPROVED_FOLDER_ID }}"
    },
    "binaryPropertyName": "data"
  }
}
```

**Sheets 상태 업데이트**:
```json
{
  "id": "update-status",
  "name": "상태 업데이트",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.5,
  "position": [1200, -200],
  "parameters": {
    "operation": "update",
    "documentId": "={{ $env.GOOGLE_SHEETS_TRACKING_ID }}",
    "sheetName": "제출이력",
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "상태": "completed",
        "검수 결과": "승인",
        "명세서 링크": "={{ $json.drive_file_url }}"
      }
    },
    "options": {
      "valueInputMode": "USER_ENTERED",
      "valueRenderMode": "UNFORMATTED_VALUE"
    },
    "dataMode": "autoMapInputData",
    "matchingColumns": ["Submission ID"]
  }
}
```

---

## 4. 연결 구조 (Connections)

### 4.1 WF01 업데이트된 연결

```
발명제안서 Form → 데이터 검증 → 검증 결과 분기
                                    ├→ 데이터 보강 → 출력 데이터 설정
                                    │                    ↓
                                    │              Google Sheets 저장
                                    │                    ↓
                                    │              WF02 호출
                                    └→ 오류 응답
```

### 4.2 WF03 업데이트된 연결

```
... → KIPO 포맷 조립 → Markdown to Binary → Google Drive 저장
                                                  ↓
                                           출력 데이터 설정 → WF04 호출
```

### 4.3 WF04 업데이트된 연결

```
승인 여부 확인
    ├→ 승인 처리 → 승인 문서 저장 (Drive) → 상태 업데이트 (Sheets) → 승인 완료 출력
    └→ 수정 요청 처리 → 상태 업데이트 (Sheets) → 수정 요청 출력
```

---

## 5. 추가 환경 변수

`.env` 파일에 다음 변수 추가:

```bash
# Google Drive 폴더 ID
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id
GOOGLE_DRIVE_PROPOSAL_FOLDER_ID=your-proposal-folder-id
GOOGLE_DRIVE_DRAFT_FOLDER_ID=your-draft-folder-id
GOOGLE_DRIVE_APPROVED_FOLDER_ID=your-approved-folder-id
GOOGLE_DRIVE_REJECTED_FOLDER_ID=your-rejected-folder-id

# Google Sheets ID
GOOGLE_SHEETS_TRACKING_ID=your-tracking-sheet-id
```

---

## 6. n8n Cloud 설정 절차

### 6.1 Credential 등록

1. n8n Cloud 접속: https://mai-n8n.app.n8n.cloud
2. Settings > Credentials > Add Credential
3. 아래 2개 Credential 추가:

**Google Drive OAuth2 API**:
- Client ID: `[Google Cloud Console에서 복사]`
- Client Secret: `[Google Cloud Console에서 복사]`
- OAuth 인증 진행

**Google Sheets OAuth2 API**:
- 동일한 Client ID/Secret 사용
- OAuth 인증 진행

### 6.2 Environment Variables 설정

1. Settings > Variables
2. 위 환경 변수들 추가

### 6.3 워크플로우 업데이트

1. 각 워크플로우(WF01, WF03, WF04)에 Google Drive/Sheets 노드 추가
2. Credential 연결
3. 테스트 실행

---

## 7. 구현 체크리스트

### 7.1 사전 준비
- [ ] Google Cloud Console 프로젝트 생성
- [ ] Google Drive API 활성화
- [ ] Google Sheets API 활성화
- [ ] OAuth 2.0 클라이언트 생성
- [ ] Google Drive 폴더 구조 생성
- [ ] Google Sheets 트래킹 시트 생성

### 7.2 n8n 설정
- [ ] Google Drive OAuth2 Credential 등록
- [ ] Google Sheets OAuth2 Credential 등록
- [ ] 환경 변수 설정

### 7.3 워크플로우 업데이트
- [ ] WF01에 Google Sheets 저장 노드 추가
- [ ] WF03에 Google Drive 저장 노드 추가
- [ ] WF04에 승인/상태 업데이트 노드 추가

### 7.4 테스트
- [ ] WF01 제출 → Sheets 기록 확인
- [ ] WF03 생성 → Drive 파일 저장 확인
- [ ] WF04 승인 → 최종 문서 저장 및 상태 업데이트 확인

---

## 8. 다음 단계 (사용자 액션 필요)

### 8.1 Google Cloud Console 설정

1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성: `maipatent-automation`
3. API 라이브러리에서 활성화:
   - Google Drive API
   - Google Sheets API
4. 사용자 인증 정보 > OAuth 클라이언트 ID 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI:
     ```
     https://mai-n8n.app.n8n.cloud/rest/oauth2-credential/callback
     ```

### 8.2 Google Drive 폴더 생성

1. Google Drive에서 `MAIPatent` 폴더 생성
2. 하위 폴더 구조 생성:
   - `01_발명제안서`
   - `02_선행기술`
   - `03_명세서초안`
   - `04_승인문서`
   - `05_반려문서`
3. 각 폴더 ID 복사 (URL에서 확인)

### 8.3 Google Sheets 생성

1. 새 스프레드시트 생성: `MAIPatent_제출이력`
2. 첫 번째 행에 헤더 입력:
   ```
   Submission ID | 발명 명칭 | 출원인 | 발명자 | 기술분야 | 제출일시 | 상태 | 키워드 | 명세서 링크 | 검수 결과
   ```
3. 스프레드시트 ID 복사 (URL에서 확인)

---

## 9. 구현 완료 정보 (2026-01-12)

### 9.1 OAuth 클라이언트 (실제 설정)
```
클라이언트명: MAIPatent
클라이언트 ID: 991837222558-u3q7nfv8dvgblfo7f1bsuq7b23var14c.apps.googleusercontent.com
클라이언트 Secret: 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
리디렉션 URI: https://oauth.n8n.cloud/oauth2/callback
```

### 9.2 Google Drive 폴더 ID (실제 생성)
| 폴더명 | 폴더 ID |
|--------|---------|
| MAIPatent (루트) | `10_1J2-NTVLf1w3hXz0d1fHN6f_OCBmzQ` |
| 01_발명제안서 | `1rqwMUSM_WqSgmztlvh7s8bcO_kSLdd8p` |
| 02_선행기술 | `1CO63_auDraZymK7sBNfmN8jLZzauyyE7` |
| 03_명세서초안 | `1NKFG51NeEE8kZALT8uZHg6kzvOcQtmdX` |
| 04_승인문서 | `19ZuGsXQSQ98ZbnqXcP2-jhTxk8KJ_I0a` |
| 05_반려문서 | `1uqY6hkyzlM7nn8e6Rzy0ygr62NGQ0Ovg` |

### 9.3 Google Sheets ID (실제 생성)
```
시트명: MAIPatent_제출이력
시트 ID: 1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI
URL: https://docs.google.com/spreadsheets/d/1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI
```

### 9.4 n8n Credential 등록 완료
- ✅ Google Drive OAuth2 API - 연결됨
- ✅ Google Sheets OAuth2 API - 연결됨

---

*문서 버전: 1.1.0*
*작성일: 2026-01-11*
*최종 수정: 2026-01-12*
*상태: ✅ 구현 완료*
