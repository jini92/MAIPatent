'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileType,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Eye
} from 'lucide-react';

export type ExportFormat = 'docx' | 'pdf' | 'hwp' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  includeDrawings: boolean;
  includeMetadata: boolean;
  watermark: boolean;
  template: 'standard' | 'detailed' | 'minimal';
}

interface ExportPanelProps {
  patentId: string;
  patentTitle: string;
  onExport: (options: ExportOptions) => Promise<void>;
}

const formatConfig: Record<ExportFormat, { label: string; icon: React.ElementType; description: string }> = {
  docx: {
    label: 'Microsoft Word',
    icon: FileText,
    description: 'DOCX 형식 (.docx) - 편집 가능'
  },
  pdf: {
    label: 'PDF 문서',
    icon: FileType,
    description: 'PDF 형식 (.pdf) - 인쇄용'
  },
  hwp: {
    label: '한글 문서',
    icon: FileText,
    description: 'HWP 형식 (.hwp) - 한글 2010 이상'
  },
  markdown: {
    label: 'Markdown',
    icon: FileText,
    description: 'MD 형식 (.md) - 텍스트 기반'
  }
};

export const ExportPanel: React.FC<ExportPanelProps> = ({
  patentId,
  patentTitle,
  onExport
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'docx',
    includeDrawings: true,
    includeMetadata: true,
    watermark: false,
    template: 'standard'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      await onExport(options);
      setExportStatus('success');

      // 성공 메시지 3초 후 리셋
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch {
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">명세서 내보내기</h2>
            <p className="text-sm text-gray-500">{patentTitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 포맷 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            출력 형식 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(formatConfig) as [ExportFormat, typeof formatConfig[ExportFormat]][]).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = options.format === key;

              return (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, format: key })}
                  className={`p-4 border-2 rounded-lg text-left transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 템플릿 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            템플릿 스타일
          </label>
          <div className="flex gap-3">
            {[
              { value: 'standard', label: '표준', desc: 'KIPO 표준 형식' },
              { value: 'detailed', label: '상세', desc: '설명 포함' },
              { value: 'minimal', label: '간략', desc: '핵심만' }
            ].map((tmpl) => (
              <button
                key={tmpl.value}
                onClick={() => setOptions({ ...options, template: tmpl.value as ExportOptions['template'] })}
                className={`flex-1 p-3 border-2 rounded-lg text-center transition-all
                  ${options.template === tmpl.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <p className={`font-medium ${options.template === tmpl.value ? 'text-blue-900' : 'text-gray-900'}`}>
                  {tmpl.label}
                </p>
                <p className="text-xs text-gray-500">{tmpl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 옵션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            추가 옵션
          </label>
          <div className="space-y-3 bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeDrawings}
                onChange={(e) => setOptions({ ...options, includeDrawings: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">도면 포함</span>
                <p className="text-xs text-gray-500">도면 이미지를 문서에 포함합니다</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeMetadata}
                onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">메타데이터 포함</span>
                <p className="text-xs text-gray-500">생성일, 버전 정보 등을 포함합니다</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.watermark}
                onChange={(e) => setOptions({ ...options, watermark: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">워터마크 추가</span>
                <p className="text-xs text-gray-500">&quot;DRAFT&quot; 워터마크를 추가합니다</p>
              </div>
            </label>
          </div>
        </div>

        {/* 상태 메시지 */}
        {exportStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              내보내기가 완료되었습니다. 다운로드가 시작됩니다.
            </span>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">
              내보내기 중 오류가 발생했습니다. 다시 시도해주세요.
            </span>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {formatConfig[options.format].label}로 내보내기
              </>
            )}
          </button>
        </div>

        {/* 미리보기 (옵션) */}
        {showPreview && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">문서 미리보기</h4>
            <div className="bg-white border rounded p-4 text-sm text-gray-600 font-mono h-48 overflow-auto">
              <div className="text-blue-800 font-bold">【발명의 명칭】</div>
              <div>{patentTitle}</div>
              <br />
              <div className="text-blue-800 font-bold">【기술분야】</div>
              <div>본 발명은 ... 에 관한 것이다.</div>
              <br />
              <div className="text-gray-400">... (미리보기)</div>
            </div>
          </div>
        )}

        {/* 파일 정보 */}
        <div className="text-xs text-gray-500 pt-2">
          <p>문서 ID: {patentId}</p>
          <p>예상 파일 크기: ~2.5 MB</p>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
