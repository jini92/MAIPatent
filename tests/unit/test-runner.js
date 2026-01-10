/**
 * MAIPatent 단위 테스트 러너
 *
 * Node.js 내장 assert 모듈 기반 테스트 프레임워크
 *
 * @version 1.0.0
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// 테스트 결과 저장
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  suites: []
};

// 현재 테스트 스위트
let currentSuite = null;

/**
 * 테스트 스위트 정의
 */
function describe(name, fn) {
  currentSuite = {
    name,
    tests: [],
    passed: 0,
    failed: 0
  };
  console.log(`\n📦 ${name}`);
  console.log('─'.repeat(50));

  try {
    fn();
  } catch (error) {
    console.error(`  ❌ Suite error: ${error.message}`);
  }

  testResults.suites.push(currentSuite);
}

/**
 * 개별 테스트 케이스
 */
function it(name, fn) {
  testResults.total++;
  const startTime = Date.now();

  try {
    fn();
    const duration = Date.now() - startTime;
    console.log(`  ✅ ${name} (${duration}ms)`);
    testResults.passed++;
    currentSuite.passed++;
    currentSuite.tests.push({ name, status: 'passed', duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ ${name} (${duration}ms)`);
    console.log(`     └─ ${error.message}`);
    testResults.failed++;
    currentSuite.failed++;
    currentSuite.tests.push({ name, status: 'failed', error: error.message, duration });
    testResults.errors.push({ suite: currentSuite.name, test: name, error: error.message });
  }
}

/**
 * 테스트 스킵
 */
function skip(name, fn) {
  testResults.total++;
  testResults.skipped++;
  console.log(`  ⏭️  ${name} (skipped)`);
  currentSuite.tests.push({ name, status: 'skipped' });
}

/**
 * 테스트 결과 요약 출력
 */
function printSummary() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('📊 테스트 결과 요약');
  console.log('═'.repeat(50));
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`✅ 통과: ${testResults.passed}`);
  console.log(`❌ 실패: ${testResults.failed}`);
  console.log(`⏭️  스킵: ${testResults.skipped}`);
  console.log(`\n통과율: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    testResults.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. [${err.suite}] ${err.test}`);
      console.log(`     → ${err.error}`);
    });
  }

  console.log('\n═'.repeat(50));

  return testResults;
}

/**
 * JSON 결과 저장
 */
function saveResults(outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
    },
    suites: testResults.suites,
    errors: testResults.errors
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 테스트 결과 저장: ${outputPath}`);
}

module.exports = {
  describe,
  it,
  skip,
  assert,
  printSummary,
  saveResults,
  testResults
};
