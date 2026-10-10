import { getBetaAccessCookie } from '@/shared/magic-link/cookie';
import { verifyMagicToken } from '@/shared/magic-link/token';
import { BetaView } from '@/view/beta';

export const dynamic = 'force-dynamic';

/**
 * 베타 페이지. 쿠키의 매직링크 토큰을 검증해 접근을 가른다.
 * 유효하면 베타 대시보드(대기 현황·소식), 아니면 안내.
 */
export default async function BetaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await getBetaAccessCookie();
  const result = token ? await verifyMagicToken(token) : null;
  const email = result?.valid ? result.email : null;

  return <BetaView email={email} error={error ?? null} />;
}
