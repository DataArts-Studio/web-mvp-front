'use client';

import Image from 'next/image';

import { cn } from '@testea/util';

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
  showDefaultText?: boolean;
}

const sizeMap: Record<LoadingSpinnerSize, { width: number; height: number; textClass: string }> = {
  sm: { width: 64, height: 64, textClass: 'typo-caption' },
  md: { width: 120, height: 120, textClass: 'typo-body2-normal' },
  lg: { width: 160, height: 160, textClass: 'typo-body1-normal' },
  xl: { width: 200, height: 200, textClass: 'typo-heading2' },
};

export const LoadingSpinner = ({
  size = 'md',
  text,
  className,
  fullScreen = false,
  showDefaultText = true,
}: LoadingSpinnerProps) => {
  const { width, height, textClass } = sizeMap[size];
  const displayText = text ?? (showDefaultText ? '잠시만요, 준비하고 있어요' : undefined);

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="animate-bounce-gentle relative">
        <Image
          src="/teacup/tea-cup-happy.svg"
          alt="Loading..."
          width={width}
          height={height}
          className="animate-wiggle"
          priority
        />
        <div className="animate-shadow-pulse absolute -bottom-2 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-black/15 blur-md" />
      </div>
      {displayText && (
        <div className="flex flex-col items-center gap-3">
          <span className={cn('text-text-2 font-medium', textClass)}>{displayText}</span>
          <span className="flex gap-0.5">
            <span
              className="bg-text-2 animate-bounce-dot h-1.5 w-1.5 rounded-full"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="bg-text-2 animate-bounce-dot h-1.5 w-1.5 rounded-full"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="bg-text-2 animate-bounce-dot h-1.5 w-1.5 rounded-full"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
