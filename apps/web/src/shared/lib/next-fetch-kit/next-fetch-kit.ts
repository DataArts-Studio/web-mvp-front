import type {
  ApiMethods,
  NextFetchKitConfig,
  NextFetchKitRequestOptions,
  NextFetchKitResponse,
  NextFetchKitState,
} from '@/shared/lib/next-fetch-kit/types';
import { HttpMethods } from '@/shared/lib/next-fetch-kit/types';

export class NextFetchKit implements ApiMethods {
  private config: NextFetchKitState;

  constructor(config: NextFetchKitConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/+$/, ''),
      token: config.token,
      headers: config.headers,
      redirect: config.redirect,
    };
  }

  /** 현재 FetchKit 내부 상태 조회용 (디버깅/로깅 등) */
  getState(): NextFetchKitState {
    return { ...this.config };
  }

  /**
   * Authorization Bearer 토큰 갱신<br/>
   * 런타임에 토큰을 교체할 때 사용
   */
  setToken(token?: string) {
    this.config.token = token;
  }

  /**
   * 기본 Base URL 갱신<br/>
   * 런타임에 baseUrl을 교체해야 할 때 사용
   */
  setBaseUrl(baseUrl: string) {
    this.config.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /** URL 생성 (절대경로/상대경로 분기 처리) */
  private buildUrl(path: string, query?: NextFetchKitRequestOptions['query']): string {
    // 상대 경로
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    let finalUrl: string;

    if (this.config.baseUrl.startsWith('http')) {
      // 절대 경로일 경우 URL 객체 사용 (안정성)
      const urlObj = new URL(cleanPath, this.config.baseUrl);
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlObj.searchParams.append(key, String(value));
          }
        });
      }
      finalUrl = urlObj.toString();
    } else {
      // 상대 경로일 경우 문자열 조립 (Node.js 환경 크래시 방지)
      finalUrl = `${this.config.baseUrl}/${cleanPath}`;
      if (query) {
        const qs = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            qs.append(key, String(value));
          }
        });

        const qsString = qs.toString();
        if (qsString) finalUrl += `?${qsString}`;
      }
    }

    return finalUrl;
  }

  /** 공통 요청 처리 */
  private async request<TResponse, TBody = unknown>(
    method: HttpMethods,
    path: string,
    body?: TBody,
    options: NextFetchKitRequestOptions = {}
  ): Promise<NextFetchKitResponse<TResponse>> {
    let url: string;
    try {
      url = this.buildUrl(path, options.query);
    } catch (e) {
      // URL 생성 에러 발생 시 NextFetchKitError를 포함한 응답 반환
      return {
        success: false,
        status: 0,
        statusText: 'Invalid URL Configuration',
        data: null,
        error: {
          message: 'Invalid URL Configuration',
          status: 0,
          statusText: 'ClientError',
        },
      };
    }

    // 헤더 병합
    const headers = new Headers(this.config.headers);
    if (options.headers) {
      // 요청별 옵션은 같은 키가 있으면 덮어씀
      new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    }

    // 기본 Accept
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    // Auth 헤더
    if (this.config.token) {
      headers.set('Authorization', `Bearer ${this.config.token}`);
    }

    // Body 처리
    let requestBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json; charset=utf-8');
        }
      }
    }

    // RequestInit 구성
    const init: RequestInit & { next?: NextFetchKitRequestOptions['next'] } = {
      method: method.toUpperCase(),
      headers,
      body: requestBody,
      redirect: this.config.redirect,
      signal: options.signal,
      cache: options.cache,
      next: options.next,
    };

    try {
      const response = await fetch(url, init);
      let data: any = null;

      // 응답 본문 파싱 (204, JSON, Text 분기)
      if (response.status !== 204) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        try {
          if (isJson) data = await response.json();
          // JSON이 아닐 경우 텍스트로 읽어 에러 디버깅 가능하게 함
          else data = await response.text();
        } catch {
          data = null;
        }
      }

      // 응답 결과 반환 (에러 객체 포함)
      if (!response.ok) {
        // HTTP 에러처리
        const errorMessage = typeof data === 'string' ? data : data?.message || response.statusText;

        return {
          success: false,
          status: response.status,
          statusText: response.statusText,
          data: null,
          error: {
            message: errorMessage,
            status: response.status,
            statusText: response.statusText,
            data: data, // 서버가 보낸 원본 에러 데이터
          },
        };
      }

      // 성공 처리
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data,
      };
    } catch (error) {
      // 네트워크 연결 오류 또는 Abort 에러 처리 (status 0)
      const message = error instanceof Error ? error.message : 'Network Error';

      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        data: null,
        error: {
          message,
          status: 0,
          statusText: 'NetworkError',
          data: null,
        },
      };
    }
  }

  /* ────────────────────────────────────────
   * ApiMethods 구현부
   * ────────────────────────────────────────*/
  get<TResponse>(
    path: string,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>> {
    return this.request<TResponse>(HttpMethods.GET, path, undefined, options);
  }

  post<TResponse, TBody = unknown>(
    path: string,
    data?: TBody,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>> {
    return this.request<TResponse, TBody>(HttpMethods.POST, path, data, options);
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    data: Partial<TBody>,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>> {
    return this.request<TResponse, Partial<TBody>>(HttpMethods.PATCH, path, data, options);
  }

  put<TResponse, TBody = unknown>(
    path: string,
    data: Partial<TBody>,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>> {
    return this.request<TResponse, Partial<TBody>>(HttpMethods.PUT, path, data, options);
  }

  delete<TResponse, TBody = unknown>(
    path: string,
    data?: TBody,
    options?: NextFetchKitRequestOptions
  ): Promise<NextFetchKitResponse<TResponse>> {
    return this.request<TResponse, TBody>(HttpMethods.DELETE, path, data, options);
  }
}
