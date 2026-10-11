'use client';

import React from 'react';
import { createPortal } from 'react-dom';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { cn } from '@/shared';
import { LANDING_EVENTS, track } from '@/shared/lib/analytics';
import { DSButton } from '@testea/ui';

const ProjectCreateForm = dynamic(
  () => import('@/features/projects-create').then((mod) => ({ default: mod.ProjectCreateForm })),
  { ssr: false }
);

interface StartButtonProps {
  /** GA 이벤트의 trigger_location. 어느 버튼으로 시작했는지 구분한다. */
  location: 'landing_hero' | 'landing_run_complete';
  ariaLabel: string;
  className?: string;
}

/** "무료로 시작하기" 버튼. 누르면 프로젝트 생성 모달을 연다. */
export const StartButton = ({ location, ariaLabel, className }: StartButtonProps) => {
  const t = useTranslations('lending.cta');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <>
      <DSButton
        type="button"
        size="medium"
        onClick={() => {
          track(LANDING_EVENTS.PROJECT_CREATE_START, { trigger_location: location });
          setIsCreateModalOpen(true);
        }}
        className={cn(
          'hover:bg-secondary active:bg-secondary h-14 rounded-md px-7 text-base font-bold',
          className
        )}
        aria-label={ariaLabel}
      >
        {t('button')}
      </DSButton>
      {/* 버튼이 transform 애니메이션 안에 있어 fixed 모달이 그 안에 갇히지 않도록 body 로 띄운다. */}
      {isCreateModalOpen &&
        createPortal(
          <ProjectCreateForm onClick={() => setIsCreateModalOpen(false)} />,
          document.body
        )}
    </>
  );
};
