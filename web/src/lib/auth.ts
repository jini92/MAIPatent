// Static Export용 인증 유틸리티
// GitHub Pages는 서버 API를 지원하지 않으므로 클라이언트 사이드 인증 사용
// 실제 인증은 n8n Cloud 백엔드에서 처리

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'maipatent_auth';

export function getStoredAuth(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // 파싱 오류 시 null 반환
  }
  return null;
}

export function setStoredAuth(user: User | null): void {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// 현재 페이지 URL 가져오기 (콜백용)
function getCurrentPageUrl(): string {
  if (typeof window === 'undefined') return '';

  // GitHub Pages basePath 고려
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/MAIPatent';
  const origin = window.location.origin;
  return `${origin}${basePath}/auth/callback/`;
}

// Google OAuth URL 생성 (n8n 백엔드로 리다이렉트)
export function getGoogleAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
  const callbackUrl = encodeURIComponent(getCurrentPageUrl());
  return `${baseUrl}/auth/google?callback_url=${callbackUrl}`;
}

// 데모 로그인 (개발/테스트용)
export function getDemoUser(): User {
  return {
    id: 'demo-user-1',
    name: '데모 사용자',
    email: 'demo@maipatent.ai',
    image: undefined,
  };
}

// 로그인 후 콜백 처리
export function handleAuthCallback(params: URLSearchParams): User | null {
  const userId = params.get('user_id');
  const userName = params.get('user_name');
  const userEmail = params.get('user_email');
  const userImage = params.get('user_image');

  if (userId && userName && userEmail) {
    const user: User = {
      id: userId,
      name: userName,
      email: userEmail,
      image: userImage || undefined,
    };
    setStoredAuth(user);
    return user;
  }
  return null;
}

// OAuth 콜백 URL에서 파라미터 파싱
export function parseOAuthCallback(): { user: User | null; error: string | null } {
  if (typeof window === 'undefined') {
    return { user: null, error: null };
  }

  const params = new URLSearchParams(window.location.search);

  // 에러 체크
  const error = params.get('error');
  if (error) {
    return { user: null, error: decodeURIComponent(error) };
  }

  // 사용자 정보 파싱
  const user = handleAuthCallback(params);
  return { user, error: null };
}
