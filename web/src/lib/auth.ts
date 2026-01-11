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

// Google OAuth URL 생성 (n8n 백엔드로 리다이렉트)
export function getGoogleAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
  return `${baseUrl}/auth/google`;
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
