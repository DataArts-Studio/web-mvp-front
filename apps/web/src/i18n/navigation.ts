import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
 * 로케일 인지 네비게이션 래퍼.
 *
 * 마케팅 내부 이동(`/`, `/docs`, `/legal`, `/team`)에는 이 `Link`/`redirect` 를 쓴다
 * (영어 화면에서 `/en/...` 접두가 자동 부여됨). 단 제품(`/projects/...`)으로 가는 링크는
 * 접두를 붙이면 안 되므로 `next/link` 를 그대로 사용한다.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
