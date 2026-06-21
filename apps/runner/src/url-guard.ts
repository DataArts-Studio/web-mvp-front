/**
 * 대상 URL SSRF 가드 (방어심화).
 *
 * 러너는 격리 컨테이너 전제지만, baseUrl/url 로 내부망·메타데이터 주소를 찌르는
 * 시도를 입력 단계에서 차단한다. (완전한 SSRF 방어는 컨테이너 egress 제한이 본 수단이며,
 * 공개 DNS 가 사설 IP 로 해석되는 rebinding 까지는 막지 못한다.)
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '[::1]',
  'metadata',
  'metadata.google.internal',
]);

/** 사설/루프백/링크로컬 IPv4 대역인지. */
function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // 링크로컬 / 클라우드 메타데이터
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * 허용되지 않은 대상이면 사유 문자열, 안전하면 null 을 반환한다.
 */
export function checkTargetUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return 'Invalid URL.';
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return 'Only http(s) URLs are allowed.';
  }

  const host = u.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) return 'Target host is not allowed.';
  if (host.endsWith('.internal') || host.endsWith('.local')) return 'Target host is not allowed.';
  if (isPrivateIpv4(host)) return 'Target host is not allowed.';
  // IPv6 루프백/사설(fc00::/7)/링크로컬(fe80::/10) 대략 차단
  if (
    host.startsWith('[::') ||
    host.startsWith('[fc') ||
    host.startsWith('[fd') ||
    host.startsWith('[fe8') ||
    host.startsWith('[fe9') ||
    host.startsWith('[fea') ||
    host.startsWith('[feb')
  ) {
    return 'Target host is not allowed.';
  }

  return null;
}
