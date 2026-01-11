'use client';

import Link from 'next/link';
import { FileText, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/auth/LoginButton';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 토글</span>
        </Button>

        <Link href="/MAIPatent/" className="mr-6 flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">MAIPatent</span>
        </Link>

        <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
          <Link
            href="/MAIPatent/submit/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            발명 제안
          </Link>
          <Link
            href="/MAIPatent/dashboard/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            대시보드
          </Link>
          <Link
            href="/MAIPatent/tracking/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            진행 추적
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
