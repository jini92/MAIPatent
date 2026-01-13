# I10 - Google OAuth 설정 가이드

> 작성일: 2026-01-12
> 최종 업데이트: 2026-01-12 (E2E 테스트 완료)

---

## 1. 개요

MAIPatent 시스템의 Google OAuth 인증 설정 가이드입니다.

### 아키텍처

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   GitHub Pages   │     │   n8n Cloud      │     │  Google OAuth    │
│   (Frontend)     │────►│   (WF05)         │────►│  (인증 서버)      │
│                  │◄────│                  │◄────│                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

**플로우**:
1. 사용자가 "Google로 로그인" 클릭
2. Frontend → n8n Webhook (`/auth/google`)
3. n8n → Google OAuth 인증 페이지로 리다이렉트
4. 사용자 로그인 → Google → n8n 콜백 (`/auth/google/callback`)
5. n8n → Frontend 콜백 (`/auth/callback/`) + 사용자 정보

---

## 2. 구현 현황

### 완료된 항목

| 구성요소 | 파일 | 상태 |
|----------|------|------|
| Frontend AuthProvider | `web/src/components/auth/AuthProvider.tsx` | ✅ |
| LoginButton 컴포넌트 | `web/src/components/auth/LoginButton.tsx` | ✅ |
| 인증 유틸리티 | `web/src/lib/auth.ts` | ✅ |
| OAuth 콜백 페이지 | `web/src/app/auth/callback/page.tsx` | ✅ |
| n8n OAuth 워크플로우 | WF05-Google-OAuth (ID: rt2CpYYYZi55dEIw) | ✅ |

---

## 3. 설정 단계

### Step 1: Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services** → **Credentials** 이동
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs**에 다음 추가:
   ```
   https://mai-n8n.app.n8n.cloud/webhook/auth/google/callback
   ```

### Step 2: n8n Cloud 환경변수 설정

[n8n Cloud](https://mai-n8n.app.n8n.cloud/) 접속 후:

1. **Settings** → **Variables** 이동
2. 다음 환경변수 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `GOOGLE_CLIENT_ID` | `your-client-id` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `your-client-secret` | Google OAuth Client Secret |

### Step 3: WF05 워크플로우 활성화

1. n8n Cloud에서 **WF05-Google-OAuth** 워크플로우 열기
2. 우측 상단 **Active** 토글 활성화
3. Webhook URL 확인:
   - 시작: `https://mai-n8n.app.n8n.cloud/webhook/auth/google`
   - 콜백: `https://mai-n8n.app.n8n.cloud/webhook/auth/google/callback`

---

## 4. 테스트

### 로컬 테스트

```bash
cd web
npm run dev
# http://localhost:3000/MAIPatent/ 접속
# 로그인 버튼 → Google로 로그인 클릭
```

### Production 테스트

1. https://jini92.github.io/MAIPatent/ 접속
2. 로그인 버튼 클릭
3. "Google로 로그인" 선택
4. Google 계정으로 인증
5. 대시보드로 리다이렉트 확인

---

## 5. 트러블슈팅

### 에러: "redirect_uri_mismatch"

**원인**: Google Cloud Console의 Redirect URI가 일치하지 않음

**해결**:
1. Google Cloud Console에서 정확한 URI 확인
2. `https://mai-n8n.app.n8n.cloud/webhook/auth/google/callback` 추가

### 에러: "invalid_client" (401 Unauthorized)

**원인**: Client ID 또는 Secret이 잘못됨

**해결**:
1. n8n Cloud 환경변수 확인
2. Google Cloud Console에서 Client ID/Secret 재확인
3. **Secret 불일치 시**: Google Cloud Console에서 새 Client Secret 생성 후 n8n Variables 업데이트

**실제 해결 사례** (2026-01-12):
- 문제: n8n의 `GOOGLE_CLIENT_SECRET`이 Google Cloud Console과 불일치
- 해결: Google Cloud Console에서 새 Secret 생성 → n8n Variables 업데이트

### 에러: "URLSearchParams is not defined" (ReferenceError)

**원인**: n8n JavaScript 런타임에서 `URLSearchParams` Web API 미지원

**해결**:
"콜백 URL 생성" 노드에서 `URLSearchParams` 대신 `encodeURIComponent()` 사용:

```javascript
// ❌ 문제 코드
const params = new URLSearchParams({
  user_id: userInfo.id,
  user_name: userInfo.name
});

// ✅ 수정 코드
const params = [
  `user_id=${encodeURIComponent(userInfo.id || '')}`,
  `user_name=${encodeURIComponent(userInfo.name || '')}`,
  `user_email=${encodeURIComponent(userInfo.email || '')}`,
  `user_image=${encodeURIComponent(userInfo.picture || '')}`
].join('&');
```

### 에러: "OAuth 인증이 취소되었습니다"

**원인**: 사용자가 Google 로그인을 취소함

**해결**: 정상 동작 (사용자 취소)

---

## 6. 보안 고려사항

1. **Client Secret 보호**: n8n Cloud 환경변수로만 관리
2. **State 파라미터**: CSRF 방지를 위한 state 값 사용
3. **HTTPS 필수**: 모든 통신은 HTTPS로 암호화
4. **Scope 제한**: `openid email profile` 최소 권한만 요청

---

## 7. 관련 파일

| 파일 | 설명 |
|------|------|
| `web/.env.local` | Frontend 환경변수 |
| `web/src/lib/auth.ts` | 인증 유틸리티 함수 |
| `web/src/components/auth/` | 인증 관련 React 컴포넌트 |
| `workflows/WF05-google-oauth.json` | n8n 워크플로우 백업 |

---

## 8. E2E 테스트 결과

### 테스트 환경
- **테스트 일시**: 2026-01-12
- **테스트 계정**: jinhee Lee (jini92.lee@gmail.com)
- **브라우저**: Playwright (Chromium)

### 테스트 플로우

| 단계 | 설명 | 결과 |
|------|------|------|
| 1 | MAIPatent 메인 페이지 접속 | ✅ PASS |
| 2 | "로그인" 버튼 클릭 | ✅ PASS |
| 3 | "Google로 로그인" 선택 | ✅ PASS |
| 4 | Google 계정 선택 페이지 | ✅ PASS |
| 5 | 계정 선택 (jini92.lee@gmail.com) | ✅ PASS |
| 6 | Google 동의 화면 | ✅ PASS |
| 7 | n8n 콜백 처리 | ✅ PASS |
| 8 | 토큰 교환 (access_token) | ✅ PASS |
| 9 | 사용자 정보 조회 | ✅ PASS |
| 10 | 프론트엔드 리다이렉트 | ✅ PASS |
| 11 | 대시보드 로그인 상태 표시 | ✅ PASS |

### 최종 결과: **PASS**

---

*문서 버전: 1.1.0*
