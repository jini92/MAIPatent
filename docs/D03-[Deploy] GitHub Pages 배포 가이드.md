# D03-[Deploy] GitHub Pages 배포 가이드

## 배포 개요

| 항목 | 내용 |
|------|------|
| **배포 일시** | 2026-01-15 |
| **배포 URL** | https://jini92.github.io/MAIPatent/ |
| **배포 방식** | GitHub Pages (gh-pages branch) |
| **빌드 도구** | Next.js 14.2.35 + Static Export |
| **배포 상태** | ✅ **운영 중** |

---

## 1. 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                    (jini92/MAIPatent)                        │
├─────────────────────────────────────────────────────────────┤
│  main branch          │  gh-pages branch                    │
│  ├── web/             │  ├── index.html                     │
│  │   ├── src/         │  ├── submit/                        │
│  │   ├── package.json │  ├── dashboard/                     │
│  │   └── next.config  │  ├── tracking/                      │
│  ├── workflows/       │  ├── review/                        │
│  └── docs/            │  └── _next/ (static assets)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages CDN                          │
│              https://jini92.github.io/MAIPatent/             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 배포 설정

### 2.1 Next.js 설정 (`next.config.mjs`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // 정적 파일 출력
  basePath: '/MAIPatent',     // GitHub Pages 경로
  assetPrefix: '/MAIPatent/', // 에셋 경로
  images: {
    unoptimized: true,        // 정적 이미지 사용
  },
  trailingSlash: true,        // 디렉토리 형식 URL
};

export default nextConfig;
```

### 2.2 package.json 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d out"
  }
}
```

### 2.3 의존성

```json
{
  "devDependencies": {
    "gh-pages": "^6.3.0"
  }
}
```

---

## 3. 배포 절차

### 3.1 수동 배포

```bash
# 1. web 디렉토리로 이동
cd web

# 2. 의존성 설치 (최초 1회)
npm install

# 3. 빌드 및 배포
npm run deploy
```

### 3.2 배포 확인

```bash
# HTTP 상태 확인
curl -s -o /dev/null -w "%{http_code}" https://jini92.github.io/MAIPatent/

# 결과: 200 (정상)
```

---

## 4. 빌드 결과

### 4.1 페이지별 번들 크기

| 페이지 | Size | First Load JS |
|--------|------|---------------|
| `/` (홈) | 2.26 kB | 109 kB |
| `/submit` (발명 제안서) | 47.5 kB | 144 kB |
| `/dashboard` (대시보드) | 6.01 kB | 112 kB |
| `/tracking` (진행 추적) | 50.8 kB | 147 kB |
| `/review` (검수) | 7.29 kB | 94.8 kB |
| `/export` (내보내기) | 4.94 kB | 92.4 kB |
| `/settings` (설정) | 3.98 kB | 91.5 kB |

### 4.2 공유 번들

| 청크 | 크기 |
|------|------|
| `chunks/117-*.js` | 31.9 kB |
| `chunks/fd9d1056-*.js` | 53.6 kB |
| 기타 공유 청크 | 1.97 kB |
| **Total Shared** | **87.5 kB** |

---

## 5. E2E 테스트 결과

### 5.1 테스트 환경

| 항목 | 내용 |
|------|------|
| **테스트 URL** | https://jini92.github.io/MAIPatent/ |
| **테스트 도구** | Playwright MCP |
| **테스트 일시** | 2026-01-15 |

### 5.2 페이지별 테스트 결과

| 페이지 | URL | 상태 | 비고 |
|--------|-----|------|------|
| 홈 | `/` | ✅ 정상 | 워크플로우 다이어그램 표시 |
| 발명 제안서 | `/submit/` | ✅ 정상 | 4단계 폼 렌더링 |
| 대시보드 | `/dashboard/` | ✅ 정상 | 실제 데이터 표시 (2건) |
| 진행 추적 | `/tracking/` | ✅ 정상 | - |
| 검수 대기 | `/review/` | ✅ 정상 | - |
| 내보내기 | `/export/` | ✅ 정상 | - |
| 설정 | `/settings/` | ✅ 정상 | - |

### 5.3 인증 상태

- GitHub OAuth 로그인: ✅ 정상 동작
- 세션 유지: ✅ 정상
- 사용자 표시: "jinhee Lee"

---

## 6. 환경별 URL 정리

| 환경 | URL | 용도 |
|------|-----|------|
| **Production** | https://jini92.github.io/MAIPatent/ | 사용자 접근용 |
| **n8n Cloud** | https://mai-n8n.app.n8n.cloud/ | 워크플로우 실행 |
| **n8n Webhooks** | https://mai-n8n.app.n8n.cloud/webhook/* | API 엔드포인트 |
| **Google Sheets** | [스프레드시트 링크] | 제출이력 관리 |
| **Google Drive** | MAIPatent 폴더 | 문서 저장 |

---

## 7. 트러블슈팅

### 7.1 404 에러 발생 시

**증상**: 페이지 새로고침 시 404 에러

**원인**: GitHub Pages는 SPA 라우팅을 지원하지 않음

**해결**: `trailingSlash: true` 설정으로 디렉토리 형식 URL 사용

### 7.2 이미지 로드 실패

**증상**: 이미지가 표시되지 않음

**원인**: `assetPrefix` 미설정

**해결**: `assetPrefix: '/MAIPatent/'` 설정 확인

### 7.3 API 호출 실패

**증상**: n8n 워크플로우 호출 실패

**원인**: CORS 정책 또는 환경변수 미설정

**해결**:
- `.env.local` 파일에 `NEXT_PUBLIC_N8N_WEBHOOK_URL` 설정
- n8n Cloud에서 CORS 허용 설정

---

## 8. 향후 개선 사항

### 8.1 자동화 배포 (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['web/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: cd web && npm ci && npm run deploy
```

### 8.2 성능 최적화

- [ ] 이미지 최적화 (WebP 변환)
- [ ] 번들 크기 감소 (tree-shaking)
- [ ] CDN 캐싱 설정

---

## 9. 관련 문서

- [A01-[Analysis] 프로젝트 구조 분석](./A01-[Analysis]%20프로젝트%20구조%20분석.md)
- [T10-[Test] WF01-WF04 Google Drive 저장 E2E 테스트 리포트](./T10-[Test]%20WF01-WF04%20Google%20Drive%20저장%20E2E%20테스트%20리포트.md)
- [T11-[Troubleshooting] WF04 Google Sheets 컬럼 매핑 오류 해결](./T11-[Troubleshooting]%20WF04%20Google%20Sheets%20컬럼%20매핑%20오류%20해결.md)

---

*문서 작성일: 2026-01-15*
*최종 업데이트: 2026-01-15*
