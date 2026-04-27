import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NextFetchKit } from '@/shared/lib/next-fetch-kit/next-fetch-kit';

describe('NextFetchKit', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('builds requests with normalized base url and overridden headers', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      })
    );

    const kit = new NextFetchKit({
      baseUrl: 'https://api.example.com/',
      token: 'token-123',
      headers: { 'X-Base': 'base' },
    });

    const result = await kit.post<{ message: string }>(
      '/users',
      { hello: 'world' },
      { headers: { 'X-Base': 'override' } }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({ method: 'POST' })
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit & { headers: Headers };
    expect(init.headers.get('Authorization')).toBe('Bearer token-123');
    expect(init.headers.get('X-Base')).toBe('override');
    expect(init.method).toBe('POST');
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 200, data: { message: 'ok' } })
    );
  });

  it('returns normalized error when fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));

    const kit = new NextFetchKit({ baseUrl: 'https://api.example.com' });
    const response = await kit.get('/status');

    expect(response.success).toBe(false);
    expect(response.error?.message).toBe('Network down');
    expect(response.status).toBe(0);
  });
});