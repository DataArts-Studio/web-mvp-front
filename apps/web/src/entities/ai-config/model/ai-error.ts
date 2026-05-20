import { CryptoError } from '@/shared/lib/crypto';

/**
 * AI 초안 생성 흐름의 실패를 의미 단위로 분류한다.
 *
 * 기존에는 route 의 전역 catch 가 에러 메시지를 문자열 매칭
 * (`401`/`Unauthorized`/`invalid`)해 분기했고, 그 외 모든 실패
 * (복호화 실패·키 env 누락·provider 404/429/5xx·JSON 파싱 실패)가
 * 하나의 불투명 500 으로 붕괴됐다. AiError 로 원인을 타입화해
 * 적절한 HTTP 상태/사용자 메시지/Sentry 보고 여부를 결정한다.
 */
export type AiErrorKind =
  | 'CRYPTO_MISCONFIG' // 서버 암호화 키 env 누락/형식 오류 (운영 대응)
  | 'KEY_UNDECRYPTABLE' // 저장된 키를 현재 키로 복호화 불가 (재등록 필요)
  | 'PROVIDER_UNAUTHORIZED' // provider 401/403 — API 키 무효
  | 'PROVIDER_BAD_MODEL' // provider 404 — 모델 설정 오류
  | 'PROVIDER_RATE_LIMITED' // provider 429
  | 'PROVIDER_UNAVAILABLE' // provider 5xx
  | 'PROVIDER_ERROR' // provider 그 외 비-2xx (예상 밖)
  | 'RESPONSE_UNPARSABLE'; // LLM 응답이 JSON 으로 해석 불가

interface AiErrorSpec {
  httpStatus: number;
  /** 클라이언트에 그대로 노출되는 안전한 메시지 (원인 식별 가능) */
  userMessage: string;
  /** 예상 밖 결함이라 Sentry 로 알려야 하는지 (사용자 환경 이슈는 false) */
  report: boolean;
}

const SPECS: Record<AiErrorKind, AiErrorSpec> = {
  CRYPTO_MISCONFIG: {
    httpStatus: 500,
    userMessage: '서버 키 설정 문제로 AI 기능을 사용할 수 없습니다. 관리자에게 문의해주세요.',
    report: true,
  },
  KEY_UNDECRYPTABLE: {
    httpStatus: 409,
    userMessage:
      '저장된 API 키를 복호화할 수 없습니다. 설정 페이지에서 API 키를 다시 등록해주세요.',
    report: false,
  },
  PROVIDER_UNAUTHORIZED: {
    httpStatus: 401,
    userMessage: 'API 키가 유효하지 않습니다. 설정 페이지에서 키를 확인해주세요.',
    report: false,
  },
  PROVIDER_BAD_MODEL: {
    httpStatus: 400,
    userMessage: 'AI 모델 설정이 올바르지 않습니다. 설정 페이지에서 모델을 확인해주세요.',
    report: false,
  },
  PROVIDER_RATE_LIMITED: {
    httpStatus: 429,
    userMessage: 'AI 제공자의 요청 한도에 걸렸습니다. 잠시 후 다시 시도해주세요.',
    report: false,
  },
  PROVIDER_UNAVAILABLE: {
    httpStatus: 502,
    userMessage: 'AI 제공자가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
    report: false,
  },
  PROVIDER_ERROR: {
    httpStatus: 502,
    userMessage: 'AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    report: true,
  },
  RESPONSE_UNPARSABLE: {
    httpStatus: 502,
    userMessage: 'AI 응답을 해석할 수 없습니다. 다시 시도해주세요.',
    report: true,
  },
};

export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly httpStatus: number;
  readonly userMessage: string;
  readonly report: boolean;
  /** Sentry 진단용 부가 정보 — 사용자에게 노출하지 않음 */
  readonly context: Record<string, unknown>;

  constructor(kind: AiErrorKind, context: Record<string, unknown> = {}, cause?: unknown) {
    const spec = SPECS[kind];
    super(`AiError(${kind})`, cause === undefined ? undefined : { cause });
    this.name = 'AiError';
    this.kind = kind;
    this.httpStatus = spec.httpStatus;
    this.userMessage = spec.userMessage;
    this.report = spec.report;
    this.context = context;
  }

  /** 복호화 계층(CryptoError)을 도메인 에러로 변환 */
  static fromCryptoError(error: CryptoError): AiError {
    const kind: AiErrorKind =
      error.code === 'AUTH_FAILED' ? 'KEY_UNDECRYPTABLE' : 'CRYPTO_MISCONFIG';
    return new AiError(kind, { cryptoCode: error.code }, error);
  }

  /** provider 비-2xx 응답을 상태코드 기준으로 분류 */
  static fromProviderResponse(provider: string, status: number, bodyText: string): AiError {
    let kind: AiErrorKind;
    if (status === 401 || status === 403) kind = 'PROVIDER_UNAUTHORIZED';
    else if (status === 404) kind = 'PROVIDER_BAD_MODEL';
    else if (status === 429) kind = 'PROVIDER_RATE_LIMITED';
    else if (status >= 500) kind = 'PROVIDER_UNAVAILABLE';
    else kind = 'PROVIDER_ERROR';
    return new AiError(kind, {
      provider,
      providerStatus: status,
      providerBody: bodyText.slice(0, 500),
    });
  }

  static responseUnparsable(cause?: unknown): AiError {
    return new AiError('RESPONSE_UNPARSABLE', {}, cause);
  }
}
