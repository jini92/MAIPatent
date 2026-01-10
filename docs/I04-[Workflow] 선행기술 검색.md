# [Workflow] 선행기술 검색 워크플로우

> **WF02: KIPRIS API 기반 선행기술 검색 및 분석 워크플로우 상세 설계**

---

## 1. 워크플로우 개요

| 항목 | 내용 |
|------|------|
| **워크플로우 ID** | WF02 |
| **워크플로우명** | 선행기술 검색 |
| **목적** | KIPRIS API를 통한 선행기술 검색 및 컨텍스트 생성 |
| **트리거** | WF01 Webhook / Manual |
| **출력** | 선행기술 요약, 관련도 점수, WF03 트리거 |

---

## 2. 워크플로우 다이어그램

```
[Webhook Trigger] --> [검색 쿼리 준비] --> [KIPRIS API 호출]
                                               |
                                    +----------+----------+
                                    |                     |
                                    v                     v
                               [성공]                [실패/미설정]
                                    |                     |
                                    v                     v
                            [XML 파싱]           [Mock 데이터]
                                    |                     |
                                    +----------+----------+
                                               |
                                               v
                                    [관련도 점수 계산]
                                               |
                                               v
                                    [컨텍스트 생성]
                                               |
                                               v
                                    [출력 데이터 설정]
```

---

## 3. 노드 상세 설계

### 3.1. Trigger: Webhook

**입력 스키마:**
```json
{
  "submission_id": "INV-xxx",
  "invention_title": "발명의 명칭",
  "keywords": ["키워드1", "키워드2"],
  "suggested_ipc": ["G06N", "G06F 40"],
  "technical_field": "기술분야"
}
```

### 3.2. 검색 쿼리 준비

- 키워드 조합 (상위 3개, + 연산)
- IPC 코드 추출
- 검색 전략 결정

### 3.3. KIPRIS API 호출

**Endpoint:**
```
GET http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/freeSearchInfo
```

**Parameters:**
- ServiceKey: API 인증키
- searchWord: 검색어
- patent: true
- numOfRows: 20

### 3.4. 관련도 점수 계산

| 항목 | 최대 점수 | 기준 |
|------|-----------|------|
| 제목 키워드 매칭 | 40점 | 키워드당 10점 |
| IPC 코드 일치 | 30점 | 완전 일치 30점 / 부분 15점 |
| 최신성 (2년 이내) | 20점 | 2년 20점 / 5년 10점 |
| 등록 상태 | 10점 | 등록 10점 / 공개 5점 |

### 3.5. 컨텍스트 생성

마크다운 형식의 선행기술 요약:
- 검색 결과 개요
- 개별 선행기술 정보
- 차별화 지침

---

## 4. 환경 변수

| 변수명 | 설명 | 상태 |
|--------|------|------|
| KIPRIS_API_KEY | KIPRIS Open API 인증키 | 미설정 (Mock 사용) |

---

## 5. Fallback 전략

API 키 미설정 또는 API 오류 시 Mock 데이터 사용

---

## 6. 구현 결과 ✅

### 6.1. n8n 워크플로우 정보

| 항목 | 값 |
|------|-----|
| **Workflow ID** | `iFAXSkfG5Rh0b8Qh` |
| **Workflow Name** | `WF02-선행기술검색` |
| **Status** | Inactive (테스트 완료 후 활성화) |
| **Local JSON** | `workflows/WF02-prior-art-search.json` |
| **생성일** | 2026-01-10 |

### 6.2. 구현된 노드 구조 (10개)

```
[Webhook Trigger] --> [검색 쿼리 준비] --> [API 키 확인]
                                              |
                            +-----------------+-----------------+
                            |                                   |
                            v                                   v
                     [KIPRIS API 호출]                   [Mock 데이터]
                            |                                   |
                            v                                   |
                       [XML 파싱]                               |
                            |                                   |
                            +----------------+------------------+
                                             |
                                             v
                                      [결과 병합]
                                             |
                                             v
                                   [관련도 점수 계산]
                                             |
                                             v
                                    [컨텍스트 생성]
                                             |
                                             v
                                  [출력 데이터 설정]
```

### 6.3. 주요 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| Webhook 트리거 | ✅ 구현 | POST /wf02-prior-art-search |
| 검색 쿼리 최적화 | ✅ 구현 | 키워드 조합 + IPC 코드 |
| KIPRIS API 호출 | ✅ 구현 | API 키 설정 시 동작 |
| Mock 데이터 Fallback | ✅ 구현 | API 키 미설정 시 자동 전환 |
| XML 파싱 | ✅ 구현 | 정규식 기반 |
| 관련도 점수 계산 | ✅ 구현 | 100점 만점 (제목/IPC/최신성/상태) |
| 컨텍스트 생성 | ✅ 구현 | 마크다운 형식 |

### 6.4. 출력 데이터 스키마

```json
{
  "submission_id": "INV-xxx",
  "invention_title": "발명의 명칭",
  "prior_art_count": 3,
  "prior_art_context": "# 선행기술 검색 결과\n...",
  "top_patents": [
    {"number": "10-2024-MOCK001", "title": "...", "score": 75}
  ],
  "is_mock_data": true,
  "status": "prior_art_complete"
}
```

---

*문서 버전: 1.1.0*
*작성일: 2026-01-10*
*최종 수정: 2026-01-10 (구현 결과 추가)*
