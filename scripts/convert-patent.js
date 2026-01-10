/**
 * MAIPatent 특허 명세서 변환 스크립트
 *
 * 마크다운 특허 명세서를 DOCX/PDF로 변환
 * n8n Execute Command 노드에서 사용
 *
 * @version 1.0.0
 * @author MAIPatent System
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  outputDir: path.join(__dirname, '..', 'output'),
  templatesDir: path.join(__dirname, '..', 'templates'),
  defaultFont: 'Malgun Gothic',
  pageMargin: '2.5cm'
};

/**
 * KIPO 식별 기호 포맷팅
 * 【】 기호가 올바르게 변환되도록 전처리
 */
function preprocessKipoMarkers(content) {
  // 【】 마커를 볼드 처리
  const processed = content.replace(/【([^】]+)】/g, '**【$1】**');
  return processed;
}

/**
 * 청구항 번호 포맷팅
 */
function formatClaims(content) {
  // 청구항 번호 패턴을 KIPO 형식으로 변환
  let claimNum = 1;
  return content.replace(/^(#{1,2}\s*)?(청구항\s*\d+|Claim\s*\d+)/gim, () => {
    const result = `【청구항 ${claimNum}】`;
    claimNum++;
    return result;
  });
}

/**
 * 마크다운을 DOCX로 변환
 * execFileSync 사용으로 명령어 인젝션 방지
 */
function convertToDocx(inputPath, outputPath) {
  // 입력 파일 읽기
  let content = fs.readFileSync(inputPath, 'utf-8');

  // 전처리
  content = preprocessKipoMarkers(content);
  content = formatClaims(content);

  // 임시 파일 생성
  const tempPath = inputPath.replace('.md', '_temp.md');
  fs.writeFileSync(tempPath, content, 'utf-8');

  try {
    // Pandoc 변환 실행 (execFileSync 사용 - 보안 강화)
    const args = [
      tempPath,
      '-o', outputPath,
      '--from=markdown',
      '--to=docx',
      '--standalone'
    ];
    execFileSync('pandoc', args, { encoding: 'utf-8' });

    console.log(`✅ DOCX 변환 완료: ${outputPath}`);
    return { success: true, output: outputPath };
  } catch (error) {
    console.error(`❌ 변환 실패: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    // 임시 파일 삭제
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * 마크다운을 PDF로 변환
 * execFileSync 사용으로 명령어 인젝션 방지
 */
function convertToPdf(inputPath, outputPath) {
  let content = fs.readFileSync(inputPath, 'utf-8');

  // 전처리
  content = preprocessKipoMarkers(content);
  content = formatClaims(content);

  const tempPath = inputPath.replace('.md', '_temp.md');
  fs.writeFileSync(tempPath, content, 'utf-8');

  try {
    // Pandoc PDF 변환 (xelatex 사용)
    const args = [
      tempPath,
      '-o', outputPath,
      '--from=markdown',
      '--to=pdf',
      '--pdf-engine=xelatex',
      `-V`, `mainfont=${CONFIG.defaultFont}`,
      `-V`, `geometry:margin=${CONFIG.pageMargin}`
    ];
    execFileSync('pandoc', args, { encoding: 'utf-8' });

    console.log(`✅ PDF 변환 완료: ${outputPath}`);
    return { success: true, output: outputPath };
  } catch (error) {
    // xelatex 없으면 HTML 경유 PDF 시도
    console.log('xelatex 미설치, HTML 경유 변환 시도...');
    try {
      const htmlPath = outputPath.replace('.pdf', '.html');
      const htmlArgs = [
        tempPath,
        '-o', htmlPath,
        '--from=markdown',
        '--to=html',
        '--standalone'
      ];
      execFileSync('pandoc', htmlArgs, { encoding: 'utf-8' });
      console.log(`📄 HTML 생성 완료: ${htmlPath}`);
      return { success: true, output: htmlPath, note: 'PDF 대신 HTML 생성됨' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * 출력 디렉토리 확인/생성
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

/**
 * 메인 함수 - CLI 또는 n8n에서 호출
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('사용법: node convert-patent.js <input.md> <format>');
    console.log('  format: docx | pdf | both');
    console.log('');
    console.log('예시:');
    console.log('  node convert-patent.js patent.md docx');
    console.log('  node convert-patent.js patent.md pdf');
    console.log('  node convert-patent.js patent.md both');
    process.exit(1);
  }

  const inputPath = args[0];
  const format = args[1].toLowerCase();

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  ensureOutputDir();

  const baseName = path.basename(inputPath, '.md');
  const timestamp = new Date().toISOString().slice(0, 10);
  const results = [];

  if (format === 'docx' || format === 'both') {
    const docxPath = path.join(CONFIG.outputDir, `${baseName}_${timestamp}.docx`);
    results.push(convertToDocx(inputPath, docxPath));
  }

  if (format === 'pdf' || format === 'both') {
    const pdfPath = path.join(CONFIG.outputDir, `${baseName}_${timestamp}.pdf`);
    results.push(convertToPdf(inputPath, pdfPath));
  }

  // 결과 출력
  console.log('\n=== 변환 결과 ===');
  results.forEach((r, i) => {
    if (r.success) {
      console.log(`[${i + 1}] ✅ ${r.output}${r.note ? ` (${r.note})` : ''}`);
    } else {
      console.log(`[${i + 1}] ❌ 실패: ${r.error}`);
    }
  });

  return results;
}

// 모듈 내보내기 (n8n Code 노드에서 사용)
module.exports = {
  convertToDocx,
  convertToPdf,
  preprocessKipoMarkers,
  formatClaims,
  CONFIG
};

// CLI 실행
if (require.main === module) {
  main();
}
