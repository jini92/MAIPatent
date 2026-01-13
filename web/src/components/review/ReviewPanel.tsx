'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Check,
  X,
  Edit3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ReviewData, ReviewStatus, Priority } from '@/hooks/useReviewState';

interface ReviewPanelProps {
  reviewData: ReviewData;
  onStatusChange: (status: ReviewStatus) => void;
  onPriorityChange: (priority: Priority) => void;
  onFeedbackChange: (section: keyof ReviewData['feedback'], content: string) => void;
  onSectionEdit: (section: keyof ReviewData['sections'], content: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

// 상태 뱃지 컴포넌트
const StatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  const config = {
    pending: { label: '검수 대기', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: '승인', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    revision_needed: { label: '수정 필요', color: 'bg-orange-100 text-orange-800', icon: Edit3 },
    rejected: { label: '반려', color: 'bg-red-100 text-red-800', icon: X }
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// 섹션 네비게이터
const SectionNavigator: React.FC<{
  sections: string[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}> = ({ sections, activeSection, onSectionChange }) => (
  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
    {sections.map(section => (
      <button
        key={section}
        onClick={() => onSectionChange(section)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors
          ${activeSection === section
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
      >
        {section}
      </button>
    ))}
  </div>
);

// 도면 부호를 하이라이트하는 컴포넌트
const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
  // 도면 부호 패턴 (숫자)를 분리
  const parts = text.split(/(\(\d+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(/^\(\d+\)$/)) {
          return (
            <span key={index} className="text-purple-600 font-medium">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  reviewData,
  onStatusChange,
  onPriorityChange,
  onFeedbackChange,
  onSectionEdit,
  onSubmit,
  isSubmitting
}) => {
  const [activeSection, setActiveSection] = useState<keyof ReviewData['sections']>('claims');
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(true);
  const [splitRatio, setSplitRatio] = useState(60);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const documentRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const sectionLabels: Record<keyof ReviewData['sections'], string> = {
    claims: '청구항',
    description: '상세설명',
    drawingDescription: '도면설명',
    abstract: '요약서'
  };

  const feedbackLabels: Record<keyof ReviewData['feedback'], string> = {
    claims: '청구항 피드백',
    description: '상세설명 피드백',
    drawings: '도면설명 피드백',
    general: '전체 의견'
  };

  // 동기화 스크롤
  const handleScroll = useCallback((source: 'document' | 'feedback') => {
    if (!documentRef.current || !feedbackRef.current) return;

    const sourceEl = source === 'document' ? documentRef.current : feedbackRef.current;
    const targetEl = source === 'document' ? feedbackRef.current : documentRef.current;

    const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
    targetEl.scrollTop = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);
  }, []);

  // 편집 모드 시작
  const startEditing = () => {
    setEditContent(reviewData.sections[activeSection]);
    setIsEditing(true);
  };

  // 편집 저장
  const saveEdit = () => {
    onSectionEdit(activeSection, editContent);
    setIsEditing(false);
  };

  // 편집 취소
  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // KIPO 섹션 파싱 및 렌더링 (안전한 방식)
  const renderKipoContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // 【】 섹션 헤더
      if (line.match(/【.+】/)) {
        return (
          <div key={index} className="font-bold text-blue-800 mt-4 mb-2 bg-blue-50 px-2 py-1 rounded">
            {line}
          </div>
        );
      }
      // 청구항 번호
      if (line.match(/^제\d+항/)) {
        return (
          <div key={index} className="font-semibold text-gray-900 mt-3">
            {line}
          </div>
        );
      }
      // 일반 텍스트 (도면 부호 하이라이트)
      return (
        <div key={index} className="text-gray-700 leading-relaxed">
          <HighlightedText text={line} />
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">명세서 검수</h2>
            <p className="text-xs text-gray-500">
              검수 ID: {reviewData.reviewId} | 수정 횟수: {reviewData.revisionNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={reviewData.status} />
          <button
            onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={showFeedbackPanel ? '피드백 패널 숨기기' : '피드백 패널 보기'}
          >
            {showFeedbackPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 섹션 네비게이터 */}
      <div className="px-4 py-2 border-b">
        <SectionNavigator
          sections={Object.values(sectionLabels)}
          activeSection={sectionLabels[activeSection]}
          onSectionChange={(label) => {
            const key = Object.entries(sectionLabels).find(([, v]) => v === label)?.[0] as keyof ReviewData['sections'];
            if (key) setActiveSection(key);
          }}
        />
      </div>

      {/* 메인 컨텐츠 (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 문서 패널 */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ width: showFeedbackPanel ? `${splitRatio}%` : '100%' }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-700">
              {sectionLabels[activeSection]}
            </span>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="저장"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="취소"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startEditing}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="편집"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div
            ref={documentRef}
            onScroll={() => handleScroll('document')}
            className="flex-1 overflow-y-auto p-4"
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[400px] p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                {renderKipoContent(reviewData.sections[activeSection])}
              </div>
            )}
          </div>
        </div>

        {/* 피드백 패널 */}
        {showFeedbackPanel && (
          <>
            {/* 리사이저 */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startRatio = splitRatio;
                const container = e.currentTarget.parentElement;
                if (!container) return;

                const onMouseMove = (moveEvent: MouseEvent) => {
                  const dx = moveEvent.clientX - startX;
                  const containerWidth = container.clientWidth;
                  const newRatio = startRatio + (dx / containerWidth) * 100;
                  setSplitRatio(Math.min(80, Math.max(30, newRatio)));
                };

                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            />

            <div
              className="flex flex-col overflow-hidden bg-gray-50"
              style={{ width: `${100 - splitRatio}%` }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-b">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">피드백</span>
              </div>

              <div
                ref={feedbackRef}
                onScroll={() => handleScroll('feedback')}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {/* 현재 섹션 피드백 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {feedbackLabels[activeSection === 'drawingDescription' ? 'drawings' : activeSection as keyof ReviewData['feedback']] || '전체 의견'}
                  </label>
                  <textarea
                    value={reviewData.feedback[activeSection === 'drawingDescription' ? 'drawings' : activeSection as keyof ReviewData['feedback']] || ''}
                    onChange={(e) => onFeedbackChange(
                      activeSection === 'drawingDescription' ? 'drawings' : activeSection as keyof ReviewData['feedback'],
                      e.target.value
                    )}
                    placeholder="이 섹션에 대한 피드백을 입력하세요..."
                    className="w-full h-24 p-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 전체 의견 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    전체 의견
                  </label>
                  <textarea
                    value={reviewData.feedback.general}
                    onChange={(e) => onFeedbackChange('general', e.target.value)}
                    placeholder="전체적인 의견을 입력하세요..."
                    className="w-full h-20 p-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 검수 체크리스트 */}
                <div className="bg-white rounded-lg border p-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    검수 체크리스트
                  </h4>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span>청구항이 발명의 핵심을 포함하는가?</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span>전제 기초(Antecedent Basis)가 충족되는가?</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span>도면 부호가 일관되게 사용되었는가?</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span>금지 어구가 사용되지 않았는가?</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 액션 바 */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">우선순위:</label>
          <select
            value={reviewData.priority}
            onChange={(e) => onPriorityChange(e.target.value as Priority)}
            className="text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onStatusChange('rejected');
              // 상태 변경 후 약간의 지연을 두고 제출 (React 상태 업데이트 대기)
              setTimeout(() => onSubmit(), 50);
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            반려
          </button>
          <button
            onClick={() => {
              onStatusChange('revision_needed');
              setTimeout(() => onSubmit(), 50);
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
          >
            수정 요청
          </button>
          <button
            onClick={() => {
              onStatusChange('approved');
              // 상태 변경 후 약간의 지연을 두고 제출 (React 상태 업데이트 대기)
              setTimeout(() => onSubmit(), 50);
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리중...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                승인
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPanel;
