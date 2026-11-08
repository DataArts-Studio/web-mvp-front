'use client';

import React from 'react';

import { onFirstInteraction } from '@/shared/lib/defer/on-first-interaction';

/**
 * 첫 상호작용이 없을 때 GTM 을 로드하기까지 기다리는 시간.
 * 이보다 빨리 아무것도 하지 않고 떠난 방문은 GA 에 잡히지 않는다(배포 전후 이탈률 비교 시 주의).
 */
const GTM_FALLBACK_MS = 4000;

/**
 * GTM 을 첫 상호작용(또는 GTM_FALLBACK_MS) 뒤에 로드한다.
 * lazyOnload 는 load 이벤트 직후 실행돼 모바일 첫 몇 초에 GA 스크립트(수백 ms 단일 작업)가 겹쳤다.
 * dataLayer 는 즉시 만들어 두므로, 로드 전에 track() 으로 쌓인 이벤트는 GTM 이 로드되며 그대로 처리한다.
 */
export const DeferredGtm = ({ gtmId }: { gtmId: string }) => {
  React.useEffect(() => {
    // 루트 레이아웃에서 한 번만 마운트되지만, 개발 모드 이중 실행 등으로 두 번 넣지 않게 막는다.
    if (document.querySelector('script[data-gtm-deferred]')) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    return onFirstInteraction(() => {
      if (document.querySelector('script[data-gtm-deferred]')) return;
      const script = document.createElement('script');
      script.async = true;
      script.dataset.gtmDeferred = '';
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
      document.head.appendChild(script);
    }, GTM_FALLBACK_MS);
  }, [gtmId]);

  return null;
};
