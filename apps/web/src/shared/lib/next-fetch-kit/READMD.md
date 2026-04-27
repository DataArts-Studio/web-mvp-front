## NextFetchKit
NextFetchKit은 Next.js App Router 환경에 최적화된 경량의 fetch 래퍼 라이브러리입니다.
Native fetch를 기반으로 하여 Next.js의 내장 캐싱 및 재검증(revalidate, tags) 기능을 완벽하게 지원하며, 서버 컴포넌트(RSC)와 클라이언트 컴포넌트(CSR) 간의 안전하고 일관된 API 호출 환경을 제공합니다.

## 주요 특징
### Next.js 최적화
fetch의 cache 및 next 옵션을 완벽 지원하여 App Router의 데이터 패칭 전략을 쉽게 적용할 수 있습니다.

### 표준화된 응답
모든 응답은 NextFetchKitResponse<T> 형식으로 통일되어 success 여부와 status를 명확하게 제공합니다.

### 강력한 에러 핸들링
- !response.ok 상황에서도 try-catch로 잡을 수 있는 표준 에러 클래스 NextFetchError를 제공합니다.
- NextErrorKit 유틸리티를 통해 복잡한 네트워크 에러나 알 수 없는 에러를 정규화하여 처리할 수 있습니다.

### 환경 격리 설계
서버 컴포넌트(Factory 패턴 권장)와 클라이언트 컴포넌트(Singleton 패턴 권장) 인스턴스를 명확히 분리하여, 서버 사이드에서 발생하는 토큰 오염(Cross-Request State Pollution) 문제를 원천 차단합니다.

## 모듈 구조 및 파일 경로
- types.ts(타입 정의): NextFetchKitConfig, NextFetchKitResponse, NextFetchKitError 등 모든 인터페이스 정의
- ...-error-kit.ts(에러 도구): NextFetchError (에러 클래스), NextErrorKit (에러 유틸리티) 정의
- ...-fetch-kit.ts(메인 구현체): NextFetchKit 클래스 구현 및 모든 API 메서드 포함
- index.ts(Barrel): 모듈 진입점 (배럴 파일)

## 사용법
안전성을 위해 클라이언트/서버 인스턴스를 분리하여 사용해야 합니다.

### A. 클라이언트 컴포넌트 (CSR) 용 - 싱글톤
```ts
import { NextFetchKit } from '@/shared/lib/fetch-kit';

// 클라이언트는 상대 경로를 사용하여 CORS 프록시나 Next.js rewrite 규칙을 따르는 것이 일반적입니다.
export const clientApi = new NextFetchKit({
  baseUrl: '/api/v1', 
});

// 로그인 후 토큰 주입
// clientApi.setToken('new-access-token'); 
```

### B. 서버 컴포넌트 (RSC) 용 - 팩토리 + cache
서버 컴포넌트 환경에서는 `요청 격리(Per-Request Isolation)`가 필수이며, 토큰 오염을 막기 위해 반드시 팩토리 패턴을 사용해야 합니다.

#### [Warning] Base URL 설정
서버 컴포넌트(RSC)는 Node.js 환경에서 실행되므로, baseUrl에 /api와 같은 상대 경로를 사용하면 TypeError: Invalid URL과 함께 크래시가 발생합니다. 반드시 http://localhost:3000 형태의 `절대 경로(Full URL)`를 사용해야 합니다.

#### [권장] 팩토리 + cache (최적 성능)
cache를 사용하면 단일 HTTP 요청 내에서 NextFetchKit 인스턴스가 단 한 번만 생성되고 공유되어, 성능과 보안 모두 최적입니다.

#### [대안] 그냥 팩토리 (기능적)
cache 없이 함수 호출 시마다 new NextFetchKit()을 반환해도 기능적으로 완벽하게 작동하고 보안상 안전합니다. 다만, 단일 요청 내에서 여러 인스턴스가 불필요하게 생성되는 미세한 오버헤드가 있습니다.

#### [코드 예시] 팩토리 + cache
```ts
import { cookies } from 'next/headers';
import { cache } from 'react';
import { NextFetchKit } from '@/shared/lib/fetch-kit';

export const getServerApi = cache(() => {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  return new NextFetchKit({
    baseUrl: process.env.NEXT_INTERNAL_API_URL || 'http://localhost:3000/api/v1',
    token: token,
  });
});
```

#### [코드 예시] 팩토리
```ts
import { cookies } from 'next/headers';
import { NextFetchKit } from '@/shared/lib/fetch-kit';

// 함수 호출 시마다 새 인스턴스 생성
export const getServerApi = () => { 
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  return new NextFetchKit({
    baseUrl: process.env.NEXT_INTERNAL_API_URL || 'http://localhost:3000/api/v1',
    token: token,
  });
};
```

## API 요청 및 에러 처리 예시
NextFetchKit은 성공/실패 여부를 success 플래그로 반환합니다.

### 기본 사용 (GET 요청)
```ts
// 서버 컴포넌트에서 사용자 정보 가져오기
import { getServerApi } from '@/shared/api/server';

interface User { 
  id: number;
  name: string;
}

async function fetchUser(userId: number) {
  const api = getServerApi();
  const res = await api.get<User>(`/users/${userId}`, {
    // RSC에서 1시간마다 데이터 갱신
    next: { revalidate: 3600 } 
  });

  if (res.success) {
    return res.data;
  }
  
  // 에러 발생 시 NextFetchKitResponse를 반환
  console.error(`API Error (${res.status}): ${res.statusText}`);
  return null;
}
```

### 에러 throw 및 NextErrorKit 활용 (추천 패턴)
에러 바운더리(ErrorBoundary)를 사용하거나 비즈니스 로직에서 에러를 명확히 던지고 싶을 때 NextErrorKit을 사용합니다.
```ts
// 클라이언트 컴포넌트에서 로그인 처리
// clientApi는 index.ts에서 NextErrorKit을 export 함
import { clientApi, NextErrorKit } from '@/shared/api/client'; 

async function handleLogin(email: string) {
  try {
    const res = await clientApi.post<{ token: string }>('/auth/login', { email });

    // 실패 응답을 표준화된 NextFetchError 객체로 변환하여 throw
    if (!res.success) throw NextErrorKit.from(res);
    
    clientApi.setToken(res.data.token);
    return true;

  } catch (error) {
    // 어떤 에러가 잡힐지 모르므로, NextErrorKit.normalize로 정규화
    const err = NextErrorKit.normalize(error); 
    
    if (err instanceof NextFetchError && err.status === 401) {
      alert('로그인 정보가 올바르지 않습니다.');
    } else {
      console.error('예상치 못한 네트워크 오류:', err.message);
    }
    return false;
  }
}
```