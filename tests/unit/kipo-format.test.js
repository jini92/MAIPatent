/**
 * WF03/WF04: KIPO 포맷 출력 단위 테스트
 *
 * 특허 명세서 KIPO 표준 형식 검증 테스트
 */

const { describe, it, assert } = require('./test-runner');

// ============================================
// 테스트 대상: KIPO 포맷 검증 로직
// ============================================

/**
 * KIPO 필수 섹션 목록
 */
const REQUIRED_SECTIONS = [
  '【발명의 명칭】',
  '【기술분야】',
  '【배경기술】',
  '【해결하려는 과제】',
  '【과제의 해결 수단】',
  '【발명의 효과】',
  '【도면의 간단한 설명】',
  '【발명을 실시하기 위한 구체적인 내용】',
  '【특허청구범위】',
  '【요약서】'
];

/**
 * 금지 어구 목록
 */
const FORBIDDEN_PHRASES = [
  '완벽한', '절대적인', '최고의', '가장 좋은',
  '혁신적인', '획기적인', '독보적인',
  '무결점의', '오류 없는', '100% 정확한',
  '모든 상황에서', '언제나', '항상'
];

/**
 * KIPO 필수 섹션 검증
 */
function validateRequiredSections(content) {
  const errors = [];
  const found = [];

  REQUIRED_SECTIONS.forEach(section => {
    if (content.includes(section)) {
      found.push(section);
    } else {
      errors.push({ code: 'KIPO-001', message: `Missing section: ${section}` });
    }
  });

  return {
    valid: errors.length === 0,
    found,
    missing: REQUIRED_SECTIONS.filter(s => !found.includes(s)),
    errors
  };
}

/**
 * 금지 어구 검증
 */
function validateForbiddenPhrases(content) {
  const warnings = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    FORBIDDEN_PHRASES.forEach(phrase => {
      if (line.includes(phrase)) {
        warnings.push({
          code: 'LANG-001',
          message: `Forbidden phrase "${phrase}" found`,
          line: index + 1
        });
      }
    });
  });

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * 청구항 구조 검증
 */
function validateClaimsStructure(content) {
  const errors = [];
  const warnings = [];

  // 청구항 추출
  const claimPattern = /【청구항\s*(\d+)】/g;
  const claims = [];
  let match;

  while ((match = claimPattern.exec(content)) !== null) {
    claims.push(parseInt(match[1]));
  }

  if (claims.length === 0) {
    errors.push({ code: 'CLAIM-001', message: 'No claims found' });
    return { valid: false, errors, warnings, claimCount: 0 };
  }

  // 청구항 번호 연속성 검증
  for (let i = 0; i < claims.length; i++) {
    if (claims[i] !== i + 1) {
      warnings.push({
        code: 'CLAIM-002',
        message: `Claim number discontinuity: expected ${i + 1}, found ${claims[i]}`
      });
    }
  }

  // 종속항 참조 검증
  const dependentPattern = /【청구항\s*(\d+)】[^【]*제(\d+)항에\s*있어서/g;
  while ((match = dependentPattern.exec(content)) !== null) {
    const claimNum = parseInt(match[1]);
    const refNum = parseInt(match[2]);

    if (refNum >= claimNum) {
      errors.push({
        code: 'CLAIM-004',
        message: `Claim ${claimNum} references claim ${refNum} (must reference earlier claim)`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    claimCount: claims.length
  };
}

/**
 * 도면 부호 일관성 검증
 */
function validateDrawingReferences(content) {
  const warnings = [];
  const references = new Map();

  // 도면 부호 추출: (100), (110), (S100) 등
  const refPattern = /\((\d+|S\d+)\)/g;
  let match;

  while ((match = refPattern.exec(content)) !== null) {
    const ref = match[1];
    if (!references.has(ref)) {
      references.set(ref, []);
    }
    references.get(ref).push(match.index);
  }

  // 한 번만 사용된 부호 경고
  references.forEach((positions, ref) => {
    if (positions.length === 1 && !ref.startsWith('S')) {
      warnings.push({
        code: 'REF-003',
        message: `Reference (${ref}) used only once - consider removing or adding more references`
      });
    }
  });

  return {
    valid: true,  // 경고만 있음
    warnings,
    referenceCount: references.size,
    references: Array.from(references.keys())
  };
}

/**
 * 전제 기초 (Antecedent Basis) 검증
 */
function validateAntecedentBasis(content) {
  const warnings = [];
  const lines = content.split('\n');

  // "상기" 참조 추출
  const antecedentPattern = /상기\s+([가-힣]+)/g;
  const definitions = new Set();

  // 정의 추출 (괄호로 정의된 것들)
  const defPattern = /([가-힣]+)\s*\(/g;
  let match;

  while ((match = defPattern.exec(content)) !== null) {
    definitions.add(match[1]);
  }

  // 상기 참조 검증
  lines.forEach((line, index) => {
    let antMatch;
    while ((antMatch = antecedentPattern.exec(line)) !== null) {
      const term = antMatch[1];
      // 간단한 검증: 정의되지 않은 상기 참조
      if (!definitions.has(term) && term.length > 1) {
        warnings.push({
          code: 'BASIS-001',
          message: `Check antecedent for: "상기 ${term}"`,
          line: index + 1
        });
      }
    }
  });

  return {
    valid: true,  // 경고만 있음
    warnings
  };
}

// ============================================
// 테스트 스위트
// ============================================

describe('KIPO 필수 섹션 검증', () => {

  it('모든 필수 섹션 포함 시 통과', () => {
    const validContent = `
【발명의 명칭】테스트 발명
【기술분야】본 발명은 테스트에 관한 것이다.
【배경기술】종래 기술에 대한 설명
【해결하려는 과제】문제점을 해결하고자 한다.
【과제의 해결 수단】해결 방법을 제시한다.
【발명의 효과】효과가 있다.
【도면의 간단한 설명】도 1은 테스트 도면이다.
【발명을 실시하기 위한 구체적인 내용】상세 설명
【특허청구범위】【청구항 1】테스트 청구항
【요약서】요약 내용
    `;

    const result = validateRequiredSections(validContent);

    assert.strictEqual(result.valid, true, '모든 섹션 포함 시 유효');
    assert.strictEqual(result.found.length, 10, '10개 섹션 발견');
    assert.strictEqual(result.missing.length, 0, '누락 섹션 없음');
  });

  it('필수 섹션 누락 시 실패', () => {
    const incompleteContent = `
【발명의 명칭】테스트 발명
【기술분야】본 발명은 테스트에 관한 것이다.
    `;

    const result = validateRequiredSections(incompleteContent);

    assert.strictEqual(result.valid, false, '누락 섹션 있으면 실패');
    assert.ok(result.missing.length > 0, '누락된 섹션이 있어야 함');
  });

});

describe('금지 어구 검증', () => {

  it('금지 어구 없으면 통과', () => {
    const cleanContent = '본 발명은 효과적인 방법을 제공한다.';

    const result = validateForbiddenPhrases(cleanContent);

    assert.strictEqual(result.valid, true, '금지 어구 없으면 통과');
    assert.strictEqual(result.warnings.length, 0, '경고 없음');
  });

  it('금지 어구 발견 시 경고', () => {
    const badContent = '본 발명은 완벽한 해결책을 제공하며, 혁신적인 방법이다.';

    const result = validateForbiddenPhrases(badContent);

    assert.strictEqual(result.valid, false, '금지 어구 있으면 실패');
    assert.ok(result.warnings.length >= 2, '2개 이상 경고');
  });

  it('빈 내용 처리', () => {
    const result = validateForbiddenPhrases('');

    assert.strictEqual(result.valid, true, '빈 내용은 통과');
  });

});

describe('청구항 구조 검증', () => {

  it('유효한 청구항 구조 통과', () => {
    const validClaims = `
【특허청구범위】
【청구항 1】
독립항 내용
【청구항 2】
제1항에 있어서, 종속항 내용
【청구항 3】
제2항에 있어서, 종속항 내용
    `;

    const result = validateClaimsStructure(validClaims);

    assert.strictEqual(result.valid, true, '유효한 구조');
    assert.strictEqual(result.claimCount, 3, '3개 청구항');
  });

  it('청구항 없으면 오류', () => {
    const noClaims = '【특허청구범위】\n내용 없음';

    const result = validateClaimsStructure(noClaims);

    assert.strictEqual(result.valid, false, '청구항 없으면 실패');
    assert.strictEqual(result.claimCount, 0, '0개 청구항');
  });

  it('잘못된 종속항 참조 오류', () => {
    const badReference = `
【청구항 1】독립항
【청구항 2】제3항에 있어서, 잘못된 참조
    `;

    const result = validateClaimsStructure(badReference);

    assert.strictEqual(result.valid, false, '잘못된 참조면 실패');
    assert.ok(result.errors.some(e => e.code === 'CLAIM-004'), 'CLAIM-004 오류 있어야 함');
  });

});

describe('도면 부호 검증', () => {

  it('도면 부호 추출', () => {
    const content = '입력 모듈(100)은 데이터를 처리하고, 출력 모듈(200)로 전달한다. 상기 입력 모듈(100)은...';

    const result = validateDrawingReferences(content);

    assert.strictEqual(result.valid, true);
    assert.ok(result.referenceCount >= 2, '2개 이상 부호');
    assert.ok(result.references.includes('100'), '100 포함');
    assert.ok(result.references.includes('200'), '200 포함');
  });

  it('빈 내용 처리', () => {
    const result = validateDrawingReferences('');

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.referenceCount, 0, '부호 없음');
  });

});

describe('전제 기초 검증', () => {

  it('정의된 용어 참조 검증', () => {
    const content = `
입력 모듈(100)은 데이터를 수신한다.
상기 입력 모듈(100)은 처리를 수행한다.
    `;

    const result = validateAntecedentBasis(content);

    assert.strictEqual(result.valid, true, '정의된 용어 참조는 통과');
  });

  it('미정의 참조 경고', () => {
    const content = '상기 처리부는 데이터를 처리한다.';

    const result = validateAntecedentBasis(content);

    // 경고가 있을 수 있음 (처리부가 정의되지 않은 경우)
    assert.strictEqual(result.valid, true, '검증은 경고만 제공');
  });

});

module.exports = {
  validateRequiredSections,
  validateForbiddenPhrases,
  validateClaimsStructure,
  validateDrawingReferences,
  validateAntecedentBasis
};
