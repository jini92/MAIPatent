'use client';

import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 데모용 더미 데이터
const demoPatents = [
  {
    id: 'patent-001',
    title: '인공지능 기반 이미지 분류 시스템',
    status: 'approved',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-11',
  },
  {
    id: 'patent-002',
    title: '블록체인 기반 디지털 인증 방법',
    status: 'reviewing',
    createdAt: '2026-01-11',
    updatedAt: '2026-01-11',
  },
  {
    id: 'patent-003',
    title: '자연어 처리를 이용한 문서 요약 장치',
    status: 'draft',
    createdAt: '2026-01-11',
    updatedAt: '2026-01-11',
  },
];

const statusConfig = {
  draft: {
    label: '생성 중',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-100',
  },
  reviewing: {
    label: '검수 대기',
    icon: FileText,
    color: 'text-blue-600 bg-blue-100',
  },
  approved: {
    label: '승인 완료',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
  },
  rejected: {
    label: '반려',
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
  },
};

export default function DashboardPage() {
  const stats = {
    total: demoPatents.length,
    draft: demoPatents.filter((p) => p.status === 'draft').length,
    reviewing: demoPatents.filter((p) => p.status === 'reviewing').length,
    approved: demoPatents.filter((p) => p.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">특허 명세서 현황을 확인합니다</p>
        </div>
        <Link href="/MAIPatent/submit/">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 발명 제안서
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">생성 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">검수 대기</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* 명세서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 명세서</CardTitle>
          <CardDescription>최근 작업한 특허 명세서 목록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoPatents.map((patent) => {
              const status = statusConfig[patent.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={patent.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{patent.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {patent.createdAt} 생성 · {patent.updatedAt} 업데이트
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <Link href={`/MAIPatent/preview/${patent.id}/`}>
                      <Button variant="ghost" size="sm">
                        보기
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
