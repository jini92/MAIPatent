'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Code, Eye } from 'lucide-react';

interface PatentPreviewProps {
  content: string;
  title?: string;
  className?: string;
}

type ViewMode = 'rendered' | 'kipo' | 'source';

export function PatentPreview({ content, title, className }: PatentPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {title || '명세서 미리보기'}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'rendered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('rendered')}
            >
              <Eye className="h-4 w-4 mr-1" />
              렌더링
            </Button>
            <Button
              variant={viewMode === 'kipo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kipo')}
            >
              <FileText className="h-4 w-4 mr-1" />
              KIPO
            </Button>
            <Button
              variant={viewMode === 'source' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('source')}
            >
              <Code className="h-4 w-4 mr-1" />
              소스
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {viewMode === 'rendered' && (
            <RenderedView content={content} />
          )}
          {viewMode === 'kipo' && (
            <KipoView content={content} />
          )}
          {viewMode === 'source' && (
            <SourceView content={content} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Markdown 렌더링 뷰
function RenderedView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 커스텀 헤딩 스타일
          h1: ({ children }) => (
            <h1 className="text-xl font-bold border-b pb-2 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-6 mb-3">{children}</h2>
          ),
          // KIPO 식별 기호 스타일링
          p: ({ children }) => {
            const text = String(children);
            if (text.startsWith('【') && text.includes('】')) {
              return (
                <p className="font-bold text-primary mt-4 mb-2 bg-muted/50 px-2 py-1 rounded">
                  {children}
                </p>
              );
            }
            return <p className="mb-3 leading-relaxed">{children}</p>;
          },
          // 테이블 스타일
          table: ({ children }) => (
            <table className="w-full border-collapse border border-muted my-4">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-muted px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// KIPO 표준 포맷 뷰
function KipoView({ content }: { content: string }) {
  const sections = parseKipoSections(content);

  return (
    <div className="space-y-4 font-serif">
      {sections.map((section, index) => (
        <div key={index} className="border-b border-muted pb-4 last:border-b-0">
          {section.title && (
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 mb-2 font-bold text-sm">
              {section.title}
            </div>
          )}
          <div className="px-3 text-sm leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}
    </div>
  );
}

// 소스 코드 뷰
function SourceView({ content }: { content: string }) {
  return (
    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
      {content}
    </pre>
  );
}

// KIPO 섹션 파싱
interface KipoSection {
  title: string;
  content: string;
}

function parseKipoSections(content: string): KipoSection[] {
  const sections: KipoSection[] = [];
  const lines = content.split('\n');

  let currentSection: KipoSection | null = null;
  let contentBuffer: string[] = [];

  for (const line of lines) {
    // 【...】 패턴 감지
    const sectionMatch = line.match(/^【(.+?)】/);

    if (sectionMatch) {
      // 이전 섹션 저장
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n').trim();
        sections.push(currentSection);
      }

      // 새 섹션 시작
      currentSection = {
        title: `【${sectionMatch[1]}】`,
        content: '',
      };
      contentBuffer = [line.replace(/^【.+?】/, '').trim()];
    } else {
      contentBuffer.push(line);
    }
  }

  // 마지막 섹션 저장
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n').trim();
    sections.push(currentSection);
  }

  // 섹션이 없으면 전체를 하나의 섹션으로
  if (sections.length === 0) {
    sections.push({
      title: '',
      content: content.trim(),
    });
  }

  return sections;
}
