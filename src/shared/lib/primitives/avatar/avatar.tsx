'use client';
import React from 'react';

import { Slot } from '@/shared/lib/slot';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type AvatarStatus = 'idle' | 'loaded' | 'error';

interface AvatarContextValue {
  status: AvatarStatus;
  setStatus: (status: AvatarStatus) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

const useAvatarContext = () => {
  const context = React.useContext(AvatarContext);
  if (!context) throw new Error('Avatar components must be used within <Avatar>.');
  return context;
};

interface AvatarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** 스크린 리더를 위한 대체 텍스트 (필수 권장) */
  label?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const AvatarRoot = ({ children, className, label, ref, ...props }: AvatarRootProps) => {
  const [status, setStatus] = React.useState<AvatarStatus>('idle');

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <div
        role="img"
        aria-label={label}
        ref={ref}
        {...props}
        className={className}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
};

// ------------------------------------------------------------------
// Image Component
// ------------------------------------------------------------------
interface AvatarImageProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

const AvatarImage = ({ children, className, ref, ...props }: AvatarImageProps) => {
  const { setStatus } = useAvatarContext();

  // 이미지 로드 성공 시 Context 상태 업데이트
  const handleLoad: React.ReactEventHandler<HTMLElement> = (_) => {
    setStatus('loaded');
  };

  // 이미지 로드 에러 시 Context 상태 업데이트
  const handleError: React.ReactEventHandler<HTMLElement> = (_) => {
    setStatus('error');
  };

  return (
    <Slot ref={ref} className={className} {...props} onLoad={handleLoad} onError={handleError}>
      {children}
    </Slot>
  );
};

// ------------------------------------------------------------------
// Fallback Component
// ------------------------------------------------------------------
interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const AvatarFallback = ({ children, className, ref, ...props }: AvatarFallbackProps) => {
  const { status } = useAvatarContext();
  const isVisible = status !== 'loaded';

  return (
    <div ref={ref} aria-hidden="true" className={className} hidden={!isVisible} {...props}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------
// Export (Dot Notation으로 묶기)
// ------------------------------------------------------------------
export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type { AvatarRootProps, AvatarImageProps, AvatarFallbackProps, AvatarContextValue };

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useAvatarContext as useAvatar };
