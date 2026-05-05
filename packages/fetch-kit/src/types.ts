/** FetchKit 초기 설정값 */
export interface NextFetchKitConfig {
  /** 기본 Base URL (ex: https://api.example.com) */
  baseUrl: string;
  /** 공통으로 사용할 헤더 */
  headers?: HeadersInit;
  /** Authorization Bearer 토큰 (선택) */
  token?: string;
  /** fetch redirect 전략 */
  redirect?: RequestRedirect;
}

/** FetchKit이 내부에서 관리하는 상태 */
export interface NextFetchKitState {
  /** 기본 Base URL */
  baseUrl: string;
  /** Authorization Bearer 토큰 */
  token?: string;
  /** 공통으로 사용할 헤더 */
  headers?: HeadersInit;
  /** fetch redirect 전략 */
  redirect?: RequestRedirect;
}

/** 요청 시 추가로 넘길 수 있는 옵션 */
export interface NextFetchKitRequestOptions {
  /** 요청별로 덮어쓸 헤더 */
  headers?: HeadersInit;
  /** 쿼리스트링 ?key=value 형태로 붙일 값 */
  query?: Record<string, string | number | boolean>;
  /** AbortController.signal */
  signal?: AbortSignal;
  /** 브라우저/Next.js fetch cache 옵션 */
  cache?: RequestCache;
  /**
   * Next.js App Router 전용 옵션<br/>
   * ISR(시간 기반 재검증)이나 태그 기반 재검증
   */
  next?: {
    /**
     * 캐시 수명(초 단위)<br/>
     * false면 무한 캐시(기본값)<br/>
     * 0이면 캐시 안함<br/>
     * 예: 3600 (1시간)
     */
    revalidate?: number | false;
    /**
     * 온디맨드 재검증을 위한 태그 목록<br/>
     * 예: ['users', 'posts']
     */
    tags?: string[];
  };
}

/** FetchKit이 실패한 요청에서 표준적으로 반환하는 에러 타입 */
export interface NextFetchKitError {
  /** 사용자 또는 개발자용 메세지 (fallback 포함) */
  message: string;
  /** HTTP 상태 코드 (0 = 네트워크 오류) */
  status: number;
  /** 서버/브라우저 fetch의 statusText */
  statusText: string;
  /** 서버에서 받은 body (에러 상세 정보 포함 가능) */
  data?: unknown;
}

/**
 * HTTP 메서드 Enum<br/>
 * REST API 요청 시 사용할 기본 HTTP 메서드를 정의.
 */
export enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

/**
 * FetchKit의 표준 응답 타입
 * @template T - 응답 payload의 타입
 */
export interface NextFetchKitResponse<T> {
  /** 요청 성공 여부 */
  success: boolean;
  /** HTTP 상태 코드 */
  status: number;
  /** 응답 데이터 (body) */
  data: T | null;
  /** HTTP 상태 텍스트 (예: OK, Bad Request 등) */
  statusText: string;
  /** 에러 발생 시 상세 정보를 담은 객체 (성공 시 undefined) */
  error?: NextFetchKitError;
}

/**
 * FetchKit이 제공하는 API 메서드 인터페이스<br/>
 * 각 메서드는 fetch 기반으로 호출되며, 제네릭을 통해
 * 요청 body와 응답 타입을 호출부에서 지정할 수 있습니다.
 */
export interface ApiMethods {
  /**
   * GET 요청
   *
   * @template TResponse - 응답 데이터 타입
   * @param path - 요청할 API 경로
   * @param options - 요청별 추가 옵션 (쿼리, 헤더 등)
   * @returns 서버 응답을 포함한 FetchKitResponse
   */
  get<TResponse>(
    path: string,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>>;

  /**
   * POST 요청
   *
   * @template TResponse - 응답 데이터 타입
   * @template TBody - 요청 body 타입
   * @param path - 요청할 API 경로
   * @param data - body payload (선택)
   * @param options - 요청별 추가 옵션
   * @returns 서버 응답을 포함한 FetchKitResponse
   */
  post<TResponse, TBody = unknown>(
    path: string,
    data?: TBody,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>>;

  /**
   * PATCH 요청
   *
   * @template TResponse - 응답 데이터 타입
   * @template TBody - 요청 body 타입 (Partial 업데이트)
   * @param path - 요청할 API 경로
   * @param data - 수정할 필드만 포함한 body
   * @param options - 요청별 추가 옵션
   * @returns 서버 응답을 포함한 FetchKitResponse
   */
  patch<TResponse, TBody = unknown>(
    path: string,
    data: Partial<TBody>,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>>;

  /**
   * PUT 요청
   *
   * @template TResponse - 응답 데이터 타입
   * @template TBody - 요청 body 타입 (Partial 업데이트)
   * @param path - 요청할 API 경로
   * @param data - 업데이트할 body 전체 또는 일부
   * @param options - 요청별 추가 옵션
   * @returns 서버 응답을 포함한 FetchKitResponse
   */
  put<TResponse, TBody = unknown>(
    path: string,
    data: Partial<TBody>,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>>;

  /**
   * DELETE 요청
   *
   * @template TResponse - 응답 데이터 타입
   * @template TBody - 요청 body 타입 (선택)
   * @param path - 요청할 API 경로
   * @param data - 필요 시 body를 포함할 수 있음 (대부분 null)
   * @param options - 요청별 추가 옵션
   * @returns 서버 응답을 포함한 FetchKitResponse
   */
  delete<TResponse, TBody = unknown>(
    path: string,
    data?: TBody,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>>;
}