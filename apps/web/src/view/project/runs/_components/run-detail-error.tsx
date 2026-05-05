'use client';

import React from 'react';
import Link from 'next/link';
import { MainContainer } from '@testea/ui';
import { XCircle } from 'lucide-react';

interface RunDetailErrorProps {
  projectSlug: string;
}

export const RunDetailError = ({ projectSlug }: RunDetailErrorProps) => {
  return (
    <MainContainer className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-text-1 font-semibold">테스트 실행을 불러올 수 없습니다.</p>
        <Link href={`/projects/${projectSlug}/runs`} className="text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    </MainContainer>
  );
};
