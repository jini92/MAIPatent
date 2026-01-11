# I08-[Implementation] Web UI 구현

> **MAIPatent 웹 프론트엔드 구현 문서**

---

## 1. 개요

### 1.1 목적
n8n Form의 한계를 극복하고 변리사/연구자 친화적인 웹 UI를 제공하여 발명 제안서 입력, 진행 상태 추적, 명세서 검수 기능을 구현합니다.

### 1.2 기술 스택
```
Frontend:
├── Next.js 14 (App Router, Static Export)
├── React 18 + TypeScript
├── Shadcn/UI + Tailwind CSS
├── React Hook Form + Zod (폼 검증)
└── Lucide Icons

Backend 연동:
├── n8n Webhook API
└── n8n Cloud (mai-n8n.app.n8n.cloud)

배포:
└── GitHub Pages (Static Export)
```

---

## 2. 프로젝트 구조

```
web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 루트 레이아웃 (Sidebar)
│   │   ├── page.tsx              # 홈페이지
│   │   ├── dashboard/page.tsx    # 대시보드
│   │   ├── submit/page.tsx       # 발명 제안서 제출
│   │   └── tracking/page.tsx     # 진행 상황 추적
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn UI 컴포넌트
│   │   ├── layout/               # 레이아웃 컴포넌트
│   │   │   └── Sidebar.tsx
│   │   └── forms/                # 폼 컴포넌트
│   │       ├── InventionForm.tsx       # 메인 4단계 폼
│   │       ├── FormStepIndicator.tsx   # 단계 표시기
│   │       └── steps/
│   │           ├── Step1BasicInfo.tsx
│   │           ├── Step2TechnicalField.tsx
│   │           ├── Step3InventionContent.tsx
│   │           └── Step4DrawingsConfirm.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts              # 유틸리티
│   │   └── n8n-client.ts         # n8n API 클라이언트
│   │
│   └── types/
│       └── invention.ts          # Zod 스키마 및 타입
│
├── next.config.ts                # Next.js 설정 (Static Export)
├── tailwind.config.ts            # Tailwind 설정
└── package.json
```

---

## 3. 핵심 컴포넌트

### 3.1 InventionForm (4단계 폼)

**파일**: `src/components/forms/InventionForm.tsx`

발명 제안서 입력을 위한 다단계 폼 컴포넌트입니다.

#### 단계 구성
| 단계 | 제목 | 필드 |
|------|------|------|
| 1 | 기본 정보 | 발명 명칭, 발명자명, 소속, 이메일 |
| 2 | 기술 분야 | 기술 분야, 배경 기술, 해결 과제 |
| 3 | 발명 내용 | 발명 요약, 해결 수단, 기대 효과, 키워드 |
| 4 | 도면 및 확인 | 도면 설명, 정확성/기밀 확인 |

#### 주요 기능
- 단계별 유효성 검증 (Zod)
- 진행 상태 시각화 (FormStepIndicator)
- n8n WF01 Webhook 제출

```typescript
// 사용 예시
<InventionForm onSuccess={(executionId) => {
  router.push(`/tracking?id=${executionId}`);
}} />
```

### 3.2 Zod 스키마

**파일**: `src/types/invention.ts`

폼 검증을 위한 Zod 스키마입니다.

```typescript
// 단계별 스키마 정의
export const step1Schema = z.object({
  inventionTitle: z.string().min(5).max(200),
  inventorName: z.string().min(2).max(50),
  // ...
});

// 전체 폼 스키마 (merge 사용)
export const inventionFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

// 타입 내보내기
export type InventionFormData = z.input<typeof inventionFormSchema>;
```

### 3.3 n8n 클라이언트

**파일**: `src/lib/n8n-client.ts`

n8n Webhook API 연동 클라이언트입니다.

```typescript
// WF01: 발명 제안서 제출
export async function submitInvention(data: InventionData): Promise<{ executionId: string }> {
  const response = await fetch(`${N8N_WEBHOOK_URL}/wf01-invention-input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invention: data }),
  });
  return response.json();
}
```

---

## 4. 페이지 구성

### 4.1 대시보드 (`/dashboard`)
- 명세서 현황 통계 (전체, 생성 중, 검수 대기, 승인)
- 최근 명세서 목록
- 새 발명 제안서 작성 버튼

### 4.2 제출 페이지 (`/submit`)
- 4단계 발명 제안서 입력 폼
- 제출 성공 시 진행 추적 페이지로 이동

### 4.3 추적 페이지 (`/tracking`)
- 워크플로우 진행 상태 시각화
- 단계별 완료/진행 중/대기 상태 표시
- 실행 ID 표시

---

## 5. 배포 설정

### 5.1 Next.js Static Export

**파일**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/MAIPatent',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### 5.2 GitHub Pages 배포

```bash
# 빌드
cd web
npm run build

# 출력 디렉토리: web/out/
# GitHub Pages에 out/ 폴더 배포
```

### 5.3 환경 변수

```bash
# .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://mai-n8n.app.n8n.cloud/webhook
```

---

## 6. 개발 가이드

### 6.1 로컬 실행

```bash
cd web
npm install
npm run dev
# http://localhost:3000/MAIPatent 접속
```

### 6.2 빌드 및 검증

```bash
npm run build   # TypeScript 타입 체크 + 빌드
npm run lint    # ESLint 검사
```

### 6.3 새 페이지 추가

```bash
# 1. src/app/[page-name]/page.tsx 생성
# 2. Sidebar.tsx에 네비게이션 추가
# 3. 필요 시 Suspense로 useSearchParams 래핑
```

---

## 7. 향후 계획

### Phase 3: 추적 & 미리보기
- [ ] 실시간 상태 폴링 (2초 간격)
- [ ] 명세서 미리보기 (Markdown 렌더링)
- [ ] KIPO 포맷 렌더링

### Phase 4: 검수 패널
- [ ] Split View 레이아웃
- [ ] 동기화 스크롤
- [ ] 승인/수정/반려 처리

### Phase 5: 대시보드 & 내보내기
- [ ] 명세서 목록 API 연동
- [ ] DOCX/PDF 다운로드
- [ ] 필터링 & 검색

---

## 8. 트러블슈팅

### 빌드 타입 에러
- **원인**: Zod `.transform()` 사용 시 타입 불일치
- **해결**: `z.input<>` 타입 사용 또는 transform 제거

### useSearchParams 에러
- **원인**: Static Export에서 Suspense 필요
- **해결**: `<Suspense>` 바운더리로 래핑

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ContentWithSearchParams />
    </Suspense>
  );
}
```

---

*작성일: 2026-01-11*
*상태: Phase 2 완료*
