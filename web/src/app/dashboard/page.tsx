'use client';

import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import PatentTable from '@/components/dashboard/PatentTable';

export default function DashboardPage() {
  const {
    stats,
    filteredPatents,
    isLoading,
    filters,
    setFilters,
    refreshData
  } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">특허 명세서 현황을 확인합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            새로고침
          </Button>
          <Link href="/submit/">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 발명 제안서
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 명세서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              이번 주 +{stats.thisWeek}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">생성 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.draft + stats.generating}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              초안 {stats.draft} · 생성 {stats.generating}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">검수 대기</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
            <p className="text-xs text-muted-foreground mt-1">
              검토가 필요한 명세서
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              이번 달 {stats.thisMonth}건 처리
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 반려 통계 (있는 경우만 표시) */}
      {stats.rejected > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">반려된 명세서</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-red-700 mt-1">
              재작성이 필요한 명세서가 있습니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 명세서 목록 테이블 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">명세서 목록</h2>
            <p className="text-sm text-muted-foreground">
              모든 특허 명세서를 검색하고 관리합니다
            </p>
          </div>
        </div>

        <PatentTable
          patents={filteredPatents}
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={isLoading}
        />
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/submit/" className="block">
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">새 발명 제안서</p>
              </div>
            </Link>
            <Link href="/review/" className="block">
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">검수 대기 ({stats.reviewing})</p>
              </div>
            </Link>
            <Link href="/tracking/" className="block">
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm font-medium">진행 추적</p>
              </div>
            </Link>
            <Link href="/export/" className="block">
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">내보내기</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
