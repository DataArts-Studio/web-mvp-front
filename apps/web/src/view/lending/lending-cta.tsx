'use client';

import React from 'react';

import dynamic from 'next/dynamic';

import { LANDING_EVENTS, track } from '@/shared/lib/analytics';
import { DSButton } from '@testea/ui';

const ProjectCreateForm = dynamic(
  () => import('@/features/projects-create').then((mod) => ({ default: mod.ProjectCreateForm })),
  { ssr: false }
);

// 베타 안내 팝업 비활성화. 향후 동일 공지 필요 시 주석 해제.
// const BetaNoticePopup = dynamic(
//   () => import('@/features/beta-notice').then((mod) => ({ default: mod.BetaNoticePopup })),
//   { ssr: false }
// );

// DB 장애 복구 완료로 공지 비활성화. 향후 동일 공지 필요 시 주석 해제.
// const DbOutageNoticePopup = dynamic(
//   () => import('@/features/db-outage-notice').then(mod => ({ default: mod.DbOutageNoticePopup })),
//   { ssr: false },
// );

export const LendingCta = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <>
      <section aria-label="시작하기" className="relative z-10">
        <DSButton
          type="button"
          onClick={() => {
            track(LANDING_EVENTS.PROJECT_CREATE_START);
            setIsCreateModalOpen(true);
          }}
          className="flex h-16 w-80 min-w-[11.25rem] items-center justify-center gap-[0.63rem] p-5"
          aria-label="무료로 프로젝트 생성 시작하기"
        >
          무료로 시작하기
        </DSButton>
      </section>
      {isCreateModalOpen && <ProjectCreateForm onClick={() => setIsCreateModalOpen(false)} />}
      {/* <BetaNoticePopup /> */}
      {/* <DbOutageNoticePopup /> */}
    </>
  );
};
