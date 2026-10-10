import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { after, before, test } from 'node:test';

import { type EgressProxy, resolveAllowedAddress, startEgressProxy } from '../src/egress-proxy.js';
import { isBlockedAddress } from '../src/url-guard.js';

/**
 * 외부 네트워크 없이 프록시 정책을 검증한다. 대상 서버는 127.0.0.1 에 띄우고, 테스트 전용
 * 정책으로 "허용 대상" 하나(127.0.0.1)만 열어 둔다. 실제 정책(url-guard)은 loopback 을 거부한다.
 */

const SECRET = 'synthetic-internal-secret';
let target: http.Server;
let targetPort: number;
let proxy: EgressProxy;
let realPolicyProxy: EgressProxy;
const resolveCalls: string[] = [];
let streamClosed: (() => void) | undefined;

// 가짜 DNS. public.test 만 허용 대상(127.0.0.1)으로, 나머지는 내부 주소로 해석된다.
const fakeDns: Record<string, string[]> = {
  'public.test': ['127.0.0.1'],
  'internal.test': ['10.0.0.5'],
  'mixed.test': ['127.0.0.1', '169.254.169.254'],
};

async function fakeResolve(hostname: string): Promise<string[]> {
  resolveCalls.push(hostname);
  const addresses = fakeDns[hostname];
  if (!addresses) throw new Error('ENOTFOUND');
  return addresses;
}

// 테스트 정책: 127.0.0.1 만 "공개 주소"로 취급하고 나머지는 실제 정책을 따른다.
function testPolicy(address: string): boolean {
  return address === '127.0.0.1' ? false : isBlockedAddress(address);
}

before(async () => {
  target = http.createServer((req, res) => {
    if (req.url === '/stream') {
      // 끝나지 않는 응답. 프록시가 upstream 을 정리하면 이 연결이 닫힌다.
      const timer = setInterval(() => res.write('chunk'), 20);
      res.on('close', () => {
        clearInterval(timer);
        streamClosed?.();
      });
      res.write('chunk');
      return;
    }
    res.setHeader('x-seen-host', req.headers.host ?? '');
    res.end(SECRET);
  });
  await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', resolve));
  targetPort = (target.address() as net.AddressInfo).port;
  proxy = await startEgressProxy({ port: 0, resolve: fakeResolve, isBlocked: testPolicy });
  realPolicyProxy = await startEgressProxy({ port: 0, resolve: fakeResolve });
});

after(async () => {
  await proxy.close();
  await realPolicyProxy.close();
  await new Promise<void>((resolve) => target.close(() => resolve()));
});

/** 프록시에 CONNECT 를 보내 상태 줄을 받는다. 200 이면 터널로 GET 해 본문까지 읽는다. */
function connectThrough(
  proxyPort: number,
  authority: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(proxyPort, '127.0.0.1');
    let buffer = '';
    let tunneled = false;
    socket.setEncoding('utf8');
    socket.on('connect', () => {
      socket.write(`CONNECT ${authority} HTTP/1.1\r\nHost: ${authority}\r\n\r\n`);
    });
    socket.on('data', (chunk: string) => {
      buffer += chunk;
      if (!tunneled && buffer.includes('\r\n\r\n')) {
        const status = Number(buffer.split(' ')[1]);
        if (status !== 200) {
          socket.destroy();
          resolve({ status, body: '' });
          return;
        }
        tunneled = true;
        buffer = '';
        socket.write(`GET / HTTP/1.1\r\nHost: ${authority}\r\nConnection: close\r\n\r\n`);
      }
    });
    socket.on('end', () => resolve({ status: 200, body: buffer }));
    socket.on('error', reject);
  });
}

/** 프록시에 절대 URI 평문 HTTP 요청을 보낸다. */
function httpThrough(
  proxyPort: number,
  url: string
): Promise<{ status: number; body: string; seenHost?: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: proxyPort,
        method: 'GET',
        path: url,
        headers: { host: new URL(url).host },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (body += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            body,
            seenHost: res.headers['x-seen-host'] as string | undefined,
          })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('실제 정책은 loopback·사설·메타데이터 주소로의 터널을 거부한다', async () => {
  for (const authority of [
    `127.0.0.1:${targetPort}`,
    '[::1]:80',
    '169.254.169.254:80',
    '10.0.0.1:443',
  ]) {
    const result = await connectThrough(realPolicyProxy.port, authority);
    assert.equal(result.status, 403, authority);
    assert.ok(!result.body.includes(SECRET));
  }
});

test('DNS 가 내부 주소로 해석되면 거부한다', async () => {
  assert.equal((await connectThrough(proxy.port, 'internal.test:443')).status, 403);
  assert.equal((await httpThrough(proxy.port, 'http://internal.test/')).status, 403);
});

test('해석 주소 중 하나라도 금지 대역이면 거부한다', async () => {
  assert.equal((await connectThrough(proxy.port, `mixed.test:${targetPort}`)).status, 403);
});

test('해석 실패와 잘못된 CONNECT 대상은 거부한다', async () => {
  assert.equal((await connectThrough(proxy.port, 'unknown.test:443')).status, 403);
  assert.equal((await connectThrough(proxy.port, 'public.test')).status, 400);
  assert.equal((await connectThrough(proxy.port, 'user@public.test:443')).status, 400);
});

test('허용 대상은 한 번 해석한 주소로 터널을 연다', async () => {
  resolveCalls.length = 0;
  const result = await connectThrough(proxy.port, `public.test:${targetPort}`);
  assert.equal(result.status, 200);
  assert.ok(result.body.includes(SECRET));
  assert.deepEqual(resolveCalls, ['public.test']);
});

test('평문 HTTP 는 검사한 주소로 보내고 원래 Host 헤더를 유지한다', async () => {
  const result = await httpThrough(proxy.port, `http://public.test:${targetPort}/path?q=1`);
  assert.equal(result.status, 200);
  assert.equal(result.body, SECRET);
  assert.equal(result.seenHost, `public.test:${targetPort}`);
});

test('평문 HTTP 의 내부 주소 리터럴과 https 절대 URI 는 거부한다', async () => {
  assert.equal(
    (await httpThrough(realPolicyProxy.port, `http://127.0.0.1:${targetPort}/`)).status,
    403
  );
  assert.equal((await httpThrough(proxy.port, `https://public.test:${targetPort}/`)).status, 400);
});

test('resolveAllowedAddress 는 끝점·대괄호를 정규화하고 정책을 적용한다', async () => {
  assert.equal(await resolveAllowedAddress('[::1]', fakeResolve, isBlockedAddress), null);
  assert.equal(await resolveAllowedAddress('PUBLIC.TEST.', fakeResolve, testPolicy), '127.0.0.1');
  assert.equal(await resolveAllowedAddress('', fakeResolve, testPolicy), null);
});

test('평문 HTTP 응답 도중 클라이언트가 끊으면 upstream 연결도 닫는다', async () => {
  const closed = new Promise<void>((resolve) => (streamClosed = resolve));
  await new Promise<void>((resolve, reject) => {
    const url = `http://public.test:${targetPort}/stream`;
    const req = http.request(
      { host: '127.0.0.1', port: proxy.port, path: url, headers: { host: new URL(url).host } },
      (res) => {
        res.once('data', () => {
          req.destroy();
          resolve();
        });
      }
    );
    req.on('error', () => {});
    req.on('close', resolve);
    setTimeout(() => reject(new Error('no response')), 2000);
    req.end();
  });
  await Promise.race([
    closed,
    new Promise((_, reject) => setTimeout(() => reject(new Error('upstream left open')), 2000)),
  ]);
});
