# T14 - WF01 Patent ID 저장 버그 수정 리포트

> **테스트 일시**: 2026-01-16
> **상태**: 버그 수정 완료
> **영향 워크플로우**: WF01, WF05

---

## 1. 버그 개요

### 1.1 증상
- WF05 문서 내보내기 실행 시 "Patent not found: PAT-XXXXXX" 에러 발생
- Google Sheets의 Patent ID 컬럼이 모든 행에서 빈 값 또는 공백

### 1.2 영향 범위
- WF05 문서 내보내기 기능 전체 불가
- 기존에 생성된 44개 특허 데이터의 Patent ID가 누락됨

---

## 2. 근본 원인 분석

### 2.1 에러 발생 경로

```
Frontend Export Request
       ↓
WF05 Webhook 수신
       ↓
Google Sheets 전체 데이터 조회 (44 items)
       ↓
특허 ID 필터링 노드
       ↓
❌ Patent ID 컬럼 값이 모두 빈 값
       ↓
Error: "Patent not found: PAT-269671"
```

### 2.2 근본 원인

**WF01 워크플로우의 "Google Sheets 저장 (메타데이터)" 노드에서 잘못된 노드 참조**

#### 버그 코드 (Before)
```javascript
// Patent ID 컬럼 설정
"Patent ID": "={{ $('출력 데이터 설정').item.json.patent_id }}"
```

**문제점**: `출력 데이터 설정` 노드에는 `patent_id` 필드가 존재하지 않음

#### 실제 Patent ID 생성 위치
```javascript
// JSON 파일 변환 노드에서 Patent ID 생성
const patentId = `PAT-${String(Date.now()).slice(-6)}`;

return {
  patent_id: patentId,
  // ... 기타 필드
};
```

---

## 3. 수정 내용

### 3.1 수정된 노드 참조

#### 수정 코드 (After)
```javascript
// Patent ID 컬럼 설정 - 올바른 노드 참조
"Patent ID": "={{ $('JSON 파일 변환').item.json.patent_id }}"
```

### 3.2 변경 위치

| 항목 | 값 |
|------|-----|
| 워크플로우 | WF01-발명제안서입력 |
| 워크플로우 ID | `galbpC91RCA90yyi` |
| 노드 이름 | Google Sheets 저장 (메타데이터) |
| 변경 필드 | Patent ID 컬럼 expression |

### 3.3 수정 방법

n8n MCP `n8n_update_partial_workflow` API를 사용하여 노드 파라미터 업데이트:

```json
{
  "id": "galbpC91RCA90yyi",
  "operations": [
    {
      "type": "updateNode",
      "nodeName": "Google Sheets 저장 (메타데이터)",
      "parameters": {
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Patent ID": "={{ $('JSON 파일 변환').item.json.patent_id }}",
            // ... 기타 컬럼 유지
          }
        }
      }
    }
  ]
}
```

---

## 4. 검증 테스트

### 4.1 WF01 테스트 - 새 특허 생성

**테스트 실행**:
```bash
POST https://mai-n8n.app.n8n.cloud/webhook/wf01-invention-input
Content-Type: application/json

{
  "invention": {
    "inventionTitle": "T14 버그 수정 검증 테스트",
    "inventorName": "테스트",
    "inventorAffiliation": "테스트 기관",
    "technicalField": "소프트웨어",
    "inventionSummary": "버그 수정 검증을 위한 테스트 발명",
    "technicalProblem": "테스트 문제",
    "proposedSolution": "테스트 해결책",
    "expectedEffects": "테스트 효과"
  }
}
```

**응답 결과**:
```json
{
  "success": true,
  "patent_id": "PAT-379376",
  "submission_id": "SUB-379376",
  "message": "발명 제안서가 성공적으로 접수되었습니다."
}
```

**결과**: ✅ Patent ID 정상 생성 및 반환

### 4.2 WF05 테스트 - 특허 조회

**테스트 실행**:
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

**응답 결과**:
```json
{
  "success": false,
  "error": "FILE_NOT_FOUND",
  "message": "명세서 파일이 아직 생성되지 않았습니다. 먼저 WF03을 통해 명세서를 생성해주세요.",
  "patentId": "PAT-379376"
}
```

**결과**: ✅ 특허 ID 조회 성공 (FILE_NOT_FOUND는 WF03 미실행으로 예상된 결과)

---

## 5. 테스트 결과 요약

### 5.1 버그 수정 전후 비교

| 테스트 항목 | 수정 전 | 수정 후 |
|------------|--------|--------|
| WF01 Patent ID 생성 | ✅ 정상 | ✅ 정상 |
| WF01 Patent ID Sheets 저장 | ❌ 빈 값 | ✅ 정상 |
| WF05 Patent ID 조회 | ❌ Not found | ✅ 정상 |
| WF05 문서 내보내기 | ❌ 실패 | ⏳ WF03 필요 |

### 5.2 수정 효과

1. **즉시 효과**: 신규 생성되는 특허의 Patent ID가 Google Sheets에 정상 저장
2. **WF05 정상화**: Patent ID 기반 특허 조회 기능 정상 작동
3. **데이터 연계**: WF01 → WF05 간 데이터 흐름 정상화

---

## 6. 기존 데이터 복구 가이드

### 6.1 영향받은 데이터
- 버그 수정 전 생성된 44개 특허 레코드
- Patent ID 컬럼이 빈 값으로 저장됨

### 6.2 복구 방법 (선택사항)

**방법 1: Google Sheets에서 수동 입력**
1. Google Sheets 특허 추적 시트 접속
2. 각 행의 `제출 ID` 또는 `저장 시간`을 기반으로 Patent ID 역산
3. Patent ID 컬럼에 수동 입력

**방법 2: 재생성**
- 중요한 특허의 경우 WF01을 통해 재제출

---

## 7. 예방 조치

### 7.1 워크플로우 개발 체크리스트

- [ ] 노드 간 데이터 참조 시 실제 데이터 생성 위치 확인
- [ ] `$('NodeName').item.json.field` 표현식의 NodeName 정확성 검증
- [ ] Google Sheets 저장 전 저장할 데이터 미리보기 확인
- [ ] E2E 테스트로 전체 데이터 흐름 검증

### 7.2 권장 테스트 절차

```
1. WF01 단독 테스트 → Google Sheets 데이터 확인
2. WF02 테스트 → 선행기술 검색 결과 확인
3. WF03 테스트 → 명세서 생성 확인
4. WF04 테스트 → 검수 프로세스 확인
5. WF05 테스트 → 문서 내보내기 확인
6. 전체 E2E 테스트 → WF01→WF05 연속 실행
```

---

## 8. 관련 문서

| 문서 | 설명 |
|------|------|
| [T13-WF05 E2E 테스트 리포트](./T13-[Test]%20WF05%20문서%20내보내기%20Production%20E2E%20테스트%20리포트.md) | WF05 초기 테스트 |
| [I14-WF05 Google Drive Export 구현](./I14-WF05-Google-Drive-Export-Implementation.md) | WF05 구현 문서 |
| [WF01-invention-input.json](../workflows/WF01-invention-input.json) | WF01 워크플로우 JSON |

---

## 9. 결론

### ✅ WF01 Patent ID 저장 버그 수정 완료

**수정 요약**:
- 원인: Google Sheets 저장 노드에서 잘못된 노드 참조 (`출력 데이터 설정` → `JSON 파일 변환`)
- 수정: Patent ID expression을 올바른 노드로 변경
- 검증: 새 특허 생성 및 WF05 조회 테스트 통과

**다음 단계**:
1. WF03으로 명세서 생성 후 WF05 전체 기능 테스트
2. 필요시 기존 44개 레코드의 Patent ID 복구

---

*문서 작성일: 2026-01-16*
*작성자: Claude Code*
