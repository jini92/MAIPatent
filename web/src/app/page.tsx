'use client';

import Link from 'next/link';
import { FileText, Search, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: '발명 제안서 입력',
    description: '단계별 폼으로 발명 아이디어를 체계적으로 입력',
    icon: FileText,
    href: '/MAIPatent/submit/',
    color: 'text-blue-500',
  },
  {
    title: '선행기술 검색',
    description: 'KIPRIS API를 활용한 자동 선행기술 검색',
    icon: Search,
    href: '/MAIPatent/tracking/',
    color: 'text-green-500',
  },
  {
    title: 'Human-in-the-loop 검수',
    description: '변리사/연구자의 Split View 검수 인터페이스',
    icon: CheckCircle,
    href: '/MAIPatent/review/',
    color: 'text-orange-500',
  },
  {
    title: '명세서 내보내기',
    description: 'KIPO 표준 DOCX/PDF 형식으로 내보내기',
    icon: Download,
    href: '/MAIPatent/export/',
    color: 'text-purple-500',
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          지능형 특허 명세서 작성 시스템
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          n8n & Claude Code 기반으로 발명 제안서를 KIPO 규격 특허 명세서로 자동 변환합니다.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/MAIPatent/submit/">
            <Button size="lg">
              <FileText className="mr-2 h-5 w-5" />
              발명 제안서 작성
            </Button>
          </Link>
          <Link href="/MAIPatent/dashboard/">
            <Button variant="outline" size="lg">
              대시보드 보기
            </Button>
          </Link>
        </div>
      </div>

      {/* 기능 카드 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer">
              <CardHeader>
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 워크플로우 다이어그램 */}
      <Card>
        <CardHeader>
          <CardTitle>워크플로우</CardTitle>
          <CardDescription>자동화된 특허 명세서 생성 파이프라인</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-blue-100 p-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">WF01</span>
              <span className="text-xs text-muted-foreground">발명 제안서</span>
            </div>

            <div className="hidden md:block text-muted-foreground">→</div>
            <div className="md:hidden text-muted-foreground">↓</div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-green-100 p-4">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">WF02</span>
              <span className="text-xs text-muted-foreground">선행기술 검색</span>
            </div>

            <div className="hidden md:block text-muted-foreground">→</div>
            <div className="md:hidden text-muted-foreground">↓</div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-yellow-100 p-4">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium">WF03</span>
              <span className="text-xs text-muted-foreground">명세서 생성</span>
            </div>

            <div className="hidden md:block text-muted-foreground">→</div>
            <div className="md:hidden text-muted-foreground">↓</div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-orange-100 p-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium">WF04</span>
              <span className="text-xs text-muted-foreground">검수 프로세스</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
