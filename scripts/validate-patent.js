/**
 * MAIPatent 특허 명세서 품질 검증 스크립트
 *
 * KIPO 표준 준수 여부 및 용어 일관성 검증
 * n8n Code 노드에서 사용
 *
 * @version 1.0.0
 * @author MAIPatent System
 */

const fs = require('fs');
const path = require('path');

// 검증 결과 구조
class ValidationResult {
  constructor() {
    this.errors = [];      // 필수 수정 항목
    this.warnings = [];    // 권장 수정 항목
    this.info = [];        // 정보성 메시지
    this.passed = true;
  }

  addError(code, message, line = null) {
    this.errors.push({ code, message, line });
    this.passed = false;
  }

  addWarning(code, message, line = null) {
    this.warnings.push({ code, message, line });
  }

  addInfo(code, message) {
    this.info.push({ code, message });
  }

  toJSON() {
    return {
      passed: this.passed,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
    };
  }
}

// 필수 KIPO 섹션
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

// 금지 어구
const FORBIDDEN_PHRASES = [
  { pattern: /완벽한|완벽하게/g, message: '과장 표현 - "효과적인"으로 대체 권장' },
  { pattern: /절대적인|절대로/g, message: '과장 표현 - "실질적인"으로 대체 권장' },
  { pattern: /최고의|가장\s*좋은/g, message: '과장 표현 - "향상된"으로 대체 권장' },
  { pattern: /혁신적인|획기적인/g, message: '과장 표현 - "새로운"으로 대체 권장' },
  { pattern: /무결점|오류\s*없는/g, message: '과장 표현 - "신뢰성 있는"으로 대체 권장' },
  { pattern: /100%\s*정확/g, message: '과장 표현 - "높은 정확도"로 대체 권장' },
  { pattern: /모든\s*상황에서|언제나|항상/g, message: '과장 표현 - "다양한 상황에서"로 대체 권장' }
];

/**
 * KIPO 필수 섹션 검증
 */
function validateRequiredSections(content, result) {
  const missingSections = [];

  REQUIRED_SECTIONS.forEach(section => {
    if (!content.includes(section)) {
      missingSections.push(section);
    }
  });

  if (missingSections.length > 0) {
    result.addError(
      'KIPO-001',
      'Required sections missing: ' + missingSections.join(', ')
    );
  } else {
    result.addInfo('KIPO-001', 'All required sections are present.');
  }
}

/**
 * 금지 어구 검증
 */
function validateForbiddenPhrases(content, result) {
  const lines = content.split('\n');

  FORBIDDEN_PHRASES.forEach(function(item) {
    lines.forEach(function(line, index) {
      const matches = line.match(item.pattern);
      if (matches) {
        result.addWarning(
          'LANG-001',
          item.message + ': "' + matches[0] + '"',
          index + 1
        );
      }
    });
  });
}

/**
 * 전제 기초 (Antecedent Basis) 검증
 */
function validateAntecedentBasis(content, result) {
  const lines = content.split('\n');
  const definedTerms = new Set();
  const sanggiPattern = /상기\s+([가-힣a-zA-Z0-9_]+)/g;

  // 첫 번째 패스: 정의된 용어 수집
  const definitionPattern = /([가-힣a-zA-Z0-9_]+)\s*\(\d+\)/g;
  let match;

  while ((match = definitionPattern.exec(content)) !== null) {
    definedTerms.add(match[1]);
  }

  // 두 번째 패스: "상기" 참조 검증
  lines.forEach(function(line, index) {
    let sanggiMatch;
    const linePattern = /상기\s+([가-힣a-zA-Z0-9_]+)/g;
    while ((sanggiMatch = linePattern.exec(line)) !== null) {
      const term = sanggiMatch[1];
      const commonTerms = ['것', '목적', '방법', '시스템', '구성', '단계'];
      if (!definedTerms.has(term) && commonTerms.indexOf(term) === -1) {
        result.addWarning(
          'BASIS-001',
          'Check antecedent for: "상기 ' + term + '"',
          index + 1
        );
      }
    }
  });
}

/**
 * 도면 부호 일관성 검증
 */
function validateDrawingReferences(content, result) {
  const references = new Map();

  const componentPattern = /([가-힣a-zA-Z_]+)\s*\((\d+)\)/g;

  let match;
  while ((match = componentPattern.exec(content)) !== null) {
    const name = match[1];
    const number = match[2];

    if (!references.has(number)) {
      references.set(number, new Set());
    }
    references.get(number).add(name);
  }

  references.forEach(function(names, number) {
    if (names.size > 1) {
      result.addWarning(
        'REF-001',
        'Multiple names for reference (' + number + '): ' + Array.from(names).join(', ')
      );
    }
  });

  result.addInfo('REF-002', 'Total ' + references.size + ' drawing references used.');
}

/**
 * 청구항 구조 검증
 */
function validateClaims(content, result) {
  const claimPattern = /【청구항\s*(\d+)】/g;
  const claims = [];
  let match;

  while ((match = claimPattern.exec(content)) !== null) {
    claims.push(parseInt(match[1]));
  }

  if (claims.length === 0) {
    result.addError('CLAIM-001', 'No claims found.');
    return;
  }

  for (let i = 0; i < claims.length; i++) {
    if (claims[i] !== i + 1) {
      result.addWarning(
        'CLAIM-002',
        'Claim numbers are not sequential. Expected: ' + (i + 1) + ', Found: ' + claims[i]
      );
    }
  }

  result.addInfo('CLAIM-003', 'Total ' + claims.length + ' claims found.');

  const dependentPattern = /제(\d+)항에\s*있어서/g;
  while ((match = dependentPattern.exec(content)) !== null) {
    const refNum = parseInt(match[1]);
    if (claims.indexOf(refNum) === -1) {
      result.addError(
        'CLAIM-004',
        'Dependent claim references non-existent claim ' + refNum
      );
    }
  }
}

/**
 * 메인 검증 함수
 */
function validatePatentSpec(inputPath) {
  const result = new ValidationResult();

  if (!fs.existsSync(inputPath)) {
    result.addError('SYS-001', 'File not found: ' + inputPath);
    return result.toJSON();
  }

  const content = fs.readFileSync(inputPath, 'utf-8');

  validateRequiredSections(content, result);
  validateForbiddenPhrases(content, result);
  validateAntecedentBasis(content, result);
  validateDrawingReferences(content, result);
  validateClaims(content, result);

  return result.toJSON();
}

/**
 * CLI 메인 함수
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node validate-patent.js <input.md>');
    console.log('');
    console.log('Example:');
    console.log('  node validate-patent.js patent-spec.md');
    process.exit(1);
  }

  const inputPath = args[0];
  const result = validatePatentSpec(inputPath);

  console.log('\n=== Patent Specification Validation Result ===\n');

  if (result.passed) {
    console.log('PASSED\n');
  } else {
    console.log('FAILED\n');
  }

  console.log('Summary: ' + result.summary.errors + ' errors, ' + result.summary.warnings + ' warnings\n');

  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach(function(e) {
      console.log('  [' + e.code + '] ' + e.message + (e.line ? ' (line ' + e.line + ')' : ''));
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    result.warnings.forEach(function(w) {
      console.log('  [' + w.code + '] ' + w.message + (w.line ? ' (line ' + w.line + ')' : ''));
    });
    console.log('');
  }

  if (result.info.length > 0) {
    console.log('Info:');
    result.info.forEach(function(i) {
      console.log('  [' + i.code + '] ' + i.message);
    });
    console.log('');
  }

  if (args.indexOf('--json') !== -1) {
    console.log('\n--- JSON Result ---');
    console.log(JSON.stringify(result, null, 2));
  }

  return result;
}

module.exports = {
  validatePatentSpec: validatePatentSpec,
  ValidationResult: ValidationResult,
  REQUIRED_SECTIONS: REQUIRED_SECTIONS,
  FORBIDDEN_PHRASES: FORBIDDEN_PHRASES
};

if (require.main === module) {
  main();
}
