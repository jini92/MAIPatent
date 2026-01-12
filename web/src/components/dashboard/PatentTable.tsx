'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Eye,
  Edit3,
  MoreHorizontal
} from 'lucide-react';
import { Patent, PatentStatus, PatentFilters } from '@/hooks/useDashboardStats';

interface PatentTableProps {
  patents: Patent[];
  filters: PatentFilters;
  onFiltersChange: (filters: PatentFilters) => void;
  isLoading: boolean;
}

// 상태 설정
const statusConfig: Record<PatentStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: '초안', icon: FileText, color: 'bg-gray-100 text-gray-700' },
  generating: { label: '생성 중', icon: Loader2, color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '검수 대기', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  approved: { label: '승인', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

// 상태 뱃지 컴포넌트
const StatusBadge: React.FC<{ status: PatentStatus }> = ({ status }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === 'generating' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

export const PatentTable: React.FC<PatentTableProps> = ({
  patents,
  filters,
  onFiltersChange,
  isLoading
}) => {
  // 정렬 토글
  const toggleSort = (field: 'createdAt' | 'updatedAt' | 'title') => {
    if (filters.sortBy === field) {
      onFiltersChange({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onFiltersChange({
        ...filters,
        sortBy: field,
        sortOrder: 'desc'
      });
    }
  };

  // 정렬 아이콘
  const SortIcon: React.FC<{ field: string }> = ({ field }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* 필터 바 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="명세서 검색 (제목, 발명자, ID)..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as PatentStatus | 'all' })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="draft">초안</option>
              <option value="generating">생성 중</option>
              <option value="reviewing">검수 대기</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  발명 명칭
                  <SortIcon field="title" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                발명자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  생성일
                  <SortIcon field="createdAt" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('updatedAt')}
              >
                <div className="flex items-center gap-1">
                  수정일
                  <SortIcon field="updatedAt" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="mt-2 text-sm text-gray-500">데이터 로딩 중...</p>
                </td>
              </tr>
            ) : patents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">검색 결과가 없습니다</p>
                </td>
              </tr>
            ) : (
              patents.map((patent) => (
                <tr key={patent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">
                    {patent.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {patent.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(patent.wordCount ?? 0).toLocaleString()} 자 · 수정 {patent.revisionCount ?? 0}회
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {patent.inventorName}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={patent.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {patent.createdAt}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {patent.updatedAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/tracking/?id=${patent.id}`}>
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      {patent.status === 'reviewing' && (
                        <Link href={`/review/?id=${patent.id}`}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="검수"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                      {patent.status === 'approved' && (
                        <Link href={`/export/?id=${patent.id}`}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="내보내기"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </Link>
                      )}
                      <button
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="더보기"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {patents.length > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {patents.length}개 명세서
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
              이전
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatentTable;
