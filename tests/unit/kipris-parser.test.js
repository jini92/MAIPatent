/**
 * WF02: KIPRIS API 응답 파싱 단위 테스트
 *
 * 선행기술 검색 응답 데이터 파싱 및 처리 테스트
 */

const { describe, it, assert } = require('./test-runner');

// ============================================
// 테스트 대상: KIPRIS XML 파싱 로직
// ============================================

/**
 * KIPRIS XML 응답 파싱 함수 (WF02 Code 노드 로직)
 */
function parseKiprisXmlResponse(xmlString) {
  // 간단한 XML 파싱 (실제로는 xml2js 등 사용)
  const results = [];

  if (!xmlString || xmlString.trim() === '') {
    return { success: false, error: 'Empty XML response', results: [] };
  }

  // <item> 태그 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemXml = match[1];

    const item = {
      applicationNumber: extractTag(itemXml, 'applicationNumber'),
      inventionTitle: extractTag(itemXml, 'inventionTitle'),
      applicantName: extractTag(itemXml, 'applicantName'),
      applicationDate: extractTag(itemXml, 'applicationDate'),
      ipcCode: extractTag(itemXml, 'ipcCode'),
      abstract: extractTag(itemXml, 'abstract')
    };

    results.push(item);
  }

  return {
    success: true,
    count: results.length,
    results
  };
}

/**
 * XML 태그 값 추출 헬퍼
 */
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * 선행기술 관련도 점수 계산
 */
function calculateRelevanceScore(priorArt, keywords) {
  if (!priorArt || !keywords || keywords.length === 0) {
    return 0;
  }

  let score = 0;
  const searchText = `${priorArt.inventionTitle} ${priorArt.abstract}`.toLowerCase();

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    // 제목에서 발견 시 높은 점수
    if (priorArt.inventionTitle && priorArt.inventionTitle.toLowerCase().includes(keywordLower)) {
      score += 3;
    }
    // 초록에서 발견 시 중간 점수
    if (priorArt.abstract && priorArt.abstract.toLowerCase().includes(keywordLower)) {
      score += 1;
    }
  });

  // 정규화 (0-100)
  const maxScore = keywords.length * 4;  // 최대 점수: 키워드당 4점
  return Math.min(100, Math.round((score / maxScore) * 100));
}

/**
 * 선행기술 요약 생성
 */
function summarizePriorArt(results, topN = 5) {
  if (!results || results.length === 0) {
    return {
      totalFound: 0,
      topResults: [],
      summary: '관련 선행기술을 찾지 못했습니다.'
    };
  }

  const topResults = results.slice(0, topN);

  return {
    totalFound: results.length,
    topResults: topResults.map(r => ({
      title: r.inventionTitle,
      applicationNumber: r.applicationNumber,
      date: r.applicationDate
    })),
    summary: `총 ${results.length}건의 선행기술이 검색되었습니다. 상위 ${topResults.length}건을 분석합니다.`
  };
}

// ============================================
// 테스트 스위트
// ============================================

describe('WF02: KIPRIS XML 응답 파싱', () => {

  it('유효한 XML 응답 파싱', () => {
    const mockXml = `
      <response>
        <body>
          <items>
            <item>
              <applicationNumber>10-2023-0001234</applicationNumber>
              <inventionTitle>인공지능 기반 문서 분석 시스템</inventionTitle>
              <applicantName>테스트 주식회사</applicantName>
              <applicationDate>20230315</applicationDate>
              <ipcCode>G06F 40/166</ipcCode>
              <abstract>본 발명은 인공지능을 이용한 문서 분석에 관한 것이다.</abstract>
            </item>
            <item>
              <applicationNumber>10-2022-0009876</applicationNumber>
              <inventionTitle>자연어 처리 장치 및 방법</inventionTitle>
              <applicantName>샘플 회사</applicantName>
              <applicationDate>20220520</applicationDate>
              <ipcCode>G06N 3/08</ipcCode>
              <abstract>자연어 처리를 위한 장치에 관한 것이다.</abstract>
            </item>
          </items>
        </body>
      </response>
    `;

    const result = parseKiprisXmlResponse(mockXml);

    assert.strictEqual(result.success, true, '파싱 성공해야 함');
    assert.strictEqual(result.count, 2, '2개 항목 추출');
    assert.strictEqual(result.results[0].applicationNumber, '10-2023-0001234');
    assert.strictEqual(result.results[0].inventionTitle, '인공지능 기반 문서 분석 시스템');
  });

  it('빈 XML 응답 처리', () => {
    const result = parseKiprisXmlResponse('');

    assert.strictEqual(result.success, false, '빈 응답은 실패 처리');
    assert.strictEqual(result.results.length, 0, '결과 없음');
  });

  it('null XML 응답 처리', () => {
    const result = parseKiprisXmlResponse(null);

    assert.strictEqual(result.success, false, 'null 응답은 실패 처리');
  });

  it('항목 없는 XML 응답 처리', () => {
    const emptyXml = '<response><body><items></items></body></response>';
    const result = parseKiprisXmlResponse(emptyXml);

    assert.strictEqual(result.success, true, '빈 결과도 성공');
    assert.strictEqual(result.count, 0, '0개 항목');
  });

});

describe('WF02: 관련도 점수 계산', () => {

  it('키워드 매칭 점수 계산', () => {
    const priorArt = {
      inventionTitle: '인공지능 기반 특허 분석 시스템',
      abstract: '본 발명은 인공지능과 자연어처리를 활용하여 특허 문서를 분석한다.'
    };
    const keywords = ['인공지능', '특허', '분석'];

    const score = calculateRelevanceScore(priorArt, keywords);

    assert.ok(score > 0, '점수가 0보다 커야 함');
    assert.ok(score <= 100, '점수가 100 이하여야 함');
  });

  it('키워드 미매칭 시 낮은 점수', () => {
    const priorArt = {
      inventionTitle: '자동차 엔진 설계',
      abstract: '내연기관 효율 향상에 관한 것이다.'
    };
    const keywords = ['인공지능', '특허', '자연어처리'];

    const score = calculateRelevanceScore(priorArt, keywords);

    assert.strictEqual(score, 0, '매칭 없으면 0점');
  });

  it('빈 키워드 배열 처리', () => {
    const priorArt = { inventionTitle: 'Test', abstract: 'Test' };
    const score = calculateRelevanceScore(priorArt, []);

    assert.strictEqual(score, 0, '키워드 없으면 0점');
  });

  it('null 입력 처리', () => {
    const score = calculateRelevanceScore(null, ['키워드']);

    assert.strictEqual(score, 0, 'null 입력은 0점');
  });

});

describe('WF02: 선행기술 요약 생성', () => {

  it('검색 결과 요약 생성', () => {
    const results = [
      { inventionTitle: '발명1', applicationNumber: '10-2023-0001', applicationDate: '20230101' },
      { inventionTitle: '발명2', applicationNumber: '10-2023-0002', applicationDate: '20230201' },
      { inventionTitle: '발명3', applicationNumber: '10-2023-0003', applicationDate: '20230301' }
    ];

    const summary = summarizePriorArt(results, 2);

    assert.strictEqual(summary.totalFound, 3, '총 3건');
    assert.strictEqual(summary.topResults.length, 2, '상위 2건만');
    assert.ok(summary.summary.includes('3건'), '요약에 총 건수 포함');
  });

  it('빈 결과 요약', () => {
    const summary = summarizePriorArt([]);

    assert.strictEqual(summary.totalFound, 0, '0건');
    assert.ok(summary.summary.includes('찾지 못했습니다'), '빈 결과 메시지');
  });

  it('null 결과 처리', () => {
    const summary = summarizePriorArt(null);

    assert.strictEqual(summary.totalFound, 0, 'null은 0건');
  });

});

module.exports = { parseKiprisXmlResponse, calculateRelevanceScore, summarizePriorArt };
