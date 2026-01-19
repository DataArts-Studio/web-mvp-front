# Project Access Control Architecture

## 개요

프로젝트 단위의 접근 제어 시스템. 로그인 인증(User Auth)과 완전히 분리된 리소스 접근 인증(Resource Access) 아키텍처.

## 핵심 원칙

### 1. 분리 원칙 (Separation of Concerns)
```
┌─────────────────────────────────────────────────────────────────┐
│                        접근 제어 레이어                           │
├─────────────────────────┬───────────────────────────────────────┤
│   User Authentication   │       Resource Access Control         │
│   (추후 구현 예정)        │       (현재 구현)                      │
├─────────────────────────┼───────────────────────────────────────┤
│ - 로그인/로그아웃          │ - 프로젝트 비밀번호 검증                │
│ - 사용자 세션 관리         │ - 프로젝트 접근 토큰 관리               │
│ - 사용자 권한 (RBAC)       │ - 리소스별 접근 정책                   │
│ - OAuth / SSO            │ - 접근 토큰 유효성 검증                 │
└─────────────────────────┴───────────────────────────────────────┘
```

### 2. 책임 분리
- **User Auth**: "누가" 시스템에 접근하는가 (Identity)
- **Resource Access**: "무엇에" 접근할 수 있는가 (Authorization)

### 3. 독립적 확장
두 시스템이 서로 의존하지 않음:
- User Auth 없이 Resource Access만 동작 가능 (현재 상태)
- User Auth 추가 시 Resource Access 코드 수정 불필요
- 두 시스템 동시 적용 가능 (AND 조건)

## 디렉토리 구조

```
src/
├── access/                          # 리소스 접근 제어 모듈
│   ├── ARCHITECTURE.md              # 이 문서
│   │
│   ├── policy/                      # 정책 판단 레이어
│   │   ├── types.ts                 # 정책 인터페이스 정의
│   │   ├── access-policy.ts         # 정책 판단 로직
│   │   └── index.ts
│   │
│   ├── project/                     # 프로젝트 접근 제어
│   │   ├── api/
│   │   │   ├── verify-access.ts     # 비밀번호 검증 Server Action
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   ├── types.ts             # 타입 정의
│   │   │   ├── schema.ts            # Zod 스키마
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── project-access-gate.tsx  # 접근 게이트 컴포넌트
│   │       ├── access-form.tsx          # 비밀번호 입력 폼
│   │       └── index.ts
│   │
│   ├── lib/                         # 공유 라이브러리
│   │   ├── access-token.ts          # 접근 토큰 생성/검증
│   │   ├── password-hash.ts         # bcrypt 래퍼
│   │   ├── cookies.ts               # 쿠키 유틸리티
│   │   └── index.ts
│   │
│   └── index.ts                     # 모듈 공개 API
│
├── auth/                            # 사용자 인증 모듈 (추후 구현)
│   └── ... (placeholder)
│
└── middleware.ts                    # Next.js 미들웨어 (접근 제어)
```

## 접근 제어 흐름

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│  Middleware  │────▶│  Project Page   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Check Token  │
                    │ (Cookie)     │
                    └──────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       [Token Valid]              [Token Invalid/Missing]
              │                         │
              ▼                         ▼
       ┌────────────┐            ┌─────────────────┐
       │ Allow      │            │ Redirect to     │
       │ Access     │            │ Access Page     │
       └────────────┘            └─────────────────┘
                                        │
                                        ▼
                                 ┌─────────────────┐
                                 │ Password Input  │
                                 └─────────────────┘
                                        │
                                        ▼
                                 ┌─────────────────┐
                                 │ Verify Password │
                                 │ (Server Action) │
                                 └─────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                        [Valid]             [Invalid]
                              │                   │
                              ▼                   ▼
                       ┌────────────┐      ┌────────────┐
                       │ Set Token  │      │ Show Error │
                       │ (Cookie)   │      └────────────┘
                       └────────────┘
                              │
                              ▼
                       ┌────────────┐
                       │ Redirect   │
                       │ to Project │
                       └────────────┘
```

## 정책 레이어 (Policy Layer)

### AccessPolicy 인터페이스
```typescript
interface AccessContext {
  // 리소스 접근 컨텍스트
  projectAccessToken?: string;

  // 사용자 인증 컨텍스트 (추후)
  userSession?: UserSession;
}

interface AccessPolicy {
  // 프로젝트 접근 가능 여부
  canAccessProject(projectId: string, context: AccessContext): Promise<boolean>;

  // 추후 확장
  // canAccessResource(resourceType: string, resourceId: string, context: AccessContext): Promise<boolean>;
}
```

### 정책 우선순위
1. 프로젝트 접근 토큰 검증 (현재)
2. 사용자 세션 검증 (추후)
3. 두 조건 모두 만족 시 접근 허용 (AND)

## 토큰 설계

### 접근 토큰 구조
```typescript
interface ProjectAccessToken {
  type: 'project_access';
  projectId: string;
  projectName: string;
  issuedAt: number;      // Unix timestamp
  expiresAt: number;     // Unix timestamp
}
```

### 토큰 저장
- **위치**: httpOnly Cookie
- **이름**: `project_access_{projectName}`
- **만료**: 24시간 (설정 가능)
- **보안**: httpOnly, secure (production), sameSite: 'lax'

### 비밀번호 저장
- **알고리즘**: bcrypt
- **Salt Rounds**: 12
- **DB 컬럼**: `identifier` (bcrypt 해시 저장)

## DB 스키마

### Drizzle 스키마
```typescript
export const projects = pgTable('projects', {
  // ... 기존 컬럼
  /** 프로젝트 접근 비밀번호의 bcrypt 해시. 원문은 저장하지 않음. */
  identifier: varchar('identifier', { length: 255 }).notNull(),
});
```

## 보안 고려사항

### 1. 비밀번호 보안
- 원문 저장 금지 (bcrypt 해시만 저장)
- 클라이언트에 원문 노출 금지
- API 응답에서 해시 제외

### 2. 토큰 보안
- httpOnly 쿠키로 XSS 방어
- CSRF 토큰 검증 (폼 제출 시)
- 만료 시간 설정 (기본 24시간)

### 3. 브루트포스 방어
- 실패 횟수 제한 (5회)
- 지연 시간 증가 (exponential backoff)
- IP 기반 제한 (선택적)

## 확장 계획

### Phase 1 (현재)
- 프로젝트 비밀번호 기반 접근 제어

### Phase 2 (추후)
- User Authentication 추가
- RBAC (Role-Based Access Control)
- 프로젝트 멤버 관리

### Phase 3 (미래)
- OAuth/SSO 연동
- 팀/조직 단위 접근 제어
- 감사 로그 (Audit Log)
