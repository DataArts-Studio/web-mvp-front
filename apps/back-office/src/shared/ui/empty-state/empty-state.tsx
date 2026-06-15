import type { ReactNode } from 'react';

import { Inbox } from 'lucide-react';

type EmptyStateSize = 'sm' | 'md';

type EmptyStateProps = {
  /** 주 메시지. 기본값 '데이터 없음' */
  message?: string;
  /** 보조 설명 (선택) */
  hint?: ReactNode;
  /** 아이콘 교체 (선택) */
  icon?: ReactNode;
  size?: EmptyStateSize;
  className?: string;
};

const sizeMap: Record<EmptyStateSize, { wrap: string; circle: string; icon: string; msg: string }> =
  {
    sm: { wrap: 'gap-2 py-8', circle: 'h-10 w-10', icon: 'h-5 w-5', msg: 'text-sm' },
    md: { wrap: 'gap-3 py-12', circle: 'h-14 w-14', icon: 'h-7 w-7', msg: 'text-sm' },
  };

/**
 * 빈 상태 표시. 데이터가 없거나 아직 연동되지 않은 영역에 일관되게 쓴다.
 */
export function EmptyState({
  message = '데이터 없음',
  hint,
  icon,
  size = 'md',
  className,
}: EmptyStateProps) {
  const s = sizeMap[size];
  return (
    <div
      className={['flex flex-col items-center justify-center text-center', s.wrap, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 text-gray-400 ${s.circle}`}
        aria-hidden="true"
      >
        {icon ?? <Inbox className={s.icon} />}
      </div>
      <p className={`text-text-secondary font-medium ${s.msg}`}>{message}</p>
      {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}
