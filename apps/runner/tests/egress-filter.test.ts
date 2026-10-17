import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import { after, test } from 'node:test';

// Linux root 조건만 모의한다. iptables 호출은 매 테스트에서 대체한다.
const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const getuid = Object.getOwnPropertyDescriptor(process, 'getuid');
const mode = process.env.RUNNER_EGRESS_FILTER;
Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
Object.defineProperty(process, 'getuid', { configurable: true, value: () => 0 });
after(() => {
  if (mode === undefined) delete process.env.RUNNER_EGRESS_FILTER;
  else process.env.RUNNER_EGRESS_FILTER = mode;
  Object.defineProperty(process, 'platform', platform);
  if (getuid) Object.defineProperty(process, 'getuid', getuid);
  else Reflect.deleteProperty(process, 'getuid');
});

type Call = { bin: string; args: string[] };

function mockSystem(
  t: import('node:test').TestContext,
  options: { fail?: (call: Call) => boolean; ipv6?: string } = {}
) {
  const calls: Call[] = [];
  t.mock.method(childProcess, 'spawnSync', (bin: string, args: string[]) => {
    const call = { bin, args };
    calls.push(call);
    // 기존 연결 삭제(-D)는 "더 없음"으로 끝나야 루프가 멈춘다.
    const failed = args[0] === '-D' || options.fail?.(call);
    return { status: failed ? 1 : 0 };
  });
  t.mock.method(fs, 'readFileSync', (path: string) => {
    if (path === '/etc/resolv.conf') return 'nameserver 169.254.169.254\n';
    if (path === '/proc/net/if_inet6') return options.ipv6 ?? '';
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  });
  return calls;
}

let caseIndex = 0;
const load = () => import(`../src/egress-filter.ts?case=${caseIndex++}`);

test('메타데이터·내부망·러너 포트를 막고 DNS 만 예외로 둔다.', async (t) => {
  delete process.env.RUNNER_EGRESS_FILTER;
  const calls = mockSystem(t);
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), true);
  assert.equal(filter.egressFilterActive(), true);
  assert.equal(filter.egressBlocksExecution(), false);

  const v4 = calls.filter((call) => call.bin === 'iptables').map((call) => call.args.join(' '));
  const dns = v4.findIndex((rule) => rule.includes('169.254.169.254 -p udp --dport 53 -j RETURN'));
  const metadata = v4.findIndex((rule) => rule.includes('169.254.0.0/16 -j REJECT'));
  assert.ok(dns >= 0 && metadata > dns, 'DNS 예외가 메타데이터 차단보다 앞서야 한다.');
  for (const cidr of ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10']) {
    assert.ok(
      v4.some((rule) => rule.includes(`${cidr} -j REJECT`)),
      cidr
    );
  }
  assert.ok(v4.some((rule) => rule.includes('127.0.0.0/8 -p tcp --dport 8080 -j REJECT')));
  assert.ok(
    v4.some((rule) => rule === '-I OUTPUT 1 -m owner --uid-owner 1000 -j RUNNER_SANDBOX_EGRESS')
  );
});

test('기본(required)에서 규칙을 못 걸면 실행을 막는다.', async (t) => {
  delete process.env.RUNNER_EGRESS_FILTER;
  mockSystem(t, { fail: (call) => call.args[0] === '-A' });
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), false);
  assert.equal(filter.egressBlocksExecution(), true);
});

test('iptables 가 안 되면 legacy 백엔드로 다시 시도한다.', async (t) => {
  delete process.env.RUNNER_EGRESS_FILTER;
  const calls = mockSystem(t, { fail: (call) => call.bin === 'iptables' && call.args[0] === '-F' });
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), true);
  assert.ok(calls.some((call) => call.bin === 'iptables-legacy' && call.args[0] === '-I'));
});

test('외부 IPv6 가 있는데 v6 규칙을 못 걸면 실패로 본다.', async (t) => {
  delete process.env.RUNNER_EGRESS_FILTER;
  mockSystem(t, {
    fail: (call) => call.bin.startsWith('ip6tables'),
    ipv6: 'fdaa0000000000000000000000000001 02 40 00 80     eth0\n',
  });
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), false);
  assert.equal(filter.egressBlocksExecution(), true);
});

test('IPv6 가 루프백뿐이면 v6 규칙 실패를 허용한다.', async (t) => {
  delete process.env.RUNNER_EGRESS_FILTER;
  mockSystem(t, {
    fail: (call) => call.bin.startsWith('ip6tables'),
    ipv6: '00000000000000000000000000000001 01 80 10 80       lo\n',
  });
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), true);
});

test('best-effort 는 규칙이 없어도 실행을 막지 않는다.', async (t) => {
  process.env.RUNNER_EGRESS_FILTER = 'best-effort';
  mockSystem(t, { fail: () => true });
  const filter = await load();
  assert.equal(filter.installEgressFilter(1000, 8080), false);
  assert.equal(filter.egressBlocksExecution(), false);
});
