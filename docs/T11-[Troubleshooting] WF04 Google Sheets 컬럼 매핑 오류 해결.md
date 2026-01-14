# T11-[Troubleshooting] WF04 Google Sheets 컬럼 매핑 오류 해결

## 문제 개요

| 항목 | 내용 |
|------|------|
| **발생 일시** | 2026-01-15 |
| **영향 워크플로우** | WF04-명세서검수 |
| **오류 메시지** | "Column names were updated after the node's setup" |
| **영향 노드** | Google Sheets 승인/반려/수정요청 업데이트 (3개 노드) |
| **해결 상태** | ✅ **완전 해결** |
| **스프레드시트 ID** | `1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI` |

---

## 1. 문제 분석

### 1.1 증상

WF04 워크플로우 실행 시 Google Sheets 업데이트 노드에서 다음 오류 발생:

```
Error: Column names were updated after the node's setup
Refresh the columns list in the 'Column to Match On' parameter.
Updated columns: 상태 -> 발명 명칭, 최종문서 URL -> 발명자, 검수완료일 -> 소속
```

### 1.2 근본 원인 (2가지)

#### 원인 1: patent_id 참조 경로 오류 ✅ 해결됨

**문제**: Google Sheets 노드가 `$json.patent_id`로 직접 참조
- Google Drive 노드 출력은 `kind`, `id`, `name`, `mimeType` 등의 Drive API 응답
- 원본 `patent_id`가 포함되지 않음

**해결**: 업스트림 Code 노드를 직접 참조하도록 수정

```javascript
// Before (잘못된 참조)
"Patent ID": "={{ $json.patent_id }}"

// After (올바른 참조)
"Patent ID": "={{ $('승인 처리').item.json.patent_id }}"
```

#### 원인 2: 스프레드시트 컬럼 구조 불일치 ⚠️ 추가 조치 필요

**문제**: Google Sheets 스프레드시트의 실제 컬럼과 워크플로우 설정 불일치

| 워크플로우 기대 컬럼 | 실제 스프레드시트 컬럼 |
|---------------------|----------------------|
| Patent ID | Patent ID ✅ |
| 상태 | 발명 명칭 ❌ |
| 최종문서 URL | 발명자 ❌ |
| 검수완료일 | 소속 ❌ |

---

## 2. 해결 방안

### 2.1 해결된 항목: patent_id 참조 경로 수정

**적용된 수정사항** (n8n API로 자동 적용됨):

| 노드 | 수정 전 | 수정 후 |
|------|---------|---------|
| Google Sheets 승인 업데이트 | `$json.patent_id` | `$('승인 처리').item.json.patent_id` |
| Google Sheets 반려 업데이트 | `$json.patent_id` | `$('수정 요청 처리').item.json.patent_id` |
| Google Sheets 수정요청 업데이트 | `$json.patent_id` | `$('수정 요청 처리').item.json.patent_id` |

### 2.2 추가 조치 필요: 스프레드시트 컬럼 구조 수정

**방법 A: 스프레드시트에 컬럼 추가 (권장)** ✅ 수동 조치 필요

### 현재 스프레드시트 컬럼 구조 (2026-01-15 분석)

```
기존 컬럼 (A-I):
A: Patent ID          ✅ 존재
B: 발명 명칭
C: 발명자
D: 소속
E: 기술분야
F: 키워드
G: 상태               ✅ 존재 (WF01에서 생성)
H: 제출일
I: 발명제안서 URL

Google Drive 메타데이터 (J-AZ):
J-AZ: kind, id, name, mimeType 등 Drive API 응답 필드
```

### 추가 필요 컬럼

| 컬럼명 | 용도 | 사용 워크플로우 |
|--------|------|-----------------|
| `최종문서 URL` | 승인/반려된 문서의 Google Drive 링크 | WF04 |
| `검수완료일` | 검수 완료 날짜 (yyyy-MM-dd) | WF04 |
| `반려사유` | 반려 시 사유 | WF04 |
| `수정요청사항` | 수정 요청 시 코멘트 | WF04 |
| `명세서초안 URL` | 명세서 초안 Google Drive 링크 | WF03 |

### 수동 추가 단계

1. **Google Sheets 열기**:
   - URL: `https://docs.google.com/spreadsheets/d/1nPBr1E4-zQNFiIAt7Q36tDP5x0niDSFqJsNllaIwWvI/edit`

2. **제출이력 시트 선택**

3. **빈 컬럼 찾기** (현재 BA열 이후)

4. **헤더 추가** (1행에 다음 텍스트 입력):
   ```
   최종문서 URL | 검수완료일 | 반려사유 | 수정요청사항 | 명세서초안 URL
   ```

5. **저장** (자동 저장됨)

**방법 B: n8n Cloud UI에서 노드 컬럼 매핑 재설정** (스프레드시트 컬럼 추가 후 필수)

### 상세 단계

1. **n8n Cloud 접속**:
   - URL: `https://mai-n8n.app.n8n.cloud/workflow/zSXpWko9op4hnSBr`

2. **Google Sheets 승인 업데이트 노드 설정**:
   - 노드 더블클릭하여 설정 패널 열기
   - "Columns" 섹션에서 "Refresh" 아이콘 클릭
   - 새로 추가된 컬럼 목록 확인
   - 매핑 설정:
     - Patent ID → Patent ID (기존 A열)
     - 상태 → 상태 (기존 G열 또는 새 컬럼)
     - 최종문서 URL → 최종문서 URL (새 컬럼)
     - 검수완료일 → 검수완료일 (새 컬럼)

3. **Google Sheets 반려 업데이트 노드 설정**:
   - 동일한 방법으로 Refresh 및 매핑
   - 추가 매핑: 반려사유 → 반려사유 (새 컬럼)

4. **Google Sheets 수정요청 업데이트 노드 설정**:
   - 동일한 방법으로 Refresh 및 매핑
   - 추가 매핑: 수정요청사항 → 수정요청사항 (새 컬럼)

5. **워크플로우 저장**:
   - Ctrl+S 또는 "Save" 버튼 클릭

6. **테스트 실행**:
   - 검수 Form 트리거로 테스트 실행
   - Google Sheets 업데이트 성공 확인

---

## 3. 검증 결과

### 3.1 patent_id 참조 수정 후 테스트

| 테스트 항목 | 결과 | 비고 |
|-------------|------|------|
| 검수 Form 제출 | ✅ 성공 | 1ms |
| 승인 여부 확인 | ✅ 성공 | 4ms |
| 승인 처리 | ✅ 성공 | 1.592s |
| 승인 완료 출력 | ✅ 성공 | 1ms |
| Google Drive 업로드 | ✅ 성공 | 3.18s |
| Google Sheets 업데이트 | ❌ 실패 | 컬럼 불일치 |

**Google Drive 저장 성공**:
- 파일명: `승인_PAT-TEST-1768431529305_20260115.md`
- File ID: `1Yn4q48Um3Q6TD7gtbGP4DFG3iJrGcurv`
- 저장 폴더: 04_승인문서

### 3.2 컬럼 불일치 상세

n8n 오류 메시지에서 확인된 매핑:
```
워크플로우 설정    →  실제 스프레드시트
─────────────────────────────────────
상태              →  발명 명칭
최종문서 URL      →  발명자
검수완료일        →  소속
```

---

## 4. 권장 조치 사항

### 4.1 즉시 조치 (스프레드시트 수정)

Google Sheets 스프레드시트에서 다음 컬럼 헤더 추가:

1. **제출이력** 시트에 컬럼 추가:
   - `상태` (approved/rejected/revision_requested)
   - `최종문서 URL` (Google Drive 링크)
   - `검수완료일` (yyyy-MM-dd 형식)
   - `반려사유` (반려 시 사유)
   - `수정요청사항` (수정 요청 시 내용)
   - `명세서초안 URL` (WF03에서 사용)

2. **n8n Cloud Variables 확인**:
   - `GOOGLE_SHEETS_TRACKING_ID`: 올바른 스프레드시트 ID인지 확인

### 4.2 워크플로우 노드 재설정

스프레드시트 컬럼 추가 후:

1. WF04 워크플로우 열기
2. 각 Google Sheets 노드에서 "Columns" 파라미터 재설정
3. "Refresh" 버튼으로 새 컬럼 목록 로드
4. 저장 후 테스트 실행

---

## 5. 학습된 교훈

### 5.1 n8n 데이터 플로우 이해

```
[Code 노드]           [Google Drive 노드]      [Google Sheets 노드]
    │                       │                       │
    ├── patent_id           ├── kind               ├── $json = Google Drive 출력
    ├── claims              ├── id                 │
    ├── description         ├── name               │   $('승인 처리') = Code 노드 출력
    └── ...                 ├── mimeType           │
                            └── webViewLink        │
                                                   ↓
                            $json.patent_id ❌ (존재하지 않음)
                            $('승인 처리').item.json.patent_id ✅
```

### 5.2 n8n Expression 참조 패턴

| 참조 패턴 | 설명 | 사용 시점 |
|-----------|------|-----------|
| `$json.property` | 직전 노드의 JSON 출력 | 단순 체인 시 |
| `$('노드명').item.json.property` | 특정 노드의 출력 참조 | 중간 노드가 데이터 변형할 때 |
| `$input.first().json.property` | 첫 번째 입력 항목 | 여러 입력 처리 시 |

### 5.3 Google Sheets 노드 주의사항

1. **스키마 동기화**: 스프레드시트 컬럼 변경 시 노드 설정도 업데이트 필요
2. **Column to Match On**: 업데이트 작업 시 반드시 고유 키 컬럼 지정
3. **$vars 사용**: Document ID는 환경변수로 관리하여 유연성 확보

---

## 6. 관련 문서

- [T08-[Troubleshooting] n8n Cloud 환경변수 접근 제한 해결](./T08-[Troubleshooting]%20n8n%20Cloud%20환경변수%20접근%20제한%20해결.md)
- [T10-[Test] WF01-WF04 Google Drive 저장 E2E 테스트 리포트](./T10-[Test]%20WF01-WF04%20Google%20Drive%20저장%20E2E%20테스트%20리포트.md)

---

## 7. 자동화 시도 결과

### 7.1 브라우저 자동화 시도 (Playwright/Chrome DevTools MCP)

| 시도 | 결과 | 원인 |
|------|------|------|
| Google Sheets 셀에 한국어 입력 | ❌ 실패 | Google Sheets의 셀은 표준 input/textarea가 아님 |
| JavaScript clipboard paste | ❌ 실패 | Google Sheets 보안 정책으로 차단 |
| 컬럼 삽입 (Insert → Column) | ✅ 성공 | BA 컬럼 추가됨 |
| Google 로그인 세션 | ⏰ 만료 | 브라우저 자동화 재접속 시 로그인 필요 |

### 7.2 n8n MCP 시도

| 시도 | 결과 | 비고 |
|------|------|------|
| 워크플로우 조회 | ✅ 성공 | n8n_get_workflow로 전체 설정 확인 |
| patent_id 참조 수정 확인 | ✅ 성공 | 3개 노드 모두 수정됨 |
| 노드 설정 업데이트 | ⚠️ 제한적 | 컬럼 매핑은 UI Refresh 필요 |

### 7.3 결론

- **자동화 가능**: patent_id 참조 경로 수정 (n8n API)
- **수동 필요**: 스프레드시트 컬럼 헤더 추가
- **수동 필요**: n8n Cloud UI에서 노드 컬럼 Refresh

---

## 8. 체크리스트

### 작업 전 확인
- [x] Google Sheets 스프레드시트 접근 권한 확인
- [x] n8n Cloud 로그인 상태 확인
- [x] WF04 워크플로우 비활성화 상태 확인

### 스프레드시트 컬럼 추가
- [x] `최종문서 URL` 컬럼 추가 (BA열)
- [x] `검수완료일` 컬럼 추가 (BB열)
- [x] `반려사유` 컬럼 추가 (BC열)
- [x] `수정요청사항` 컬럼 추가 (BD열)
- [x] `명세서초안 URL` 컬럼 추가 (BE열, WF03용)

### n8n 노드 재설정
- [x] "Google Sheets 승인 업데이트" 노드 Refresh 및 매핑
- [x] "Google Sheets 반려 업데이트" 노드 Refresh 및 매핑
- [x] "Google Sheets 수정요청 업데이트" 노드 Refresh 및 매핑
- [x] 워크플로우 저장

### 테스트
- [x] WF04 검수 Form으로 승인 테스트 ✅ **성공**
- [x] Google Sheets 업데이트 확인 ✅ **성공**
- [ ] WF04 검수 Form으로 반려 테스트 (선택적)
- [ ] WF04 검수 Form으로 수정요청 테스트 (선택적)

---

## 9. 변경 이력

| 날짜 | 내용 | 수행자 |
|------|------|--------|
| 2026-01-15 | patent_id 참조 경로 수정 (3개 노드) | Claude Code |
| 2026-01-15 | 스프레드시트 컬럼 불일치 원인 분석 | Claude Code |
| 2026-01-15 | 자동화 시도 및 한계 문서화 | Claude Code |
| 2026-01-15 | 수동 조치 체크리스트 추가 | Claude Code |
| 2026-01-15 | **Google Sheets 컬럼 헤더 5개 추가 (BA-BE)** | Claude Code (Playwright) |
| 2026-01-15 | **n8n Cloud Google Sheets 노드 3개 Refresh** | Claude Code (Playwright) |
| 2026-01-15 | **Merge 노드 모드 수정 (combine → append)** | Claude Code (n8n MCP) |
| 2026-01-15 | **WF04 E2E 테스트 성공 (승인 플로우)** | Claude Code (Playwright) |

---

## 10. E2E 테스트 결과 (최종 검증)

### 10.1 테스트 정보

| 항목 | 값 |
|------|-----|
| **테스트 일시** | 2026-01-15 |
| **테스트 Patent ID** | PAT-TEST-1768433432275 |
| **승인 상태** | approved |
| **전체 실행 시간** | 25.31s |
| **테스트 결과** | ✅ **완전 성공** |

### 10.2 노드별 실행 결과

| 노드 | 상태 | 비고 |
|------|------|------|
| 검수 Form | ✅ Success | Form 제출 정상 |
| 승인 여부 확인 | ✅ Success | IF 분기 정상 |
| 승인 처리 | ✅ Success | Code 노드 정상 |
| 승인 완료 출력 | ✅ Success | Set 노드 정상 |
| Google Drive 업로드 (승인문서) | ✅ Success | 파일 업로드 성공 |
| **Google Sheets 승인 업데이트** | ✅ **Success** | **컬럼 매핑 오류 해결됨** |
| **결과 병합** | ✅ **Success (1ms)** | **append 모드 정상 동작** |

### 10.3 Google Drive 저장 결과

| 항목 | 값 |
|------|-----|
| **파일 URL** | https://drive.google.com/file/d/1T7eEt3PiGMZFBce2yggKwSB1C56O58hb/view?usp=drivesdk |
| **저장 폴더** | 04_승인문서 |
| **검수완료일** | 2026-01-15 |

### 10.4 추가 수정 사항

**Merge 노드 "Fields to Match" 오류 해결**:
- **오류**: "You need to define at least one pair of fields in 'Fields to Match' to match on"
- **원인**: Merge 노드의 `mode: "combine"` 설정이 Fields to Match 정의를 필요로 함
- **해결**: n8n MCP API로 `mode: "append"`로 변경
- **결과**: 정상 동작 확인 (1ms 실행)

---

*문서 작성일: 2026-01-15*
*최종 업데이트: 2026-01-15*
*해결 완료: 2026-01-15*
