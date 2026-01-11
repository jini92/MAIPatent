'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Globe,
  Shield,
  Database,
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
type Language = 'ko' | 'en';

interface AppSettings {
  theme: Theme;
  language: Language;
  notifications: {
    email: boolean;
    browser: boolean;
    reviewReminder: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
  export: {
    defaultFormat: 'docx' | 'pdf' | 'hwp';
    includeMetadata: boolean;
  };
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'ko',
  notifications: {
    email: true,
    browser: true,
    reviewReminder: true,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
  export: {
    defaultFormat: 'docx',
    includeMetadata: true,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const handleSave = () => {
    localStorage.setItem('maipatent-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  const ThemeButton: React.FC<{ value: Theme; icon: React.ElementType; label: string }> = ({
    value,
    icon: Icon,
    label
  }) => (
    <button
      onClick={() => setSettings({ ...settings, theme: value })}
      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all
        ${settings.theme === value
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }`}
    >
      <Icon className={`w-6 h-6 ${settings.theme === value ? 'text-blue-600' : 'text-gray-500'}`} />
      <span className={`text-sm font-medium ${settings.theme === value ? 'text-blue-700' : 'text-gray-700 dark:text-gray-300'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>
            <p className="text-gray-500 dark:text-gray-400">애플리케이션 환경을 설정합니다</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? '저장됨!' : '저장'}
          </button>
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">테마</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ThemeButton value="light" icon={Sun} label="라이트" />
          <ThemeButton value="dark" icon={Moon} label="다크" />
          <ThemeButton value="system" icon={Monitor} label="시스템" />
        </div>
      </div>

      {/* 언어 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">언어</h2>
        </div>
        <select
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value as Language })}
          className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">알림</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">이메일 알림</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">명세서 상태 변경 시 이메일 수신</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">브라우저 알림</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">브라우저 푸시 알림 수신</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.browser}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, browser: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">검수 리마인더</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">검수 대기 48시간 경과 시 알림</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.reviewReminder}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, reviewReminder: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* 내보내기 기본 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">내보내기 기본값</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              기본 출력 형식
            </label>
            <select
              value={settings.export.defaultFormat}
              onChange={(e) => setSettings({
                ...settings,
                export: { ...settings.export, defaultFormat: e.target.value as 'docx' | 'pdf' | 'hwp' }
              })}
              className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="docx">Microsoft Word (.docx)</option>
              <option value="pdf">PDF 문서 (.pdf)</option>
              <option value="hwp">한글 문서 (.hwp)</option>
            </select>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">메타데이터 포함</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">생성일, 버전 정보 등 포함</p>
            </div>
            <input
              type="checkbox"
              checked={settings.export.includeMetadata}
              onChange={(e) => setSettings({
                ...settings,
                export: { ...settings.export, includeMetadata: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* 개인정보 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">개인정보</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">사용 통계 수집</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">서비스 개선을 위한 익명 통계</p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.analytics}
              onChange={(e) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, analytics: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">오류 보고서</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">버그 수정을 위한 오류 정보 전송</p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.crashReports}
              onChange={(e) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, crashReports: e.target.checked }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* 버전 정보 */}
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>MAIPatent Web UI v1.0.0</p>
        <p className="text-xs mt-1">© 2026 MAIPatent. All rights reserved.</p>
      </div>
    </div>
  );
}
