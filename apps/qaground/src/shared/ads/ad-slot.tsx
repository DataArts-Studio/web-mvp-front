'use client';

import { useEffect, useRef } from 'react';

/**
 * Google AdSense 광고 슬롯.
 *
 * - NEXT_PUBLIC_ADSENSE_ID(예: ca-pub-...) 미주입이면 아무것도 렌더하지 않는다(운영 영향 0).
 * - 로더 스크립트는 layout 에서 production + 동일 env 일 때만 주입한다.
 * - 동의 배너 도입 전까지 비개인화(non-personalized) 광고로 요청한다.
 */

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

type AdsArray = unknown[] & { requestNonPersonalizedAds?: number };

export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_ID || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: AdsArray };
      const ads = (w.adsbygoogle = w.adsbygoogle ?? ([] as unknown as AdsArray));
      ads.requestNonPersonalizedAds = 1; // 비개인화 광고로 시작 (동의 배너 도입 시 해제)
      ads.push({});
      pushed.current = true;
    } catch {
      // 스크립트 미로딩(비production 등)이면 무시한다.
    }
  }, []);

  if (!ADSENSE_ID) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
