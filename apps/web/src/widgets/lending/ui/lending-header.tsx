import React from 'react';

import { getTranslations } from 'next-intl/server';

export const LendingHeader = async () => {
  const t = await getTranslations('lending.hero');

  return (
    <section
      aria-labelledby="landing-title"
      className="flex w-full flex-col gap-4 text-left md:gap-6"
    >
      {/* title */}
      <h1
        id="landing-title"
        className="animate-fade-in-up text-4xl leading-[140%] font-bold sm:text-5xl md:text-7xl"
      >
        <span>{t('titleLine1')}</span>
        <br />
        <span className="text-primary">{t('titleHighlight')}</span>
        <span>{t('titleLine2')}</span>
      </h1>
      {/* sub-title */}
      <p
        aria-label={t('sectionAria')}
        className="animate-fade-in-up-delay text-text-2 text-sm leading-[160%] font-semibold sm:text-base md:text-lg"
      >
        {t('subtitle')}
      </p>
    </section>
  );
};
