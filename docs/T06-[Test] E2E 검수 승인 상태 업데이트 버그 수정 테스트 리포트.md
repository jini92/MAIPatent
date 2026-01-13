# T06-[Test] E2E 검수 승인 상태 업데이트 버그 수정 테스트 리포트

> 테스트 일시: 2026-01-13
> 테스트 환경: Production (https://jini92.github.io/MAIPatent/)
> 테스트 목적: 검수 승인 시 localStorage 상태 업데이트 버그 수정 검증

---

## 1. 테스트 개요

### 1.1. 배경
- **이슈**: 검수 페이지에서 "승인" 클릭 시 대시보드에 상태가 반영되지 않음
- **증상**: 콘솔에 `Status changed to: approved` 표시되나 대시보드는 "검수 대기" 또는 "생성 중" 유지
- **원인**: React의 비동기 상태 업데이트로 인해 `submitReview()` 콜백에서 `data.status`가 항상 `'pending'`으로 반환

### 1.2. 근본 원인 분석
```typescript
// 문제 코드 흐름
const { setStatus, submitReview } = useReviewState({
  onSubmit: async (data) => {
    // data.status는 항상 'pending' (React 상태 업데이트가 비동기)
    if (data.status === 'approved') {
      // 이 조건이 절대 true가 되지 않음!
    }
  }
});

// 승인 버튼 클릭 시
setStatus('approved');  // 비동기 상태 업데이트 요청
submitReview();         // 즉시 호출 → data.status는 아직 'pending'
```

### 1.3. 테스트 범위
| 항목 | 설명 |
|------|------|
| useRef 패턴 적용 | `pendingStatusRef`로 상태 동기적 추적 |
| onStatusChange 콜백 | ref 업데이트 동작 검증 |
| onSubmit 콜백 | `actualStatus` 사용 검증 |
| localStorage 업데이트 | `updatePatentStatus()` 함수 호출 검증 |
| 대시보드 반영 | 통계 및 목록 상태 변경 검증 |

---

## 2. 사전 조건

### 2.1. 코드 변경 사항
**파일**: `web/src/app/review/page.tsx`

```typescript
// 변경 전 (버그 있음)
const { setStatus, submitReview } = useReviewState({
  onSubmit: async (data) => {
    // data.status는 비동기 업데이트로 인해 항상 'pending'
    if (data.status === 'approved') {
      newStatus = 'approved';
    }
    // ...
  }
});

// 변경 후 (버그 수정)
import { useRef } from 'react';

function ReviewContent() {
  // useRef로 현재 선택된 상태를 동기적으로 추적
  const pendingStatusRef = useRef<ReviewStatus>('pending');

  const { setStatus, submitReview } = useReviewState({
    onStatusChange: (status) => {
      console.log('Status changed to:', status);
      // ref에 현재 상태 저장
      pendingStatusRef.current = status;
    },
    onSubmit: async (data) => {
      // ref에서 실제 선택된 상태 가져오기
      const actualStatus = pendingStatusRef.current;
      console.log('Submitting review:', { ...data, actualStatus });

      // actualStatus로 localStorage 업데이트
      if (actualStatus === 'approved') {
        newStatus = 'approved';
      }
      // ...
    }
  });
}
```

### 2.2. 배포 정보
| 항목 | 값 |
|------|-----|
| 버그 수정 커밋 | `8f43b83` |
| 커밋 메시지 | `fix: useRef로 검수 상태 추적하여 React 비동기 상태 업데이트 문제 해결` |
| 버전 범프 커밋 (v0.1.3) | `5a5beda` |
| CDN 캐시 강제 갱신 커밋 (v0.1.4) | `19b8d2f` |
| 배포 플랫폼 | GitHub Pages |
| CDN 전파 시간 | ~2분 |
| 최종 버전 | `0.1.4` |

---

## 3. 테스트 시나리오

### 3.1. 시나리오 1: 초기 상태 확인

**단계**:
1. 프로덕션 사이트 접속 (https://jini92.github.io/MAIPatent/)
2. 대시보드 페이지로 이동
3. PAT-001 현재 상태 확인

**결과**: ✅ 성공
- PAT-001 상태: "검수 대기"
- 대시보드 통계:
  - 전체 명세서: 1
  - 검수 대기: 1
  - 승인 완료: 0

### 3.2. 시나리오 2: 검수 페이지 승인 처리

**단계**:
1. PAT-001 검수 버튼 클릭
2. 검수 페이지 로드 확인
3. "승인" 버튼 클릭
4. 콘솔 로그 확인

**예상 콘솔 로그**:
```
[LOG] Status changed to: approved
[LOG] Submitting review: {..., actualStatus: approved}
[LOG] Patent status updated: PAT-001 -> approved
```

**결과**: ✅ 성공
- Alert 메시지: "명세서가 승인되었습니다."
- 콘솔 로그: `Patent status updated: PAT-001 -> approved`
- 자동으로 대시보드로 리다이렉트

### 3.3. 시나리오 3: 대시보드 상태 변경 검증

**단계**:
1. 대시보드 페이지 자동 이동 확인
2. 대시보드 통계 확인
3. 명세서 목록 상태 확인

**결과**: ✅ 성공

**검증된 통계 (변경 전 → 변경 후)**:
| 통계 항목 | 변경 전 | 변경 후 | 상태 |
|----------|--------|--------|------|
| 전체 명세서 | 1 | 1 | ✅ |
| 생성 중 | 0 | 0 | ✅ |
| 검수 대기 | 1 | **0** | ✅ |
| 승인 완료 | 0 | **1** | ✅ |

**검증된 명세서 데이터**:
| 필드 | 변경 전 | 변경 후 | 상태 |
|------|--------|--------|------|
| ID | PAT-001 | PAT-001 | ✅ |
| 상태 | 검수 대기 | **승인** | ✅ |
| 수정일 | 2026-01-12 | 2026-01-13 | ✅ |
| 작업 버튼 | 검수 | **내보내기** | ✅ |

---

## 4. 테스트 결과 요약

### 4.1. 전체 결과

| 시나리오 | 결과 | 비고 |
|----------|------|------|
| 초기 상태 확인 | ✅ PASS | 검수 대기 상태 확인 |
| 검수 승인 처리 | ✅ PASS | useRef로 상태 정확히 추적 |
| 대시보드 상태 반영 | ✅ PASS | 실시간 반영 확인 |

**최종 결과**: ✅ **전체 성공 (3/3)**

### 4.2. 검증된 수정 사항

1. **useRef 패턴**: `pendingStatusRef`로 상태 동기적 추적 ✅
2. **onStatusChange 콜백**: ref 업데이트 정상 동작 ✅
3. **actualStatus 변수**: `submitReview()`에서 정확한 상태 사용 ✅
4. **updatePatentStatus()**: localStorage 정상 업데이트 ✅
5. **Alert 메시지**: 상태별 올바른 메시지 표시 ✅
6. **자동 리다이렉트**: 승인 시 대시보드로 이동 ✅

### 4.3. 버그 수정 전/후 비교

| 항목 | 수정 전 | 수정 후 |
|------|--------|--------|
| 상태 추적 방식 | `data.status` (stale) | `pendingStatusRef.current` (fresh) |
| 승인 시 상태 | `-> reviewing` | `-> approved` |
| Alert 메시지 | 표시 안됨 | "명세서가 승인되었습니다." |
| 대시보드 반영 | ❌ 반영 안됨 | ✅ 즉시 반영 |
| 리다이렉트 | ❌ 발생 안함 | ✅ 대시보드로 이동 |

---

## 5. 기술적 분석

### 5.1. React 비동기 상태 업데이트 문제

**문제 상황**:
```javascript
// React의 setState는 비동기
setStatus('approved');  // 상태 업데이트 요청 (즉시 적용 안됨)
submitReview();         // 이 시점에서 상태는 아직 'pending'
```

**해결 방안**:
```javascript
// useRef는 동기적으로 값 저장
const statusRef = useRef('pending');

// 상태 변경 시 ref도 업데이트
onStatusChange: (status) => {
  statusRef.current = status;  // 동기적 저장
}

// 제출 시 ref에서 최신 값 사용
onSubmit: () => {
  const actualStatus = statusRef.current;  // 동기적 읽기
}
```

### 5.2. 상태 흐름 다이어그램

```
[승인 버튼 클릭]
       │
       ▼
[setStatus('approved')]──────► [React 상태 업데이트 큐]
       │                              │
       ├───► [statusRef.current = 'approved']  ◄── 동기적 저장
       │
       ▼
[submitReview()]
       │
       ▼
[onSubmit 콜백]
       │
       ├── data.status = 'pending'  ◄── ❌ stale 값
       │
       └── actualStatus = statusRef.current = 'approved'  ◄── ✅ fresh 값
              │
              ▼
       [updatePatentStatus(id, 'approved')]
              │
              ▼
       [localStorage 업데이트]
              │
              ▼
       [alert('명세서가 승인되었습니다.')]
              │
              ▼
       [router.push('/dashboard')]
```

---

## 6. 관련 문서

- [I11-[Implementation] 대시보드 데이터 연동 개선](./I11-[Implementation]%20대시보드%20데이터%20연동%20개선.md)
- [T05-[Test] E2E 대시보드 데이터 연동 테스트 리포트](./T05-[Test]%20E2E%20대시보드%20데이터%20연동%20테스트%20리포트.md)

---

## 7. 콘솔 로그 증거

### 7.1. 수정 전 (버그 있음)
```
[LOG] Status changed to: approved
[LOG] Submitting review: {reviewId: REV-xxx, status: pending, ...}
[LOG] Patent status updated: PAT-001 -> reviewing
```

### 7.2. 수정 후 (버그 수정, v0.1.4)
```
[LOG] Status changed to: approved
[LOG] Submitting review: {reviewId: REV-1768265604997, submissionId: GEN-001, status: pending, ...}
[LOG] Patent status updated: PAT-001 -> approved {title: 버그 재현 테스트, inventorName: 테스터, ...}
```

> **참고**: `status: pending`은 React의 stale closure로 인한 값이며, 실제 localStorage 업데이트는 `pendingStatusRef.current` 값(`approved`)을 사용하여 정상 처리됨

---

## 8. v0.1.4 재검증 (CDN 캐시 강제 갱신)

### 8.1. 재검증 배경
- **이슈**: v0.1.3 배포 후에도 일부 사용자 브라우저에서 이전 버전 캐시 로드
- **해결**: v0.1.4 버전 범프로 CDN 캐시 강제 갱신
- **커밋**: `19b8d2f chore: bump web version to 0.1.4 to force CDN cache refresh for review fix`

### 8.2. Playwright E2E 재검증 결과

**테스트 환경**: Playwright MCP (자동화 브라우저 테스트)

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| localStorage 상태 변경 (reviewing → approved) | ✅ | JavaScript로 검증 |
| 대시보드 새로고침 반영 | ✅ | 검수 대기: 1 확인 |
| 검수 페이지 이동 | ✅ | PAT-001 검수 버튼 클릭 |
| 승인 버튼 클릭 | ✅ | 처리중... 상태 표시 |
| 콘솔 로그: `Status changed to: approved` | ✅ | onStatusChange 정상 |
| 콘솔 로그: `Patent status updated: PAT-001 -> approved` | ✅ | useRef 패턴 정상 |
| Alert 메시지 | ✅ | "명세서가 승인되었습니다." |
| 대시보드 자동 리다이렉트 | ✅ | router.push 정상 |
| 대시보드 통계 업데이트 | ✅ | 검수 대기: 0, 승인 완료: 1 |
| 명세서 상태 표시 | ✅ | "승인" 뱃지 |
| 작업 버튼 변경 | ✅ | "검수" → "내보내기" |

**최종 결과**: ✅ **v0.1.4 배포 검증 완료 (11/11)**

---

## 9. 향후 고려 사항

### 9.1. 유사 패턴 적용 검토
- 다른 비동기 상태 업데이트가 필요한 곳에 동일 패턴 적용 검토
- `useReviewState` 훅 자체 개선 고려 (상태 반환 방식 변경)

### 9.2. 테스트 자동화
- E2E 테스트 자동화 스크립트 추가 고려
- 상태 변경 시나리오 회귀 테스트 포함

### 9.3. CDN 캐시 관리
- 중요 버그 수정 시 버전 범프 필수
- 사용자에게 하드 리프레시(Ctrl+Shift+R) 안내 고려

---

*작성일: 2026-01-13*
*테스트 담당: Claude Code*
*버전: 0.1.4*
