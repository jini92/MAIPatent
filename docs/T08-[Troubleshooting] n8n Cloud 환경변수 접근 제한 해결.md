# T08-[Troubleshooting] n8n Cloud 환경변수 접근 제한 해결

> 작성일: 2026-01-14
> 이슈 유형: 환경 설정 문제
> 결과: **해결됨**

---

## 1. 문제 상황

### 1.1. 증상
WF02 선행기술검색 워크플로우에서 KIPRIS API 키 확인 노드 실행 시 에러 발생

```
ERROR: access to env vars denied
```

### 1.2. 발생 위치
- **워크플로우**: WF02-선행기술검색 (ID: iFAXSkfG5Rh0b8Qh)
- **노드**: API 키 확인 (IF 노드)
- **표현식**: `{{ $env.KIPRIS_API_KEY }}`

### 1.3. 영향 범위
- KIPRIS API 실제 호출 불가
- Mock 데이터로 우회 실행됨
- 선행기술 검색 기능 제한

---

## 2. 원인 분석

### 2.1. 근본 원인
n8n Cloud의 보안 정책으로 인해 `$env` 접근이 차단됨

| 설정 | 값 | 설명 |
|------|-----|------|
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | `true` | 노드에서 환경변수 접근 차단 |

**중요**: 이 설정은 n8n Cloud에서 고정되어 있으며 사용자가 변경할 수 없음

### 2.2. Self-Hosted vs Cloud 비교

| 기능 | Self-Hosted n8n | n8n Cloud |
|------|-----------------|-----------|
| `$env` 접근 | ✅ 설정 가능 | ❌ 차단됨 (고정) |
| `$vars` 접근 | ✅ 지원 | ✅ **지원** |
| Credentials | ✅ 지원 | ✅ 지원 |
| Static Data | ✅ 지원 | ✅ 지원 |

### 2.3. 문제 코드

```javascript
// 작동하지 않음 (n8n Cloud에서)
{{ $env.KIPRIS_API_KEY }}
```

---

## 3. 해결 방안

### 3.1. 채택된 솔루션: Custom Variables ($vars)

n8n Cloud의 Variables 기능을 활용하여 API 키 저장 및 접근

**장점**:
- n8n Cloud에서 공식 지원
- UI에서 쉽게 관리 가능
- 워크플로우 간 공유 가능
- 보안 정책 준수

### 3.2. 대안 검토

| 방안 | 설명 | 채택 여부 |
|------|------|----------|
| Custom Variables ($vars) | n8n Variables에 등록 | ✅ 채택 |
| Generic Credentials | Credential에 API 키 저장 | ❌ 복잡성 |
| Static Data | 워크플로우별 정적 데이터 | ❌ 재사용성 부족 |
| Mock 데이터 유지 | API 호출 없이 Mock만 사용 | ❌ 기능 제한 |

---

## 4. 해결 단계

### 4.1. Step 1: n8n Cloud Variables 등록

1. **n8n Cloud 접속**: https://mai-n8n.app.n8n.cloud
2. **설정 이동**: Settings → Variables 탭
3. **변수 생성**:
   ```
   Key: KIPRIS_API_KEY
   Value: [KIPRIS API 키 값]
   Scope: Global
   ```

### 4.2. Step 2: WF02 워크플로우 수정

**수정 대상 파일**: `workflows/WF02-prior-art-search.json`

**수정 내용 1 - API 키 확인 노드 (IF)**:
```json
// 변경 전
"leftValue": "={{ $env.KIPRIS_API_KEY }}",

// 변경 후
"leftValue": "={{ $vars.KIPRIS_API_KEY }}",
```

**수정 내용 2 - KIPRIS API 호출 노드**:
```json
// 변경 전
"ServiceKey": "={{ $env.KIPRIS_API_KEY }}"

// 변경 후
"ServiceKey": "={{ $vars.KIPRIS_API_KEY }}"
```

### 4.3. Step 3: n8n Cloud 배포

1. n8n MCP를 통해 WF02 업데이트
2. 워크플로우 활성화 확인
3. 노드 연결 구조 검증

### 4.4. Step 4: 검증

- Variables에 KIPRIS_API_KEY 등록 확인 ✅
- WF02에서 `$vars` 구문 사용 확인 ✅
- API 키 확인 노드 분기 로직 정상 작동 확인 ✅

---

## 5. 수정된 워크플로우 구조

### 5.1. WF02 노드 플로우

```
선행기술검색 Webhook
       │
       ▼
검색 쿼리 준비
       │
       ▼
  API 키 확인 ($vars.KIPRIS_API_KEY)
       │
       ├─ [키 있음] ──► KIPRIS API 호출 ──► XML 파싱 ──► 결과 병합
       │
       └─ [키 없음] ──► Mock 선행기술 데이터 ──────────► 결과 병합
                                                            │
                                                            ▼
                                              Google Drive 업로드 (선행기술)
                                                            │
                                                            ▼
                                              Google Sheets 상태 업데이트
                                                            │
                                                            ▼
                                                   출력 데이터 설정
                                                            │
                                                            ▼
                                                    WF03 호출
```

### 5.2. 조건 분기 로직

| 조건 | 분기 | 결과 |
|------|------|------|
| `$vars.KIPRIS_API_KEY` 존재 | True 분기 | KIPRIS API 실제 호출 |
| `$vars.KIPRIS_API_KEY` 미존재 | False 분기 | Mock 데이터 사용 |

---

## 6. 영향받는 파일

| 파일 | 변경 내용 |
|------|----------|
| `workflows/WF02-prior-art-search.json` | `$env` → `$vars` 변경, 연결 구조 수정 |
| n8n Cloud Variables | KIPRIS_API_KEY 추가 |

---

## 7. 향후 주의사항

### 7.1. 새 환경변수 추가 시
- n8n Cloud에서는 `$env` 대신 `$vars` 사용 필수
- Settings → Variables에서 먼저 등록 후 워크플로우에서 참조

### 7.2. Self-Hosted 마이그레이션 시
- `$vars` → `$env` 변환 필요 (선택사항)
- 또는 Self-Hosted에서도 Variables 기능 사용 가능

### 7.3. 보안 고려사항
- API 키는 n8n Variables에 안전하게 저장됨
- 워크플로우 JSON에 API 키 하드코딩 금지
- 환경변수 방식으로 민감 정보 관리

---

## 8. 관련 문서

- [I12-[Implementation] Google Drive 및 Sheets 연동 가이드](./I12-[Implementation]%20Google%20Drive%20및%20Sheets%20연동%20가이드.md)
- [S01-[Summary] 프로젝트 현황 요약](./S01-[Summary]%20프로젝트%20현황%20요약.md)
- [계획 파일](../.claude/plans/vectorized-marinating-rose.md) - 환경변수 문제 해결 방안 상세

---

## 9. 체크리스트

### 해결 완료 항목
- [x] 문제 원인 분석 (n8n Cloud `$env` 차단)
- [x] 해결 방안 선정 (Custom Variables)
- [x] n8n Cloud Variables에 KIPRIS_API_KEY 등록
- [x] WF02 워크플로우 `$env` → `$vars` 수정
- [x] n8n Cloud 배포 및 검증

### 검증 항목
- [x] Variables에 KIPRIS_API_KEY 존재 확인
- [x] WF02 노드 연결 구조 확인
- [x] API 키 존재 시 KIPRIS API 호출 경로 확인
- [x] API 키 미존재 시 Mock 데이터 경로 확인

---

*작성일: 2026-01-14*
*해결자: Claude Code*
*버전: 1.0.0*
