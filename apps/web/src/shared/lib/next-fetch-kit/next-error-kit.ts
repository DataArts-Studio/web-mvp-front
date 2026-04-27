import { NextFetchError } from '@/shared/lib/next-fetch-kit/next-fetch-error';
import type { NextFetchKitResponse } from '@/shared/lib/next-fetch-kit/types';

/** 에러 처리 유틸리티 키트 */
export class NextErrorKit {
  /**
   * API 응답(NextFetchKitResponse)이 실패일 때 에러 객체로 변환<br/>
   * 용도: if (!res.success) throw NextErrorKit.from(res);
   * @param response - 실패한 API 응답 객체
   */
  static from<T>(response: NextFetchKitResponse<T>): NextFetchError {
    return new NextFetchError({
      message: response.error?.message || response.statusText || 'API Request Failed',
      status: response.status,
      statusText: response.statusText,
      data: response.data || response.error?.data,
    });
  }

  /**
   * unknown 타입의 에러를 NextFetchError로 정규화<br/>
   * try-catch의 catch(e) 블록에서 사용
   * @param error - catch 블록에서 잡힌 알 수 없는 에러
   */
  static normalize(error: unknown): NextFetchError {
    if (error instanceof NextFetchError) {
      return error;
    }

    if (error instanceof Error) {
      return new NextFetchError({
        message: error.message,
        status: 0,
        statusText: 'ClientError',
        data: null,
      });
    }

    return new NextFetchError({
      message: 'Unknown Error',
      status: 0,
      statusText: 'Unknown',
      data: error,
    });
  }
}