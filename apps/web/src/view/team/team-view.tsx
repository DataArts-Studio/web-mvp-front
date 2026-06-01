'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { Footer } from '@/widgets/footer';
import { Container, MainContainer } from '@testea/ui';
import { ChevronLeft, Coffee, Heart, Mail, MessageCircle, Sparkles } from 'lucide-react';

type ValueItem = { title: string; description: string };

const valueIcons = [Sparkles, Heart, Coffee];

export function TeamView() {
  const t = useTranslations('team');
  const values = t.raw('values') as ValueItem[];

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen w-full flex-col font-sans">
      <MainContainer className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-10 pb-24">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="text-text-3 hover:text-text-1 mb-6 inline-flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="typo-label-normal">{t('backHome')}</span>
        </Link>

        {/* 헤더 */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/teacup/tea-cup-happy.svg"
              alt={t('mascotAlt')}
              width={120}
              height={120}
              className="animate-bounce-gentle"
            />
          </div>
          <h1 className="typo-title-heading text-text-1 mb-4">{t('title')}</h1>
          <p className="typo-body1-normal text-text-2 mx-auto max-w-2xl">
            {t('subtitleLine1')}
            <br />
            {t('subtitleLine2')}
          </p>
        </div>

        {/* 스토리 섹션 */}
        <section className="mb-16">
          <div className="rounded-4 border-line-2 bg-bg-2 border p-8">
            <h2 className="typo-h2-heading text-primary mb-4 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              {t('story.heading')}
            </h2>
            <div className="typo-body2-normal text-text-2 space-y-4 leading-relaxed">
              <p>
                {t('story.paragraph1Prefix')}
                <strong className="text-text-1">{t('story.paragraph1Strong')}</strong>
                {t('story.paragraph1Suffix')}
              </p>
              <p>{t('story.paragraph2')}</p>
              <p>
                {t('story.paragraph3Prefix')}
                <strong className="text-text-1">{t('story.paragraph3Strong')}</strong>
                {t('story.paragraph3Suffix')}
              </p>
              <p>
                {t('story.paragraph4Prefix')}
                <strong className="text-primary">{t('story.paragraph4Strong')}</strong>
                {t('story.paragraph4Suffix')}
              </p>
            </div>
          </div>
        </section>

        {/* 핵심 가치 */}
        <section className="mb-16">
          <h2 className="typo-h2-heading text-text-1 mb-6 text-center">{t('valuesHeading')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = valueIcons[index];
              return (
                <div
                  key={value.title}
                  className="rounded-3 border-line-2 bg-bg-2 hover:border-primary/50 border p-6 text-center transition-colors"
                >
                  <div className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="typo-body1-heading text-text-1 mb-2">{value.title}</h3>
                  <p className="typo-body2-normal text-text-3">{value.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 연락처 */}
        <section>
          <div className="rounded-4 border-line-2 from-primary/5 to-primary/10 border bg-gradient-to-br p-8 text-center">
            <h2 className="typo-h2-heading text-text-1 mb-3">{t('contact.heading')}</h2>
            <p className="typo-body2-normal text-text-2 mb-6">{t('contact.description')}</p>
            <div className="flex justify-center gap-4">
              <a
                href="mailto:gettestea@gmail.com"
                className="rounded-2 border-line-2 bg-bg-2 typo-body2-heading text-text-2 hover:border-primary hover:text-primary inline-flex items-center gap-2 border px-4 py-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {t('contact.emailButton')}
              </a>
            </div>
          </div>
        </section>
      </MainContainer>

      <Footer />
    </Container>
  );
}
