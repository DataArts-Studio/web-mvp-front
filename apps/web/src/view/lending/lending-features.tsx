import React from 'react';

import { getLocale, getTranslations } from 'next-intl/server';

type Feature = { title: string; description: string };
type Faq = { question: string; answer: string };

export const LendingFeatures = async () => {
  const t = await getTranslations('lending.features');
  const tFaq = await getTranslations('lending.faq');
  const locale = await getLocale();

  const features = t.raw('items') as Feature[];
  const faqs = tFaq.raw('items') as Faq[];

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
      aria-label={t('sectionAria')}
      className="bg-bg-1 flex min-h-screen w-full flex-col justify-center border-t border-neutral-800 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-text1 mb-12 text-center text-2xl font-bold sm:text-3xl">
          {t('headingPrefix')}
          <span className="text-primary">{t('headingBrand')}</span>
          {t('headingSuffix')}
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="flex flex-col gap-3">
              <h3 className="text-text1 text-lg font-semibold">{feature.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-6xl border-t border-neutral-800 px-4 pt-16">
        <h2 className="text-text1 mb-8 text-center text-2xl font-bold sm:text-3xl">
          {tFaq('heading')}
        </h2>
        <dl className="mx-auto max-w-3xl divide-y divide-neutral-800">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-6">
              <dt className="text-text1 text-base font-semibold">{faq.question}</dt>
              <dd className="text-text-2 mt-2 text-sm leading-relaxed">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
};
