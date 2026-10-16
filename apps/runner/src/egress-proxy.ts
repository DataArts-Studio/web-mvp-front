import { lookup } from 'node:dns/promises';
import http from 'node:http';
import net from 'node:net';

import { isBlockedAddress } from './url-guard.js';

/**
 * 러너의 외부 통신 관문(HTTP forward proxy). 서버(root)가 127.0.0.1 에서 띄운다.
 *
 * 브라우저가 대상 호스트를 직접 해석하면 입력 URL 검사 이후의 DNS 결과·리다이렉트·하위 요청을
 * 막을 수 없다. 그래서 모든 브라우저 트래픽을 이 프록시로 보내고, 프록시가 호스트를 한 번만
 * 해석해 모든 주소가 허용될 때 그 IP 로 직접 접속한다. 재해석하지 않으므로 DNS rebinding 으로
 * 검사와 접속 사이에 주소가 바뀌어도 내부로 가지 않는다. 리다이렉트는 브라우저가 새 요청으로
 * 다시 프록시를 거치므로 hop 마다 같은 검사를 받는다.
 *
 * - /capture: 우리 코드가 띄운 Chromium 을 이 프록시로 고정한다.
 * - /run: spec 은 임의 코드라 프록시 설정을 무시할 수 있다. spec uid 의 직접 연결은
 *   egress-firewall.ts 가 커널에서 막고, 이 프록시 포트만 열어 둔다.
 */

export const EGRESS_PROXY_HOST = '127.0.0.1';

/** 프록시 포트. spec uid 방화벽 규칙도 이 포트만 허용한다. */
export const EGRESS_PROXY_PORT = parsePort(process.env.RUNNER_EGRESS_PROXY_PORT, 3128);

export const EGRESS_PROXY_URL = `http://${EGRESS_PROXY_HOST}:${EGRESS_PROXY_PORT}`;

/**
 * Chromium 프록시 설정. Chromium 은 기본적으로 loopback 을 프록시 없이 직접 접속하므로
 * `<-loopback>` 으로 그 예외를 없앤다(loopback 도 프록시가 거부한다).
 */
export const BROWSER_PROXY = { server: EGRESS_PROXY_URL, bypass: '<-loopback>' };

/** WebRTC 는 프록시를 거치지 않는 UDP 를 쓸 수 있어 막는다. */
export const BROWSER_EGRESS_ARGS = ['--force-webrtc-ip-handling-policy=disable_non_proxied_udp'];

const CONNECT_TIMEOUT_MS = 10_000;

/** 요청 헤더 중 다음 hop 으로 넘기지 않는 것 (RFC 9110 7.6.1 + 프록시 전용). */
const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : fallback;
}

export interface EgressProxyOptions {
  /** 기본 127.0.0.1. */
  host?: string;
  /** 0 이면 임의 포트. 기본 EGRESS_PROXY_PORT. */
  port?: number;
  /** 호스트명 → 주소 목록. 기본은 OS 해석기. 테스트에서 교체한다. */
  resolve?: (hostname: string) => Promise<string[]>;
  /** 주소 정책. 기본은 url-guard 의 isBlockedAddress. 테스트에서 교체한다. */
  isBlocked?: (address: string) => boolean;
}

export interface EgressProxy {
  port: number;
  close: () => Promise<void>;
}

async function resolveWithOs(hostname: string): Promise<string[]> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

/**
 * 호스트를 한 번만 해석해, 모든 주소가 허용될 때 접속할 주소를 돌려준다. 하나라도 금지
 * 대역이면 거부한다(해석기가 주소 순서를 바꿔도 내부 주소로 가지 않게). 거부면 null.
 */
export async function resolveAllowedAddress(
  hostname: string,
  resolve: (hostname: string) => Promise<string[]>,
  isBlocked: (address: string) => boolean
): Promise<string | null> {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.+$/, '');
  if (!host) return null;
  let addresses: string[];
  if (net.isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = await resolve(host);
    } catch {
      return null;
    }
  }
  if (addresses.length === 0 || addresses.some(isBlocked)) return null;
  return addresses[0] ?? null;
}

/** CONNECT 대상(`host:port`, `[v6]:port`)을 해석한다. 형식이 틀리면 null. */
function parseConnectTarget(target: string | undefined): { hostname: string; port: number } | null {
  // CONNECT 는 포트가 필수다. URL 파서는 기본 포트(80)를 빈 문자열로 바꾸므로 원문으로 확인한다.
  if (!target || !/:\d+$/.test(target)) return null;
  let url: URL;
  try {
    url = new URL(`http://${target}`);
  } catch {
    return null;
  }
  const port = url.port === '' ? 80 : Number(url.port);
  if (!url.hostname || !Number.isInteger(port) || port <= 0 || port > 65535) return null;
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
  return { hostname: url.hostname, port };
}

function rejectSocket(socket: net.Socket, status: string): void {
  if (socket.destroyed) return;
  socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

export function startEgressProxy(options: EgressProxyOptions = {}): Promise<EgressProxy> {
  const resolve = options.resolve ?? resolveWithOs;
  const isBlocked = options.isBlocked ?? isBlockedAddress;

  const server = http.createServer();
  // CONNECT 터널 소켓은 http 서버의 연결 관리에서 빠지므로 종료 시 직접 닫는다.
  const sockets = new Set<net.Socket>();
  server.on('connection', (socket: net.Socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  // HTTPS·WebSocket over TLS: 터널을 열기 전에 대상 주소를 검사하고 검사한 IP 로 접속한다.
  server.on('connect', (req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
    clientSocket.on('error', () => clientSocket.destroy());
    void (async () => {
      const target = parseConnectTarget(req.url);
      if (!target) return rejectSocket(clientSocket, '400 Bad Request');
      const address = await resolveAllowedAddress(target.hostname, resolve, isBlocked);
      if (!address) return rejectSocket(clientSocket, '403 Forbidden');
      if (clientSocket.destroyed) return;

      const upstream = net.connect({ host: address, port: target.port });
      let connected = false;
      upstream.setTimeout(CONNECT_TIMEOUT_MS, () => upstream.destroy());
      upstream.once('connect', () => {
        connected = true;
        upstream.setTimeout(0);
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length > 0) upstream.write(head);
        upstream.pipe(clientSocket);
        clientSocket.pipe(upstream);
      });
      upstream.on('error', () => {
        if (connected) clientSocket.destroy();
        else rejectSocket(clientSocket, '502 Bad Gateway');
      });
      upstream.on('close', () => {
        if (connected) clientSocket.destroy();
        else rejectSocket(clientSocket, '502 Bad Gateway');
      });
      clientSocket.on('close', () => upstream.destroy());
    })().catch(() => clientSocket.destroy());
  });

  // 평문 HTTP: 절대 URI 요청만 받는다. 검사한 IP 로 접속하고 Host 헤더는 원래 값을 유지한다.
  server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
    void (async () => {
      let url: URL;
      try {
        url = new URL(req.url ?? '');
      } catch {
        res.writeHead(400).end();
        return;
      }
      if (url.protocol !== 'http:' || url.username || url.password) {
        res.writeHead(400).end();
        return;
      }
      const address = await resolveAllowedAddress(url.hostname, resolve, isBlocked);
      if (!address) {
        res.writeHead(403).end();
        return;
      }

      const headers: http.OutgoingHttpHeaders = { ...req.headers, host: url.host };
      for (const name of HOP_BY_HOP_HEADERS) delete headers[name];

      const upstream = http.request({
        host: address,
        port: url.port ? Number(url.port) : 80,
        method: req.method,
        path: `${url.pathname}${url.search}`,
        headers,
        agent: false,
        timeout: CONNECT_TIMEOUT_MS,
      });
      upstream.on('response', (upstreamRes) => {
        const responseHeaders = { ...upstreamRes.headers };
        for (const name of HOP_BY_HOP_HEADERS) delete responseHeaders[name];
        res.writeHead(upstreamRes.statusCode ?? 502, responseHeaders);
        upstreamRes.pipe(res);
      });
      upstream.on('timeout', () => upstream.destroy());
      upstream.on('error', () => {
        if (!res.headersSent) res.writeHead(502).end();
        else res.destroy();
      });
      // 클라이언트가 응답을 다 받기 전에 끊으면(요청 취소·spec 종료) upstream 도 정리한다.
      res.on('close', () => {
        if (!res.writableFinished) upstream.destroy();
      });
      req.pipe(upstream);
    })().catch(() => {
      if (!res.headersSent) res.writeHead(502).end();
      else res.destroy();
    });
  });

  // 평문 WebSocket 업그레이드는 지원하지 않는다(wss 는 CONNECT 로 처리된다).
  server.on('upgrade', (_req: http.IncomingMessage, socket: net.Socket) => {
    rejectSocket(socket, '403 Forbidden');
  });

  return new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(options.port ?? EGRESS_PROXY_PORT, options.host ?? EGRESS_PROXY_HOST, () => {
      server.off('error', rejectPromise);
      const port = (server.address() as net.AddressInfo).port;
      resolvePromise({
        port,
        close: () =>
          new Promise<void>((done) => {
            for (const socket of sockets) socket.destroy();
            server.close(() => done());
          }),
      });
    });
  });
}
