import childProcess from 'node:child_process';
import { readFileSync } from 'node:fs';

import { SANDBOX_UID, isolationAvailable } from './sandbox.js';

/**
 * spec uid 의 네트워크 경계.
 *
 * spec 은 임의 코드라 브라우저 프록시 설정을 무시하고 소켓을 직접 열 수 있다(fetch, net,
 * 프록시 없이 띄운 브라우저, DNS 질의). 그래서 커널에서 spec uid 의 모든 아웃바운드 연결을
 * 거부하고 127.0.0.1 의 egress 프록시 포트만 허용한다. 외부로 나가는 길은 프록시 하나뿐이고,
 * 프록시가 주소 정책을 적용한다. 메타데이터 서버(169.254.169.254)·사설망·loopback 의 다른
 * 서비스(러너 서버 포함)·DNS 도 이 규칙으로 막힌다.
 *
 * uid 소유자 매칭(-m owner)이라 uid 분리 격리가 켜진 경우에만 의미가 있다. 규칙 적용에는
 * root + CAP_NET_ADMIN + iptables 가 필요하다. 적용하지 못하면 /run 은 기본 거부한다.
 */

const CHAIN = 'TESTEA_SANDBOX_EGRESS';

let enforced = false;

/** spec uid 방화벽이 적용되어 있는지. */
export function egressEnforced(): boolean {
  return enforced;
}

/**
 * 방화벽 없이 /run 을 허용할지. 명시적 opt-out 이며, 켜면 spec 이 내부망·메타데이터에
 * 직접 닿을 수 있다. 배포 환경이 별도 네트워크 계층에서 egress 를 막을 때만 쓴다.
 */
export function unrestrictedEgressAllowed(): boolean {
  return process.env.RUNNER_ALLOW_UNRESTRICTED_EGRESS === '1';
}

function run(bin: string, args: string[]): number {
  const result = childProcess.spawnSync(bin, ['-w', ...args], { stdio: 'ignore', timeout: 10_000 });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function mustRun(bin: string, args: string[]): void {
  if (run(bin, args) !== 0) throw new Error(`${bin} ${args.join(' ')} failed`);
}

/** IPv6 가 켜져 있으면(::1 만 있어도) IPv6 규칙도 필요하다. */
function ipv6Configured(): boolean {
  try {
    return readFileSync('/proc/net/if_inet6', 'utf8').trim().length > 0;
  } catch {
    return false;
  }
}

function applyRules(bin: 'iptables' | 'ip6tables', proxyPort: number): void {
  const owner = ['-m', 'owner', '--uid-owner', String(SANDBOX_UID)];
  // 체인을 비우고 다시 채운다(재시작·재적용에도 규칙이 겹치지 않게).
  if (run(bin, ['-N', CHAIN]) !== 0) mustRun(bin, ['-F', CHAIN]);
  while (run(bin, ['-C', 'OUTPUT', ...owner, '-j', CHAIN]) === 0) {
    mustRun(bin, ['-D', 'OUTPUT', ...owner, '-j', CHAIN]);
  }
  if (bin === 'iptables') {
    mustRun(bin, [
      '-A',
      CHAIN,
      '-o',
      'lo',
      '-d',
      '127.0.0.1',
      '-p',
      'tcp',
      '--dport',
      String(proxyPort),
      '-j',
      'ACCEPT',
    ]);
  }
  // 프록시 포트 외 전부 거부. REJECT 라 spec 은 바로 실패를 받는다(타임아웃까지 매달리지 않음).
  mustRun(bin, ['-A', CHAIN, '-j', 'REJECT']);
  mustRun(bin, ['-I', 'OUTPUT', '1', ...owner, '-j', CHAIN]);
}

/**
 * spec uid 방화벽을 적용한다. 서버 시작 시 한 번 호출한다. 규칙은 root 만 바꿀 수 있어
 * spec uid 가 해제할 수 없다.
 *
 * @returns 적용에 성공했으면 true.
 */
export function applyEgressFirewall(proxyPort: number): boolean {
  enforced = false;
  if (!isolationAvailable()) return false;
  try {
    applyRules('iptables', proxyPort);
    if (ipv6Configured()) applyRules('ip6tables', proxyPort);
    enforced = true;
  } catch (error) {
    console.error(
      '[runner] spec egress firewall could not be applied:',
      error instanceof Error ? error.message : String(error)
    );
  }
  return enforced;
}
