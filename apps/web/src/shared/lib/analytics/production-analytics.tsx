'use client';

import { useEffect, useState } from 'react';

import { isAllowedAnalyticsHost } from '@/shared/lib/analytics/host';
import { GoogleAnalytics } from '@next/third-parties/google';

type ProductionAnalyticsProps = {
  gaId?: string;
};

export function ProductionAnalytics({ gaId }: ProductionAnalyticsProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!!gaId && isAllowedAnalyticsHost());
  }, [gaId]);

  if (!enabled || !gaId) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
