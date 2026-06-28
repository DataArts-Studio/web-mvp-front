const ANALYTICS_HOSTS = new Set(['qaground.gettestea.com']);

export function isAllowedAnalyticsHost(hostname: string | undefined = globalThis.location?.hostname): boolean {
  return !!hostname && ANALYTICS_HOSTS.has(hostname.toLowerCase());
}
