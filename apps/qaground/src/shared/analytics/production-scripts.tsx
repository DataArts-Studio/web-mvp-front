'use client';

import { useEffect, useState } from 'react';

import Script from 'next/script';

import { isAllowedAnalyticsHost } from '@/shared/analytics/host';
import { GoogleAnalytics } from '@next/third-parties/google';

type ProductionScriptsProps = {
  adsenseId?: string;
  gaId?: string;
};

export function ProductionScripts({ adsenseId, gaId }: ProductionScriptsProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isAllowedAnalyticsHost());
  }, []);

  if (!enabled) return null;

  return (
    <>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      {adsenseId && (
        <Script
          id="adsbygoogle-loader"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
        />
      )}
    </>
  );
}
