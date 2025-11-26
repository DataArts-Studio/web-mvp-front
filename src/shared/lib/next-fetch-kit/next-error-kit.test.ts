import { describe, expect, it } from 'vitest';

import { NextErrorKit } from '@/shared/lib/next-fetch-kit/next-error-kit';
import { NextFetchError } from '@/shared/lib/next-fetch-kit/next-fetch-error';
import type { NextFetchKitResponse } from '@/shared/lib/next-fetch-kit/types';

describe('NextErrorKit', () => {
  it('converts failed responses to NextFetchError', () => {
    const response: NextFetchKitResponse<null> = {
      success: false,
      status: 500,
      statusText: 'Server Error',
      data: null,
      error: { message: 'Boom', status: 500, statusText: 'Server Error', data: { detail: 'boom' } },
    };

    const error = NextErrorKit.from(response);

    expect(error).toBeInstanceOf(NextFetchError);
    expect(error.message).toBe('Boom');
    expect(error.status).toBe(500);
  });

  it('returns incoming NextFetchError untouched', () => {
    const incoming = new NextFetchError({
      message: 'Already normalized',
      status: 400,
      statusText: 'Bad Request',
      data: null,
    });

    expect(NextErrorKit.normalize(incoming)).toBe(incoming);
  });

  it('normalizes unknown errors into NextFetchError', () => {
    const normalized = NextErrorKit.normalize('unexpected');

    expect(normalized).toBeInstanceOf(NextFetchError);
    expect(normalized.message).toBe('Unknown Error');
    expect(normalized.status).toBe(0);
  });
});