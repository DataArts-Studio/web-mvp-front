import { BlockList, isIP } from 'node:net';

/**
 * 대상 주소 정책. 입력 URL 검사(checkTargetUrl)와 egress 프록시(egress-proxy.ts)가 같은 판정을 쓴다.
 * 입력 검사만으로는 DNS·리다이렉트·spec 자체 통신을 막지 못하므로, 실제 경계는 프록시와
 * spec uid 방화벽(egress-firewall.ts)이다.
 */
const blocked = new BlockList();
// 외부 웹사이트 대상 러너에서는 특수 용도 대역 전체를 보수적으로 거부한다.
// https://www.iana.org/assignments/iana-ipv4-special-registry/
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 3],
] as const) {
  blocked.addSubnet(address, prefix, 'ipv4');
}

const globalIpv6 = new BlockList();
globalIpv6.addSubnet('2000::', 3, 'ipv6');
// 전환/특수 용도 주소를 통한 IPv4 우회도 허용하지 않는다.
// https://www.iana.org/assignments/iana-ipv6-special-registry/
for (const [address, prefix] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
] as const) {
  blocked.addSubnet(address, prefix, 'ipv6');
}

/** IP 주소가 외부 대상으로 허용되지 않는지. IP 가 아닌 값도 거부로 본다. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return blocked.check(address, 'ipv4');
  if (family === 6) return !globalIpv6.check(address, 'ipv6') || blocked.check(address, 'ipv6');
  return true;
}

/** 거부 사유 또는 null을 반환한다. null은 네트워크 격리 보장이 아니다. */
export function checkTargetUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'Invalid URL.';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Only http(s) URLs are allowed.';
  }

  // WHATWG URL로 정수/16진수 IPv4·IPv6를 정규화하고 DNS 절대 이름의 끝점을 제거한다.
  const host = url.hostname
    .toLowerCase()
    .replace(/\.+$/, '')
    .replace(/^\[|\]$/g, '');
  if (isIP(host)) {
    return isBlockedAddress(host) ? 'Target host is not allowed.' : null;
  }
  if (
    !host.includes('.') ||
    ['localhost', 'internal', 'local'].some((suffix) => host.endsWith(`.${suffix}`))
  ) {
    return 'Target host is not allowed.';
  }
  return null;
}
