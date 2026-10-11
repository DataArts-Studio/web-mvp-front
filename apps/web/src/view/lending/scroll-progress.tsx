'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { useBetaBanner } from '@/widgets/global-header';

/**
 * 상단 메뉴 바 뒤에 까는 배경과, 바 아래에서 스크롤 비율만큼 차오르는 진행 선.
 * 메뉴 바 자체(GlobalHeader)는 다른 페이지와 같이 쓰므로 건드리지 않고 랜딩에서만 덧댄다.
 */
export const ScrollProgress = () => {
  const t = useTranslations('lending');
  const { isVisible: isBannerVisible } = useBetaBanner();
  const fillRef = React.useRef<HTMLDivElement>(null);
  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      // 매 프레임 리렌더를 피하려고 채움은 DOM 에 바로 쓰고, 보조기술용 값만 정수로 갱신한다.
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${ratio})`;
      setPercent(Math.round(ratio * 100));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className={`bg-bg-1/80 pointer-events-none fixed right-0 left-0 z-[9] h-16 border-b border-white/5 backdrop-blur-md transition-[top] duration-200 ${
        isBannerVisible ? 'top-10' : 'top-0'
      }`}
    >
      <div
        role="progressbar"
        aria-label={t('progressAria')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="absolute right-0 -bottom-px left-0 h-[3px]"
      >
        <div
          ref={fillRef}
          className="bg-primary h-full origin-left shadow-[0_0_12px_rgba(11,181,127,0.6)]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
};
