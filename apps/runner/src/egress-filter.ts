import childProcess from 'node:child_process';
import fs from 'node:fs';

/**
 * sandbox uid 의 나가는 연결 차단.
 *
 * spec 은 임의 Node 코드라, URL 가드(url-guard.ts)가 검사하는 대상 URL 과 무관하게 스스로
 * 아무 주소로나 요청을 보낼 수 있다. 그중 위험한 목적지를 커널(iptables owner match)에서 막는다.
 * - 169.254.0.0/16: 클라우드 메타데이터 서버(서비스 계정 토큰). DNS(53)만 예외로 둔다.
 *   Cloud Run 의 리졸버가 169.254.169.254:53 이기 때문이다.
 * - 사설·공유·링크로컬 대역: 내부망.
 * - 루프백의 러너 포트: 컨테이너 안에서 IAM 을 거치지 않고 서버를 직접 부르는 경로.
 *
 * 규칙은 sandbox uid 에만 건다. 서버(root)의 응답·플랫폼 통신은 건드리지 않는다.
 * root 인 서버만 규칙을 설치할 수 있고, spec uid 는 규칙을 바꾸지 못한다.
 */

const CHAIN = 'RUNNER_SANDBOX_EGRESS';

const BLOCKED_V4 = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.168.0.0/16',
];
const BLOCKED_V6 = ['fc00::/7', 'fe80::/10'];

export type EgressMode = 'required' | 'best-effort' | 'off';

/**
 * 기본은 required(fail-closed): 규칙을 못 걸면 spec·캡처 실행을 거부한다.
 * 규칙 설치가 막힌 플랫폼에서 의도적으로 낮출 때만 best-effort/off 를 쓴다.
 */
export function egressMode(): EgressMode {
  const value = process.env.RUNNER_EGRESS_FILTER;
  return value === 'best-effort' || value === 'off' ? value : 'required';
}

let active = false;

export function egressFilterActive(): boolean {
  return active;
}

/** required 인데 규칙이 없으면 비신뢰 코드를 실행하면 안 된다. */
export function egressBlocksExecution(): boolean {
  return egressMode() === 'required' && !active;
}

function exec(bin: string, args: string[]): boolean {
  const result = childProcess.spawnSync(bin, args, { stdio: 'ignore', timeout: 5_000 });
  return !result.error && result.status === 0;
}

/** /etc/resolv.conf 의 리졸버 주소. 차단 대역 안에 있어도 53 포트는 열어 둔다. */
function nameservers(family: 4 | 6): string[] {
  try {
    return fs
      .readFileSync('/etc/resolv.conf', 'utf8')
      .split('\n')
      .map((line) => line.trim().match(/^nameserver\s+(\S+)/)?.[1])
      .filter((value): value is string => !!value)
      .filter((value) => (family === 6 ? value.includes(':') : !value.includes(':')));
  } catch {
    return [];
  }
}

/** 루프백 외 인터페이스에 IPv6 주소가 있는지. 없으면 v6 규칙 실패를 허용한다. */
function hasExternalIpv6(): boolean {
  try {
    return fs
      .readFileSync('/proc/net/if_inet6', 'utf8')
      .split('\n')
      .some((line) => {
        const iface = line.trim().split(/\s+/)[5];
        return !!iface && iface !== 'lo';
      });
  } catch {
    return false;
  }
}

function installWith(
  bin: string,
  uid: number,
  port: number,
  blocked: string[],
  family: 4 | 6
): boolean {
  const loopback = family === 4 ? '127.0.0.0/8' : '::1/128';
  // 재시작·재설치에도 규칙이 겹치지 않게 체인을 비우고 OUTPUT 연결을 하나만 둔다.
  exec(bin, ['-N', CHAIN]);
  if (!exec(bin, ['-F', CHAIN])) return false;
  while (exec(bin, ['-D', 'OUTPUT', '-m', 'owner', '--uid-owner', String(uid), '-j', CHAIN])) {
    // 이전에 걸린 연결을 모두 걷어낸다.
  }

  const rules: string[][] = [];
  for (const server of nameservers(family)) {
    rules.push(['-d', server, '-p', 'udp', '--dport', '53', '-j', 'RETURN']);
    rules.push(['-d', server, '-p', 'tcp', '--dport', '53', '-j', 'RETURN']);
  }
  rules.push(['-d', loopback, '-p', 'tcp', '--dport', String(port), '-j', 'REJECT']);
  for (const cidr of blocked) rules.push(['-d', cidr, '-j', 'REJECT']);

  for (const rule of rules) {
    if (!exec(bin, ['-A', CHAIN, ...rule])) return false;
  }
  if (!exec(bin, ['-I', 'OUTPUT', '1', '-m', 'owner', '--uid-owner', String(uid), '-j', CHAIN])) {
    return false;
  }
  return exec(bin, ['-C', 'OUTPUT', '-m', 'owner', '--uid-owner', String(uid), '-j', CHAIN]);
}

function installFamily(uid: number, port: number, family: 4 | 6): boolean {
  const bins = family === 4 ? ['iptables', 'iptables-legacy'] : ['ip6tables', 'ip6tables-legacy'];
  const blocked = family === 4 ? BLOCKED_V4 : BLOCKED_V6;
  return bins.some((bin) => installWith(bin, uid, port, blocked, family));
}

/**
 * 서버 기동 시 한 번 호출한다. 성공 여부를 기억해 /run·/capture 가 참조한다.
 * @returns 규칙이 걸렸으면 true.
 */
export function installEgressFilter(uid: number, port: number): boolean {
  if (egressMode() === 'off' || process.platform !== 'linux' || process.getuid?.() !== 0) {
    active = false;
    return false;
  }
  const v4 = installFamily(uid, port, 4);
  const v6 = installFamily(uid, port, 6) || !hasExternalIpv6();
  active = v4 && v6;
  return active;
}
