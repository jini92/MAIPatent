/**
 * WF01: Form Trigger 입력 검증 단위 테스트
 *
 * 발명 제안서 입력 데이터 유효성 검증 테스트
 */

const { describe, it, assert } = require('./test-runner');

// ============================================
// 테스트 대상: 입력 검증 로직
// ============================================

/**
 * 발명 제안서 입력 검증 함수 (WF01 Code 노드 로직)
 */
function validateInventionInput(data) {
  const errors = [];
  const warnings = [];

  // 필수 필드 검증
  const requiredFields = ['invention_title', 'technical_field', 'problem_to_solve', 'solution_description'];

  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors.push({ field, message: `${field} is required` });
    }
  });

  // 발명 제목 길이 검증 (10-100자)
  if (data.invention_title) {
    const titleLength = data.invention_title.length;
    if (titleLength < 10) {
      errors.push({ field: 'invention_title', message: 'Title too short (min 10 chars)' });
    }
    if (titleLength > 100) {
      errors.push({ field: 'invention_title', message: 'Title too long (max 100 chars)' });
    }
  }

  // 기술 분야 키워드 추출 검증
  if (data.technical_field) {
    const keywords = data.technical_field.split(/[,\s]+/).filter(k => k.length > 1);
    if (keywords.length < 2) {
      warnings.push({ field: 'technical_field', message: 'Consider adding more keywords' });
    }
  }

  // 해결 수단 최소 길이 검증
  if (data.solution_description && data.solution_description.length < 50) {
    warnings.push({ field: 'solution_description', message: 'Solution description may be too brief' });
  }

  // IPC 코드 형식 검증 (선택)
  if (data.ipc_codes) {
    const ipcPattern = /^[A-H]\d{2}[A-Z]\s*\d+\/\d+$/;
    const codes = Array.isArray(data.ipc_codes) ? data.ipc_codes : [data.ipc_codes];
    codes.forEach(code => {
      if (!ipcPattern.test(code.trim())) {
        warnings.push({ field: 'ipc_codes', message: `Invalid IPC format: ${code}` });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: {
      ...data,
      processed_at: new Date().toISOString()
    }
  };
}

/**
 * 키워드 추출 함수 (WF01 보강 로직)
 */
function extractKeywords(text) {
  if (!text) return [];

  // 불용어 목록
  const stopWords = ['의', '를', '을', '이', '가', '은', '는', '에', '와', '및', '등', '한', '하는', '있는', '위한'];

  // 텍스트 정제 및 키워드 추출
  const words = text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .filter(word => !stopWords.includes(word))
    .map(word => word.toLowerCase());

  // 빈도 계산
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // 상위 키워드 반환
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// ============================================
// 테스트 스위트
// ============================================

describe('WF01: Form Trigger 입력 검증', () => {

  it('유효한 발명 제안서 입력 검증 통과', () => {
    const validInput = {
      invention_title: '인공지능 기반 특허 명세서 자동 생성 시스템',
      technical_field: '인공지능, 자연어처리, 특허 자동화',
      problem_to_solve: '기존 특허 명세서 작성의 높은 비용과 시간 문제',
      solution_description: '대규모 언어 모델을 활용하여 발명 제안서로부터 자동으로 KIPO 규격 특허 명세서를 생성하는 시스템'
    };

    const result = validateInventionInput(validInput);
    assert.strictEqual(result.isValid, true, '유효한 입력이 검증 통과해야 함');
    assert.strictEqual(result.errors.length, 0, '오류가 없어야 함');
  });

  it('필수 필드 누락 시 오류 반환', () => {
    const invalidInput = {
      invention_title: '테스트 발명',
      // technical_field 누락
      problem_to_solve: '',  // 빈 문자열
      solution_description: '해결책 설명'
    };

    const result = validateInventionInput(invalidInput);
    assert.strictEqual(result.isValid, false, '필수 필드 누락 시 검증 실패해야 함');
    assert.ok(result.errors.length >= 2, '최소 2개 오류가 있어야 함');
  });

  it('발명 제목 길이 검증 (최소 10자)', () => {
    const shortTitleInput = {
      invention_title: '짧은제목',  // 4자
      technical_field: '기술분야',
      problem_to_solve: '문제점',
      solution_description: '해결책'
    };

    const result = validateInventionInput(shortTitleInput);
    const titleError = result.errors.find(e => e.field === 'invention_title' && e.message.includes('too short'));
    assert.ok(titleError, '짧은 제목에 대한 오류가 있어야 함');
  });

  it('발명 제목 길이 검증 (최대 100자)', () => {
    const longTitleInput = {
      invention_title: '이것은 매우 긴 발명 제목입니다 '.repeat(10),  // 100자 초과
      technical_field: '기술분야',
      problem_to_solve: '문제점',
      solution_description: '해결책'
    };

    const result = validateInventionInput(longTitleInput);
    const titleError = result.errors.find(e => e.field === 'invention_title' && e.message.includes('too long'));
    assert.ok(titleError, '긴 제목에 대한 오류가 있어야 함');
  });

  it('IPC 코드 형식 검증', () => {
    const inputWithIpc = {
      invention_title: '인공지능 기반 특허 명세서 자동 생성 시스템',
      technical_field: '인공지능',
      problem_to_solve: '문제점 설명입니다',
      solution_description: '해결책 설명이 충분히 길게 작성되어야 합니다. 이것은 테스트를 위한 긴 설명입니다.',
      ipc_codes: ['G06F 40/166', 'INVALID-CODE', 'G06N 3/08']
    };

    const result = validateInventionInput(inputWithIpc);
    const ipcWarning = result.warnings.find(w => w.field === 'ipc_codes' && w.message.includes('INVALID-CODE'));
    assert.ok(ipcWarning, '잘못된 IPC 코드에 대한 경고가 있어야 함');
  });

  it('짧은 해결책 설명에 대한 경고', () => {
    const briefInput = {
      invention_title: '인공지능 기반 특허 명세서 자동 생성',
      technical_field: '인공지능, 자연어처리',
      problem_to_solve: '문제점 설명입니다',
      solution_description: '짧은 해결책'  // 50자 미만
    };

    const result = validateInventionInput(briefInput);
    const warning = result.warnings.find(w => w.field === 'solution_description');
    assert.ok(warning, '짧은 설명에 대한 경고가 있어야 함');
  });

});

describe('WF01: 키워드 추출', () => {

  it('텍스트에서 키워드 추출', () => {
    const text = '인공지능을 이용한 특허 명세서 자동 생성 시스템 및 방법. 본 발명은 인공지능 기술을 활용하여 특허 명세서를 자동으로 생성한다.';
    const keywords = extractKeywords(text);

    assert.ok(keywords.length > 0, '키워드가 추출되어야 함');
    assert.ok(keywords.includes('인공지능'), '"인공지능" 키워드가 포함되어야 함');
    assert.ok(keywords.includes('특허'), '"특허" 키워드가 포함되어야 함');
  });

  it('빈 텍스트 처리', () => {
    const keywords = extractKeywords('');
    assert.strictEqual(keywords.length, 0, '빈 텍스트는 빈 배열 반환');
  });

  it('null 입력 처리', () => {
    const keywords = extractKeywords(null);
    assert.strictEqual(keywords.length, 0, 'null 입력은 빈 배열 반환');
  });

  it('불용어 제거', () => {
    const text = '본 발명의 목적은 시스템을 개선하는 것이다';
    const keywords = extractKeywords(text);

    assert.ok(!keywords.includes('의'), '불용어 "의"가 제거되어야 함');
    assert.ok(!keywords.includes('을'), '불용어 "을"이 제거되어야 함');
  });

  it('최대 10개 키워드 반환', () => {
    const text = '인공지능 기계학습 딥러닝 자연어처리 컴퓨터비전 음성인식 로봇공학 데이터분석 클라우드 블록체인 IoT 빅데이터 보안 암호화 네트워크';
    const keywords = extractKeywords(text);

    assert.ok(keywords.length <= 10, '최대 10개 키워드만 반환');
  });

});

module.exports = { validateInventionInput, extractKeywords };
