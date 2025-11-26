import { describe, expect, it } from 'vitest';

import { NextFetchError } from '@/shared/lib/next-fetch-kit/next-fetch-error';

describe('NextFetchError', () => {
  it('inherits from Error and keeps response metadata', () => {
    const error = new NextFetchError({
      message: 'Request failed',
      status: 404,
      statusText: 'Not Found',
      data: { reason: 'missing' },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.data).toEqual({ reason: 'missing' });
    expect(error.name).toBe('NextFetchError');
  });
});