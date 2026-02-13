'use client';

import React from 'react';
import { DSButton } from '@/shared/ui';

interface ProjectSearchButtonProps {
  onClick: () => void;
}

export const ProjectSearchButton = ({ onClick }: ProjectSearchButtonProps) => {
  return (
    <DSButton
      variant="text"
      type="button"
      onClick={onClick}
      className="text-text-2 hover:text-primary underline underline-offset-4"
    >
      내 프로젝트 찾기
    </DSButton>
  );
};
