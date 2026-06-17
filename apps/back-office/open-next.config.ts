import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext Cloudflare 어댑터 설정.
 * 증분 캐시(R2)·태그 캐시 등을 붙이려면 여기서 구성한다 (현재는 기본값).
 * https://opennext.js.org/cloudflare
 */
export default defineCloudflareConfig();
