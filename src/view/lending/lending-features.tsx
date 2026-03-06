import React from 'react';

const features = [
  {
    title: '테스트 케이스 관리',
    description:
      '테스티아에서 테스트 케이스를 체계적으로 작성하고 관리하세요. 섹션별로 분류하고, 우선순위와 상태를 한눈에 파악할 수 있습니다.',
  },
  {
    title: '테스트 실행 추적',
    description:
      '테스티아의 테스트 실행 기능으로 진행 상황을 실시간으로 추적하세요. 통과, 실패, 블로커 등 결과를 즉시 기록하고 공유할 수 있습니다.',
  },
  {
    title: '팀 협업',
    description:
      '테스티아는 QA 팀의 협업을 위해 설계되었습니다. 프로젝트 단위로 팀원을 초대하고, 테스트 결과를 함께 관리하세요.',
  },
];

export const LendingFeatures = () => {
  return (
    <section
      aria-label="Testea(테스티아) 주요 기능"
      className="w-full border-t border-neutral-800 bg-bg-1 py-16"
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
    </section>
  );
};
