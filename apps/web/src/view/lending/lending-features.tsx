import React from 'react';

const features = [
  {
    title: '테스트 케이스 관리',
    description:
      '테스티아는 QA 도구로서 테스트 케이스를 체계적으로 작성하고 관리할 수 있습니다. 섹션별로 분류하고, 우선순위와 상태를 한눈에 파악하세요.',
  },
  {
    title: '테스트 실행 추적',
    description:
      '테스티아의 테스트 실행 기능으로 QA 진행 상황을 실시간으로 추적하세요. 통과, 실패, 블로커 등 결과를 즉시 기록하고 공유할 수 있습니다.',
  },
  {
    title: '프로젝트 구조화',
    description:
      '테스티아는 체계적인 테스트 관리를 위해 설계된 QA 툴입니다. 프로젝트, 스위트, 마일스톤 단위로 테스트를 구조화하고 한눈에 관리하세요.',
  },
];

const faqs = [
  {
    question: '테스티아(Testea)는 어떤 QA 도구인가요?',
    answer:
      '테스티아는 테스트 케이스 작성, 실행, 결과 추적을 한 곳에서 할 수 있는 무료 QA 도구입니다. 엑셀이나 스프레드시트 대신 테스티아로 테스트 문서를 체계적으로 관리하세요.',
  },
  {
    question: '테스티아는 무료인가요?',
    answer:
      '네, 테스티아는 무료 QA 툴입니다. 회원가입 없이 바로 프로젝트를 생성하고 테스트 케이스를 관리할 수 있습니다.',
  },
  {
    question: '다른 QA 도구와 어떤 차이가 있나요?',
    answer:
      '테스티아는 복잡한 설정 없이 바로 사용할 수 있는 간편한 테스트 관리 도구입니다. 테스트 케이스 작성, 테스트 실행, 결과 추적까지 직관적인 인터페이스로 QA 업무를 효율적으로 수행할 수 있습니다.',
  },
  {
    question: '소프트웨어 테스트 관리가 왜 필요한가요?',
    answer:
      '체계적인 테스트 관리는 소프트웨어 품질 보증(QA)의 핵심입니다. 테스트 케이스를 문서화하고 실행 결과를 추적하면 버그를 조기에 발견하고 제품 품질을 높일 수 있습니다.',
  },
];

export const LendingFeatures = () => {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
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
      aria-label="테스티아 QA 도구 소개"
      className="flex min-h-screen w-full flex-col justify-center border-t border-neutral-800 bg-bg-1 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-text1 sm:text-3xl">
          왜 <span className="text-primary">테스티아</span>인가요?
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-text1">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-text-2">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-6xl border-t border-neutral-800 px-4 pt-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-text1 sm:text-3xl">
          자주 묻는 질문
        </h2>
        <dl className="mx-auto max-w-3xl divide-y divide-neutral-800">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-6">
              <dt className="text-base font-semibold text-text1">{faq.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text-2">{faq.answer}</dd>
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
