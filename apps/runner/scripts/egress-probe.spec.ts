import { chromium, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import dns from 'node:dns/promises';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import net from 'node:net';

/**
 * verify-egress.sh 가 /run 으로 보내는 합성 탐침 spec. 운영 비밀값을 쓰지 않는다.
 * 각 경로의 도달 여부를 모아 일부러 실패시키고, 결과를 에러 메시지로 돌려준다.
 * REACHED 는 연결·읽기에 성공했다는 뜻이다. 프록시 경유 공개 대상만 REACHED 여야 한다.
 */

const INTERNAL = 'http://127.0.0.1:9999/';
const SYNTHETIC = 'SYNTHETIC-INTERNAL-SECRET';

function tcp(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port, timeout: 3000 });
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
    socket.once('error', reject);
  });
}

async function findServerEnviron(): Promise<string> {
  for (const pid of await readdir('/proc')) {
    if (!/^\d+$/.test(pid)) continue;
    const cmdline = await readFile(`/proc/${pid}/cmdline`, 'utf8').catch(() => '');
    if (cmdline.includes('dist/server.js')) return readFile(`/proc/${pid}/environ`, 'utf8');
  }
  throw new Error('server process not found');
}

test('egress probe', async ({ page, request }) => {
  const results: Record<string, string> = {};
  const attempt = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      results[name] = 'REACHED';
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      results[name] = `blocked(${String(err.code ?? err.message)
        .split('\n')[0]
        ?.slice(0, 50)})`;
    }
  };
  const mustContain = (text: string) => {
    if (!text.includes(SYNTHETIC)) throw new Error('secret not in response');
  };

  // spec 의 직접 통신 (방화벽이 막아야 한다)
  await attempt('direct fetch loopback', async () =>
    mustContain(await (await fetch(INTERNAL)).text())
  );
  await attempt('direct fetch runner server', () => fetch('http://127.0.0.1:8080/health'));
  await attempt('direct fetch metadata', () =>
    fetch('http://169.254.169.254/', { signal: AbortSignal.timeout(3000) })
  );
  await attempt('direct fetch public', () =>
    fetch('https://example.com/', { signal: AbortSignal.timeout(5000) })
  );
  await attempt('direct tcp public', () => tcp('1.1.1.1', 443));
  await attempt('direct dns query', () => dns.resolve4('example.com'));
  // Playwright Test 는 spec 이 띄운 브라우저·컨텍스트에도 use.proxy 를 기본 적용한다.
  // 확실한 직접 연결을 시험하려고 Chromium 실행 파일을 프록시 없이 직접 띄운다.
  await attempt('raw chromium without proxy', async () => {
    const result = spawnSync(
      chromium.executablePath(),
      ['--headless=new', '--no-sandbox', '--no-proxy-server', '--dump-dom', 'https://example.com/'],
      { encoding: 'utf8', timeout: 20000 }
    );
    if (!result.stdout?.includes('Example Domain')) throw new Error('page not loaded');
  });
  // 비교용: 같은 실행 파일을 프록시 설정과 함께 띄우면 도달해야 한다.
  await attempt('raw chromium with proxy', async () => {
    const result = spawnSync(
      chromium.executablePath(),
      [
        '--headless=new',
        '--no-sandbox',
        '--proxy-server=http://127.0.0.1:3128',
        '--dump-dom',
        'https://example.com/',
      ],
      { encoding: 'utf8', timeout: 20000 }
    );
    if (!result.stdout?.includes('Example Domain')) throw new Error('page not loaded');
  });

  // 프록시 경유 (내부는 거부, 공개는 허용)
  await attempt('page loopback', async () => {
    await page.goto(INTERNAL, { timeout: 5000 });
    mustContain(await page.content());
  });
  // 프록시 거부는 403 응답으로 오므로 응답 상태로 판정한다.
  await attempt('page metadata', async () => {
    const response = await page.goto('http://169.254.169.254/', { timeout: 5000 });
    if (!response?.ok()) throw new Error(`status ${response?.status()}`);
  });
  await attempt('request fixture loopback', async () =>
    mustContain(await (await request.get(INTERNAL)).text())
  );
  await attempt('page redirect to internal', async () => {
    await page.goto(`https://httpbin.org/redirect-to?url=${encodeURIComponent(INTERNAL)}`, {
      timeout: 15000,
    });
    mustContain(await page.content());
  });
  await attempt('page public via proxy', async () => {
    const response = await page.goto('https://example.com/', { timeout: 15000 });
    if (!response?.ok()) throw new Error(`status ${response?.status()}`);
  });

  // 파일·프로세스 경계 (#259 uid 분리 재확인)
  await attempt('read server environ', async () => {
    if (!(await findServerEnviron()).includes('RUNNER_SHARED_SECRET')) throw new Error('no secret');
  });
  await attempt('write app dist', () => writeFile('/app/dist/probe.txt', 'x'));

  throw new Error(`EGRESS_RESULTS ${JSON.stringify(results)}`);
});
