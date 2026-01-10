/**
 * Phase 3: validate-patent.js 스크립트 단위 테스트
 *
 * 명세서 검증 스크립트 기능 테스트
 */

const { describe, it, assert } = require('./test-runner');
const path = require('path');
const fs = require('fs');

// ============================================
// 테스트 대상: 명세서 검증 스크립트 로직
// ============================================

/**
 * 통합 검증 함수 (validate-patent.js 핵심 로직)
 */
function validatePatentSpec(content) {
  const result = {
    errors: [],
    warnings: [],
    info: [],
    valid: true
  };

  // 1. KIPO 필수 섹션 검증
  const requiredSections = [
    '【발명의 명칭】', '【기술분야】', '【배경기술】',
    '【해결하려는 과제】', '【과제의 해결 수단】', '【발명의 효과】',
    '【도면의 간단한 설명】', '【발명을 실시하기 위한 구체적인 내용】',
    '【특허청구범위】', '【요약서】'
  ];

  const missingSections = requiredSections.filter(s => !content.includes(s));
  if (missingSections.length > 0) {
    missingSections.forEach(s => {
      result.errors.push({ code: 'KIPO-001', message: `Missing section: ${s}` });
    });
    result.valid = false;
  } else {
    result.info.push({ code: 'KIPO-001', message: 'All required sections are present.' });
  }

  // 2. 금지 어구 검증
  const forbiddenPhrases = ['완벽한', '절대적인', '최고의', '혁신적인', '획기적인'];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    forbiddenPhrases.forEach(phrase => {
      if (line.includes(phrase)) {
        result.warnings.push({
          code: 'LANG-001',
          message: `Forbidden phrase "${phrase}" (line ${index + 1})`
        });
      }
    });
  });

  // 3. 청구항 검증
  const claimPattern = /【청구항\s*(\d+)】/g;
  const claims = [];
  let match;
  while ((match = claimPattern.exec(content)) !== null) {
    claims.push(parseInt(match[1]));
  }

  if (claims.length === 0) {
    result.errors.push({ code: 'CLAIM-001', message: 'No claims found' });
    result.valid = false;
  } else {
    result.info.push({ code: 'CLAIM-003', message: `Total ${claims.length} claims found.` });
  }

  // 4. 도면 부호 검증
  const refPattern = /\((\d+|S\d+)\)/g;
  const refs = new Set();
  while ((match = refPattern.exec(content)) !== null) {
    refs.add(match[1]);
  }
  result.info.push({ code: 'REF-002', message: `Total ${refs.size} drawing references used.` });

  // 5. 전제 기초 검증
  const antecedentPattern = /상기\s+([가-힣]+)/g;
  while ((match = antecedentPattern.exec(content)) !== null) {
    const term = match[1];
    if (term.length > 1) {
      // 간단한 경고 (정의 확인 필요)
      result.warnings.push({
        code: 'BASIS-001',
        message: `Check antecedent for: "상기 ${term}"`
      });
    }
  }

  return result;
}

/**
 * 검증 결과 포맷팅
 */
function formatValidationResult(result) {
  const lines = [];

  lines.push('=== Patent Specification Validation Result ===');
  lines.push('');
  lines.push(result.valid ? 'PASSED' : 'FAILED');
  lines.push('');
  lines.push(`Summary: ${result.errors.length} errors, ${result.warnings.length} warnings`);

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    result.errors.forEach(e => {
      lines.push(`  [${e.code}] ${e.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    result.warnings.forEach(w => {
      lines.push(`  [${w.code}] ${w.message}`);
    });
  }

  if (result.info.length > 0) {
    lines.push('');
    lines.push('Info:');
    result.info.forEach(i => {
      lines.push(`  [${i.code}] ${i.message}`);
    });
  }

  return lines.join('\n');
}

/**
 * JSON 출력 생성
 */
function toJsonOutput(result, inputPath) {
  return {
    file: inputPath,
    timestamp: new Date().toISOString(),
    valid: result.valid,
    summary: {
      errors: result.errors.length,
      warnings: result.warnings.length,
      info: result.info.length
    },
    details: {
      errors: result.errors,
      warnings: result.warnings,
      info: result.info
    }
  };
}

// ============================================
// 테스트 스위트
// ============================================

describe('명세서 검증 스크립트: 통합 검증', () => {

  it('유효한 명세서 검증 통과', () => {
    const validSpec = `
【발명의 명칭】테스트 발명 시스템 및 방법

【기술분야】
본 발명은 테스트 시스템에 관한 것이다.

【배경기술】
종래의 기술은 문제점이 있다.

【해결하려는 과제】
본 발명은 상기 문제점을 해결하고자 한다.

【과제의 해결 수단】
상기 목적을 달성하기 위해 본 발명은 테스트 시스템을 제공한다.

【발명의 효과】
본 발명에 따르면 효과가 있다.

【도면의 간단한 설명】
도 1은 본 발명의 시스템(100)을 나타낸다.

【발명을 실시하기 위한 구체적인 내용】
본 발명의 시스템(100)은 모듈(110)을 포함한다.

【특허청구범위】

【청구항 1】
테스트 시스템에 있어서,
모듈을 포함하는 것을 특징으로 하는 시스템.

【청구항 2】
제1항에 있어서,
상기 모듈은 추가 기능을 수행하는 것을 특징으로 하는 시스템.

【요약서】
본 발명은 테스트 시스템에 관한 것이다.
    `;

    const result = validatePatentSpec(validSpec);

    assert.strictEqual(result.valid, true, '유효한 명세서 통과');
    assert.strictEqual(result.errors.length, 0, '오류 없음');
  });

  it('필수 섹션 누락 시 실패', () => {
    const incompleteSpec = `
【발명의 명칭】불완전한 발명

【기술분야】
테스트입니다.
    `;

    const result = validatePatentSpec(incompleteSpec);

    assert.strictEqual(result.valid, false, '불완전 명세서 실패');
    assert.ok(result.errors.length > 0, '오류 있음');
    assert.ok(result.errors.some(e => e.code === 'KIPO-001'), 'KIPO-001 오류');
  });

  it('청구항 누락 시 실패', () => {
    const noClaimsSpec = `
【발명의 명칭】테스트
【기술분야】테스트
【배경기술】테스트
【해결하려는 과제】테스트
【과제의 해결 수단】테스트
【발명의 효과】테스트
【도면의 간단한 설명】테스트
【발명을 실시하기 위한 구체적인 내용】테스트
【특허청구범위】
청구항 내용 없음
【요약서】테스트
    `;

    const result = validatePatentSpec(noClaimsSpec);

    assert.strictEqual(result.valid, false, '청구항 없으면 실패');
    assert.ok(result.errors.some(e => e.code === 'CLAIM-001'), 'CLAIM-001 오류');
  });

  it('금지 어구 경고', () => {
    const badPhraseSpec = `
【발명의 명칭】혁신적인 발명
【기술분야】본 발명은 완벽한 시스템이다.
【배경기술】종래 기술
【해결하려는 과제】문제 해결
【과제의 해결 수단】해결 수단
【발명의 효과】효과
【도면의 간단한 설명】도면 설명
【발명을 실시하기 위한 구체적인 내용】상세 설명
【특허청구범위】
【청구항 1】청구항 내용
【요약서】요약
    `;

    const result = validatePatentSpec(badPhraseSpec);

    assert.ok(result.warnings.some(w => w.code === 'LANG-001'), '금지 어구 경고');
  });

});

describe('명세서 검증 스크립트: 결과 포맷팅', () => {

  it('검증 결과 텍스트 포맷', () => {
    const result = {
      valid: true,
      errors: [],
      warnings: [{ code: 'LANG-001', message: 'Test warning' }],
      info: [{ code: 'KIPO-001', message: 'Test info' }]
    };

    const formatted = formatValidationResult(result);

    assert.ok(formatted.includes('PASSED'), 'PASSED 포함');
    assert.ok(formatted.includes('0 errors'), '0 errors 포함');
    assert.ok(formatted.includes('1 warnings'), '1 warnings 포함');
    assert.ok(formatted.includes('Warnings:'), 'Warnings 섹션 포함');
    assert.ok(formatted.includes('Info:'), 'Info 섹션 포함');
  });

  it('실패 결과 포맷', () => {
    const result = {
      valid: false,
      errors: [{ code: 'KIPO-001', message: 'Missing section' }],
      warnings: [],
      info: []
    };

    const formatted = formatValidationResult(result);

    assert.ok(formatted.includes('FAILED'), 'FAILED 포함');
    assert.ok(formatted.includes('Errors:'), 'Errors 섹션 포함');
  });

});

describe('명세서 검증 스크립트: JSON 출력', () => {

  it('JSON 출력 구조', () => {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      info: [{ code: 'TEST', message: 'Test' }]
    };

    const json = toJsonOutput(result, 'test.md');

    assert.strictEqual(json.file, 'test.md', '파일명 포함');
    assert.ok(json.timestamp, '타임스탬프 포함');
    assert.strictEqual(json.valid, true, '유효성 포함');
    assert.strictEqual(json.summary.errors, 0, '오류 수 포함');
    assert.strictEqual(json.summary.warnings, 0, '경고 수 포함');
  });

});

// ============================================
// 실제 샘플 파일 테스트
// ============================================

describe('명세서 검증 스크립트: 실제 파일 테스트', () => {

  it('샘플 명세서 파일 검증', () => {
    const samplePath = path.join(__dirname, '../../tests/sample-patent-spec.md');

    // 파일 존재 확인
    if (fs.existsSync(samplePath)) {
      const content = fs.readFileSync(samplePath, 'utf-8');
      const result = validatePatentSpec(content);

      assert.strictEqual(result.valid, true, '샘플 명세서 검증 통과');
      assert.ok(result.info.some(i => i.code === 'CLAIM-003'), '청구항 정보 포함');
    } else {
      // 파일 없으면 스킵
      console.log('    ⏭️  샘플 파일 없음 - 스킵');
    }
  });

});

module.exports = { validatePatentSpec, formatValidationResult, toJsonOutput };
