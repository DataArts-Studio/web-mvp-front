// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '../../../../app/api/auth/github/callback/route';
import { OAUTH_STATE_COOKIE, createOAuthState, verifyOAuthState } from './oauth-state';

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';

describe('GitHub OAuth state 대조', () => {
  it('발급한 nonce 와 일치하면 쿠키의 프로젝트를 돌려준다.', () => {
    const { nonce, cookieValue } = createOAuthState(PROJECT_ID);
    expect(verifyOAuthState(nonce, cookieValue)).toBe(PROJECT_ID);
  });

  it.each([
    ['다른 nonce', 'attacker-state'],
    ['state 없음', null],
    ['프로젝트 id 를 state 로 넣은 예전 방식', PROJECT_ID],
  ])('%s 는 거부한다.', (_label, state) => {
    const { cookieValue } = createOAuthState(PROJECT_ID);
    expect(verifyOAuthState(state, cookieValue)).toBeNull();
  });

  it('쿠키가 없거나 형식이 깨지면 거부한다.', () => {
    const { nonce } = createOAuthState(PROJECT_ID);
    expect(verifyOAuthState(nonce, undefined)).toBeNull();
    expect(verifyOAuthState(nonce, nonce)).toBeNull();
    expect(verifyOAuthState(nonce, `${nonce}.`)).toBeNull();
  });
});

function callback(query: string, cookie?: string) {
  const req = new NextRequest(`https://gettestea.com/api/auth/github/callback?${query}`, {
    headers: cookie ? { cookie: `${OAUTH_STATE_COOKIE}=${cookie}` } : {},
  });
  return GET(req);
}

describe('GitHub OAuth 콜백', () => {
  it('state 가 쿠키와 맞으면 code 와 쿠키의 프로젝트를 같은 오리진에만 보낸다.', async () => {
    const { nonce, cookieValue } = createOAuthState(PROJECT_ID);
    const res = await callback(`code=good-code&state=${nonce}`, cookieValue);
    const html = await res.text();
    expect(html).toContain('"success":true');
    expect(html).toContain('"code":"good-code"');
    expect(html).toContain(`"projectId":"${PROJECT_ID}"`);
    expect(html).toContain('"https://gettestea.com"');
    // 한 번 쓴 state 쿠키는 지운다.
    expect(res.headers.get('set-cookie')).toMatch(new RegExp(`${OAUTH_STATE_COOKIE}=;.*Max-Age=0`));
  });

  it('공격자가 자기 code·state 를 피해자 브라우저로 보내면 code 를 넘기지 않는다.', async () => {
    const victim = createOAuthState(PROJECT_ID);
    const attacker = createOAuthState('attacker-project');
    const res = await callback(`code=attacker-code&state=${attacker.nonce}`, victim.cookieValue);
    const html = await res.text();
    expect(html).toContain('"success":false');
    expect(html).not.toContain('attacker-code');
  });

  it('state 쿠키 없이 들어온 콜백은 거부한다.', async () => {
    const res = await callback(`code=some-code&state=${PROJECT_ID}`);
    const html = await res.text();
    expect(html).toContain('"success":false');
    expect(html).not.toContain('some-code');
  });
});
