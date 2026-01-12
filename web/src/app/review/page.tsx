'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileCheck } from 'lucide-react';
import ReviewPanel from '@/components/review/ReviewPanel';
import { useReviewState } from '@/hooks/useReviewState';
import { updatePatentStatus, getStoredPatents } from '@/lib/patent-storage';
import { PatentStatus } from '@/hooks/useDashboardStats';

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewId = searchParams.get('id');

  const {
    reviewData,
    isSubmitting,
    setStatus,
    setPriority,
    updateFeedback,
    updateSection,
    submitReview
  } = useReviewState({
    onStatusChange: (status) => {
      console.log('Status changed to:', status);
    },
    onSubmit: async (data) => {
      console.log('Submitting review:', data);
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));

      // URL에서 patent ID 추출 (PAT-XXX 형식)
      const patentId = reviewId;

      // localStorage의 특허 상태 업데이트
      if (patentId) {
        let newStatus: PatentStatus;
        if (data.status === 'approved') {
          newStatus = 'approved';
        } else if (data.status === 'rejected') {
          newStatus = 'rejected';
        } else if (data.status === 'revision_needed') {
          newStatus = 'reviewing'; // 수정 필요 시 검수 대기 상태 유지
        } else {
          newStatus = 'reviewing';
        }

        const updated = updatePatentStatus(patentId, newStatus);
        console.log('Patent status updated:', patentId, '->', newStatus, updated);
      }

      // 성공 시 대시보드로 이동
      if (data.status === 'approved') {
        alert('명세서가 승인되었습니다.');
        router.push('/dashboard');
      } else if (data.status === 'revision_needed') {
        alert('수정 요청이 전송되었습니다.');
      } else if (data.status === 'rejected') {
        alert('명세서가 반려되었습니다.');
        router.push('/dashboard');
      }
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">명세서 검수</h1>
              <p className="text-sm text-gray-500">
                {reviewId ? `검수 ID: ${reviewId}` : '새 검수'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>단어 수: {reviewData.metadata.wordCount.toLocaleString()}</span>
          <span className="text-gray-300">|</span>
          <span>생성: {new Date(reviewData.metadata.generatedAt).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      {/* 메인 검수 패널 */}
      <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
        <ReviewPanel
          reviewData={reviewData}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onFeedbackChange={updateFeedback}
          onSectionEdit={updateSection}
          onSubmit={submitReview}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function ReviewLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">검수 데이터 로딩 중...</p>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewLoading />}>
      <ReviewContent />
    </Suspense>
  );
}
