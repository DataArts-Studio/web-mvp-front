import type { NextFetchKitError } from '@/shared/lib/next-fetch-kit/types';

/**
 * NextFetchKit에서 발생하는 표준 에러 클래스<br/>
 * try-catch 문에서 throw 하기 위해 Error를 상속받음
 */
export class NextFetchError extends Error implements NextFetchKitError {
  status: number;
  statusText: string;
  data?: unknown;

  /**
   * NextFetchError 클래스의 생성자
   * @param params - NextFetchKitError 인터페이스 형태의 에러 데이터
   */
  constructor(params: NextFetchKitError) {
    super(params.message);
    this.name = 'NextFetchError';
    this.status = params.status;
    this.statusText = params.statusText;
    this.data = params.data;

    // TypeScript 환경에서 프로토타입 체인 유지 (ES5 호환성 등)
    Object.setPrototypeOf(this, NextFetchError.prototype);
  }
}