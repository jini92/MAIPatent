#!/usr/bin/env node
/**
 * MAIPatent 전체 테스트 실행기
 *
 * 모든 단위 테스트 실행 및 리포트 생성
 *
 * 사용법:
 *   node tests/run-all-tests.js [--json] [--save]
 *
 * 옵션:
 *   --json  JSON 형식 출력
 *   --save  결과를 파일로 저장
 */

const fs = require('fs');
const path = require('path');

// 테스트 파일 목록
const TEST_FILES = [
  'unit/input-validation.test.js',
  'unit/kipris-parser.test.js',
  'unit/kipo-format.test.js',
  'unit/validate-script.test.js'
];

// 전체 결과 저장
const allResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  files: []
};

// CLI 인자 파싱
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const saveResults = args.includes('--save');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('           MAIPatent 단위 테스트 실행기 v1.0');
console.log('═══════════════════════════════════════════════════════════');
console.log(`실행 시간: ${allResults.timestamp}`);
console.log('');

// 테스트 러너 상태 초기화
const testRunner = require('./unit/test-runner');

// 각 테스트 파일 실행
TEST_FILES.forEach((testFile, index) => {
  const filePath = path.join(__dirname, testFile);

  console.log(`\n[${ index + 1}/${TEST_FILES.length}] 실행 중: ${testFile}`);
  console.log('───────────────────────────────────────────────────────────');

  // 테스트 러너 상태 백업
  const beforeTotal = testRunner.testResults.total;
  const beforePassed = testRunner.testResults.passed;
  const beforeFailed = testRunner.testResults.failed;

  try {
    // 테스트 파일 실행
    require(filePath);

    // 파일별 결과 계산
    const fileTests = testRunner.testResults.total - beforeTotal;
    const filePassed = testRunner.testResults.passed - beforePassed;
    const fileFailed = testRunner.testResults.failed - beforeFailed;

    allResults.files.push({
      file: testFile,
      tests: fileTests,
      passed: filePassed,
      failed: fileFailed,
      status: fileFailed === 0 ? 'passed' : 'failed'
    });

  } catch (error) {
    console.error(`\n❌ 테스트 파일 로드 실패: ${error.message}`);
    allResults.files.push({
      file: testFile,
      tests: 0,
      passed: 0,
      failed: 0,
      status: 'error',
      error: error.message
    });
  }
});

// 전체 결과 집계
allResults.totalTests = testRunner.testResults.total;
allResults.passed = testRunner.testResults.passed;
allResults.failed = testRunner.testResults.failed;
allResults.skipped = testRunner.testResults.skipped;
allResults.passRate = allResults.totalTests > 0
  ? ((allResults.passed / allResults.totalTests) * 100).toFixed(1) + '%'
  : '0%';

// 결과 출력
console.log('\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('                     📊 테스트 결과 요약');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('파일별 결과:');
console.log('───────────────────────────────────────────────────────────');

allResults.files.forEach(f => {
  const status = f.status === 'passed' ? '✅' : f.status === 'error' ? '⚠️' : '❌';
  console.log(`  ${status} ${f.file}`);
  console.log(`     테스트: ${f.tests}, 통과: ${f.passed}, 실패: ${f.failed}`);
});

console.log('');
console.log('───────────────────────────────────────────────────────────');
console.log('전체 집계:');
console.log(`  📋 총 테스트: ${allResults.totalTests}`);
console.log(`  ✅ 통과: ${allResults.passed}`);
console.log(`  ❌ 실패: ${allResults.failed}`);
console.log(`  ⏭️  스킵: ${allResults.skipped}`);
console.log(`  📈 통과율: ${allResults.passRate}`);
console.log('═══════════════════════════════════════════════════════════');

// 결과 저장
if (saveResults) {
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, `test-report_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  console.log(`\n📄 테스트 결과 저장: ${reportPath}`);
}

// JSON 출력
if (jsonOutput) {
  console.log('\n--- JSON 출력 ---');
  console.log(JSON.stringify(allResults, null, 2));
}

// 종료 코드 설정
const exitCode = allResults.failed > 0 ? 1 : 0;
console.log(`\n테스트 ${exitCode === 0 ? '성공' : '실패'} (exit code: ${exitCode})`);

// 종료는 하지 않음 (스크립트에서 결과 확인용)
// process.exit(exitCode);
