'use client';

import React from 'react';

// 기본 스켈레톤 컴포넌트
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${roundedClasses[rounded]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
};

// 텍스트 라인 스켈레톤
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%'
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          className={index === lines - 1 ? '' : 'w-full'}
          width={index === lines - 1 ? lastLineWidth : undefined}
        />
      ))}
    </div>
  );
};

// 카드 스켈레톤
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} className="w-3/4" />
          <Skeleton height={12} className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-2/3" />
      </div>
    </div>
  );
};

// 통계 카드 스켈레톤
export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={14} className="w-24" />
        <Skeleton width={24} height={24} rounded="sm" />
      </div>
      <Skeleton height={32} className="w-16 mb-2" />
      <Skeleton height={12} className="w-28" />
    </div>
  );
};

// 테이블 스켈레톤
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height={14} className="flex-1" />
          ))}
        </div>
      </div>

      {/* 행 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  height={14}
                  className={colIndex === 0 ? 'w-20' : 'flex-1'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 리스트 아이템 스켈레톤
export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <Skeleton width={40} height={40} rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
      <Skeleton width={80} height={28} rounded="md" />
    </div>
  );
};

// 대시보드 스켈레톤
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height={32} className="w-48" />
          <Skeleton height={16} className="w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={36} rounded="lg" />
          <Skeleton width={120} height={36} rounded="lg" />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>

      {/* 테이블 */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
};

// 폼 스켈레톤
export const SkeletonForm: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 필드 그룹 */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={14} className="w-24" />
          <Skeleton height={40} className="w-full" rounded="lg" />
        </div>
      ))}

      {/* 텍스트 영역 */}
      <div className="space-y-2">
        <Skeleton height={14} className="w-32" />
        <Skeleton height={120} className="w-full" rounded="lg" />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4">
        <Skeleton width={100} height={40} rounded="lg" />
        <Skeleton width={100} height={40} rounded="lg" />
      </div>
    </div>
  );
};

// 검수 패널 스켈레톤
export const SkeletonReviewPanel: React.FC = () => {
  return (
    <div className="flex h-screen animate-pulse">
      {/* 왼쪽 패널 - 문서 */}
      <div className="flex-1 p-6 space-y-4 border-r dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton width={40} height={40} rounded="lg" />
          <div className="space-y-2">
            <Skeleton height={20} className="w-64" />
            <Skeleton height={14} className="w-48" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} height={16} className={index % 3 === 0 ? 'w-full' : index % 3 === 1 ? 'w-4/5' : 'w-3/5'} />
          ))}
        </div>
      </div>

      {/* 오른쪽 패널 - 피드백 */}
      <div className="w-96 p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
        <Skeleton height={20} className="w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg space-y-2">
              <Skeleton height={14} className="w-24" />
              <Skeleton height={60} className="w-full" />
            </div>
          ))}
        </div>
        <div className="pt-4 space-y-2">
          <Skeleton height={40} className="w-full" rounded="lg" />
          <Skeleton height={40} className="w-full" rounded="lg" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
