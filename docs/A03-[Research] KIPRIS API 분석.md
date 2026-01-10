# [Research] KIPRIS API 분석

> **특허정보검색서비스(KIPRIS) Open API 연동 분석**

---

## 1. 개요

KIPRIS(Korea Intellectual Property Rights Information Service)는 한국특허정보원에서 제공하는 특허정보 검색 서비스입니다. 본 문서에서는 MAIPatent 시스템에서 선행기술 검색을 위해 KIPRIS Open API를 연동하는 방법을 분석합니다.

---

## 2. KIPRIS Open API 정보

### 2.1. 기본 정보

| 항목 | 내용 |
|------|------|
| **서비스명** | KIPRIS Open API |
| **제공기관** | 한국특허정보원 |
| **API 형식** | REST API (XML/JSON) |
| **인증방식** | API Key (Service Key) |
| **신청URL** | https://plus.kipris.or.kr/portal/data/service/DBII_000000000000001/view.do |

### 2.2. 주요 API 목록

| API명 | 설명 | 용도 |
|-------|------|------|
| **특허/실용신안 검색** | 키워드 기반 특허 검색 | 선행기술 검색 |
| **IPC 검색** | IPC 코드 기반 검색 | 기술분야 특허 검색 |
| **출원인 검색** | 출원인명 기반 검색 | 경쟁사 특허 분석 |
| **상세정보 조회** | 특허 상세 정보 조회 | 선행기술 분석 |

---

## 3. API 엔드포인트

### 3.1. 특허/실용신안 검색 API

**Endpoint:**
```
GET http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/freeSearchInfo
```

**Parameters:**

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `ServiceKey` | Y | API 인증키 | [발급받은 키] |
| `searchWord` | Y | 검색어 | 인공지능+자동화 |
| `patent` | N | 특허 포함 여부 | true |
| `utility` | N | 실용신안 포함 여부 | true |
| `numOfRows` | N | 결과 개수 | 10 |
| `pageNo` | N | 페이지 번호 | 1 |

**Request Example:**
```
GET http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/freeSearchInfo?ServiceKey={API_KEY}&searchWord=인공지능+특허+자동화&patent=true&numOfRows=10
```

**Response Example (XML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <applicationNumber>10-2024-0123456</applicationNumber>
        <inventionTitle>인공지능을 이용한 특허 명세서 자동 생성 시스템</inventionTitle>
        <applicantName>홍길동</applicantName>
        <ipcCode>G06F 40/166</ipcCode>
        <applicationDate>20240115</applicationDate>
        <registerStatus>등록</registerStatus>
      </item>
    </items>
    <totalCount>150</totalCount>
  </body>
</response>
```

### 3.2. IPC 분류 검색 API

**Endpoint:**
```
GET http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/ipcSearchInfo
```

**Parameters:**

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `ServiceKey` | Y | API 인증키 | [발급받은 키] |
| `ipcNumber` | Y | IPC 분류코드 | G06F |
| `numOfRows` | N | 결과 개수 | 10 |

### 3.3. 특허 상세정보 조회 API

**Endpoint:**
```
GET http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/applicationNumberInfo
```

**Parameters:**

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `ServiceKey` | Y | API 인증키 |
| `applicationNumber` | Y | 출원번호 |

---

## 4. n8n 연동 설계

### 4.1. HTTP Request 노드 설정

```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "GET",
    "url": "http://plus.kipris.or.kr/openapi/rest/patUtiModInfoSearchSevice/freeSearchInfo",
    "authentication": "none",
    "queryParameters": {
      "ServiceKey": "={{$env.KIPRIS_API_KEY}}",
      "searchWord": "={{$json.keywords}}",
      "patent": "true",
      "numOfRows": "20"
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "xml"
        }
      }
    }
  }
}
```

### 4.2. 응답 파싱 (Code 노드)

```javascript
// KIPRIS API 응답 파싱
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

const xmlResponse = $input.first().json.data;
const result = await parser.parseStringPromise(xmlResponse);

const items = result.response.body[0].items[0].item || [];

const patents = items.map(item => ({
  applicationNumber: item.applicationNumber[0],
  title: item.inventionTitle[0],
  applicant: item.applicantName[0],
  ipcCode: item.ipcCode[0],
  applicationDate: item.applicationDate[0],
  status: item.registerStatus[0]
}));

return patents.map(p => ({ json: p }));
```

### 4.3. 선행기술 요약 생성

검색된 특허 목록을 Claude Code에 전달할 컨텍스트로 변환:

```javascript
// 선행기술 요약 생성
const patents = $input.all().map(item => item.json);

const priorArtSummary = patents.map((p, i) => `
## 선행기술 ${i + 1}
- **출원번호**: ${p.applicationNumber}
- **발명의 명칭**: ${p.title}
- **출원인**: ${p.applicant}
- **IPC 분류**: ${p.ipcCode}
- **출원일**: ${p.applicationDate}
- **상태**: ${p.status}
`).join('\n');

return [{
  json: {
    priorArtSummary,
    patentCount: patents.length,
    searchKeywords: $input.first().json.searchKeywords
  }
}];
```

---

## 5. 검색 전략

### 5.1. 키워드 추출 알고리즘

```javascript
// 발명 제안서에서 검색 키워드 추출
function extractKeywords(invention) {
  const title = invention.title;
  const technicalField = invention.technical_field;
  const problem = invention.background.problem;

  // 불용어 제거
  const stopWords = ['및', '또는', '의', '을', '를', '이', '가', '은', '는'];

  // 키워드 추출
  const allText = `${title} ${technicalField} ${problem}`;
  const words = allText.split(/\s+/);

  const keywords = words
    .filter(word => word.length > 1)
    .filter(word => !stopWords.includes(word))
    .slice(0, 5); // 상위 5개 키워드

  return keywords.join('+');
}
```

### 5.2. 검색 우선순위

1. **1차 검색**: 발명 제목 기반 키워드 검색
2. **2차 검색**: IPC 코드 기반 기술분야 검색
3. **3차 검색**: 출원인/경쟁사 기반 검색 (선택)

### 5.3. 결과 필터링

```javascript
// 관련도 점수 계산
function calculateRelevance(patent, invention) {
  let score = 0;

  // 제목 유사도
  if (patent.title.includes(invention.title)) score += 30;

  // IPC 코드 일치
  if (invention.ipc_codes.includes(patent.ipcCode)) score += 40;

  // 최신성 (최근 5년)
  const patentYear = parseInt(patent.applicationDate.substring(0, 4));
  if (patentYear >= 2021) score += 20;

  // 등록 상태
  if (patent.status === '등록') score += 10;

  return score;
}
```

---

## 6. 에러 처리

### 6.1. API 에러 코드

| 코드 | 설명 | 대응 |
|------|------|------|
| `00` | 정상 | - |
| `01` | 필수 파라미터 누락 | 파라미터 검증 |
| `02` | 인증 실패 | API 키 확인 |
| `03` | 일일 호출 한도 초과 | 대기 후 재시도 |
| `99` | 서버 오류 | 재시도 또는 대체 API |

### 6.2. n8n 에러 핸들링

```javascript
// Error Trigger 노드에서 처리
const error = $input.first().json;

if (error.code === '03') {
  // 호출 한도 초과 - 1시간 대기
  return [{
    json: {
      action: 'wait',
      waitTime: 3600,
      message: 'KIPRIS API 일일 호출 한도 초과'
    }
  }];
} else if (error.code === '99') {
  // 서버 오류 - Google Patents 대체
  return [{
    json: {
      action: 'fallback',
      fallbackAPI: 'google_patents'
    }
  }];
}
```

---

## 7. API 키 관리

### 7.1. 환경 변수 설정

```bash
# n8n 환경 변수
KIPRIS_API_KEY=your-kipris-api-key-here
```

### 7.2. n8n Credentials 설정

1. n8n Settings → Credentials 이동
2. "HTTP Header Auth" 생성
3. Header Name: `ServiceKey`
4. Header Value: `[KIPRIS API Key]`

---

## 8. 대체 API (Fallback)

### 8.1. Google Patents Public Data

KIPRIS API 장애 시 대체 데이터소스:

```
GET https://patents.google.com/api/search
```

### 8.2. WIPO PatentScope

국제 특허 검색 시:

```
GET https://patentscope.wipo.int/search/api
```

---

## 9. 성능 최적화

### 9.1. 캐싱 전략

- 동일 키워드 검색 결과 24시간 캐싱
- IPC 코드별 검색 결과 캐싱
- Google Sheets를 캐시 저장소로 활용

### 9.2. 배치 처리

```javascript
// 여러 키워드 병렬 검색
const keywords = ['키워드1', '키워드2', '키워드3'];

const searchPromises = keywords.map(keyword =>
  $http.get({
    url: `${KIPRIS_BASE_URL}?ServiceKey=${API_KEY}&searchWord=${keyword}`
  })
);

const results = await Promise.all(searchPromises);
```

---

## 10. API 신청 절차

1. **KIPRIS Plus 회원가입**: https://plus.kipris.or.kr
2. **데이터 서비스 신청**: 마이페이지 → 데이터서비스 → Open API 신청
3. **API 키 발급**: 승인 후 이메일로 API 키 수신 (1-3일 소요)
4. **일일 호출 한도**: 기본 1,000회/일

---

*문서 버전: 1.0.0*
*작성일: 2026-01-10*
