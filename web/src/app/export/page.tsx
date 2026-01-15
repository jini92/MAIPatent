'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileOutput, AlertCircle, ExternalLink } from 'lucide-react';
import ExportPanel from '@/components/export/ExportPanel';
import { exportPatentDocument, ExportOptions as N8nExportOptions } from '@/lib/n8n-client';

function ExportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patentId = searchParams.get('id') || 'PAT-001';
  const [exportError, setExportError] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  // Mock 특허 데이터
  const patentTitle = '인공지능 기반 특허 명세서 자동 생성 시스템 및 방법';

  const handleExport = async (options: { format: string; includeDrawings?: boolean; includeMetadata?: boolean; watermark?: boolean; template?: string }) => {
    console.log('Exporting with options:', options);
    setExportError(null);
    setDriveUrl(null);

    try {
      // n8n WF05 워크플로우 호출
      const exportOptions: N8nExportOptions = {
        format: options.format as N8nExportOptions['format'],
        includeDrawings: options.includeDrawings ?? true,
        includeMetadata: options.includeMetadata ?? true,
        watermark: options.watermark ?? false,
        template: (options.template as N8nExportOptions['template']) ?? 'standard',
      };

      const result = await exportPatentDocument(patentId, exportOptions);

      if (result.success && result.downloadUrl) {
        // n8n에서 반환한 다운로드 URL로 파일 다운로드
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = result.filename || `${patentId}_명세서.${options.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (result.driveUrl) {
          setDriveUrl(result.driveUrl);
        }
      } else {
        throw new Error(result.message || '문서 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : '내보내기 중 오류가 발생했습니다.');

      // Fallback: Mock 데이터로 다운로드 (n8n 연동 실패 시)
      console.log('Falling back to mock export...');
      const mockContent = `【발명의 명칭】\n${patentTitle}\n\n【기술분야】\n본 발명은 인공지능 기술을 활용한 특허 명세서 자동 생성 시스템에 관한 것이다.\n\n※ 이 파일은 Mock 데이터입니다. 실제 문서 생성은 n8n WF05 워크플로우 연동이 필요합니다.`;

      const blob = new Blob([mockContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patentId}_명세서_mock.${options.format === 'docx' ? 'docx' : options.format === 'pdf' ? 'pdf' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileOutput className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">명세서 내보내기</h1>
                <p className="text-sm text-gray-500">다양한 형식으로 명세서를 내보냅니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* n8n 연동 상태 표시 */}
        {exportError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">n8n 워크플로우 연동 알림</p>
              <p className="text-sm text-yellow-700">{exportError}</p>
              <p className="text-xs text-yellow-600 mt-1">Mock 파일로 대체 다운로드됩니다. 실제 DOCX/PDF 생성은 WF05 워크플로우 활성화가 필요합니다.</p>
            </div>
          </div>
        )}

        {/* Google Drive 링크 표시 */}
        {driveUrl && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">문서가 Google Drive에 저장되었습니다</p>
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 underline hover:text-green-800"
              >
                Google Drive에서 열기
              </a>
            </div>
          </div>
        )}

        <ExportPanel
          patentId={patentId}
          patentTitle={patentTitle}
          onExport={handleExport}
        />

        {/* 추가 정보 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">내보내기 형식 안내</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">DOCX (Word)</p>
              <p className="text-gray-500 text-xs mt-1">
                편집이 필요한 경우 권장. Microsoft Word, 한글, 구글 문서 등에서 열 수 있습니다.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">PDF</p>
              <p className="text-gray-500 text-xs mt-1">
                인쇄나 공식 제출용으로 권장. 레이아웃이 고정되어 배포에 적합합니다.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">HWP (한글)</p>
              <p className="text-gray-500 text-xs mt-1">
                한글 문서 편집 시 권장. 한국 특허청 제출 형식에 적합합니다.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Markdown</p>
              <p className="text-gray-500 text-xs mt-1">
                텍스트 기반 편집 시 권장. 버전 관리나 변환에 유용합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 최근 내보내기 이력 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">최근 내보내기 이력</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileOutput className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">PAT-001_명세서.docx</p>
                  <p className="text-xs text-gray-500">2026-01-11 14:30</p>
                </div>
              </div>
              <button className="text-xs text-blue-600 hover:underline">다시 다운로드</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileOutput className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">PAT-001_명세서.pdf</p>
                  <p className="text-xs text-gray-500">2026-01-11 10:15</p>
                </div>
              </div>
              <button className="text-xs text-blue-600 hover:underline">다시 다운로드</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function ExportLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">내보내기 준비 중...</p>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <ExportContent />
    </Suspense>
  );
}
