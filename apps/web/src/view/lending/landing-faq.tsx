import React from 'react';

import { getLocale, getTranslations } from 'next-intl/server';

import { type FaqItem, FaqPanel } from './faq-panel';

export const LandingFaq = async () => {
  const t = await getTranslations('lending.faq');
  const locale = await getLocale();
  const faqs = t.raw('items') as FaqItem[];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section
      aria-labelledby="landing-faq-title"
      className="relative mx-auto w-full max-w-[1200px] px-4 py-20 md:px-0 md:py-28"
    >
      <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-primary text-xs font-medium">{t('label')}</p>
          <h2
            id="landing-faq-title"
            className="text-text-1 text-3xl font-bold tracking-[-0.04em] md:text-[40px]"
          >
            {t('heading')}
          </h2>
        </div>
        <p className="text-text-3 text-sm">{t('subtitle')}</p>
      </div>
      <FaqPanel items={faqs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
};
