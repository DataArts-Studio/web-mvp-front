'use client';

import { useEffect, useState } from 'react';

/**
 * 벨로그 스타일 오른쪽 sticky 목차. 스크롤에 따라 현재 섹션을 하이라이트한다.
 * items: [번호, 제목, 섹션 id] 튜플 배열.
 */
export const GuideToc = ({ items }: { items: string[][] }) => {
  const [active, setActive] = useState(items[0]?.[2] ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    items.forEach(([, , id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="목차">
      <p className="text-text-3 mb-3 font-mono text-xs tracking-wide">목차</p>
      <ul className="border-line-2 flex flex-col border-l">
        {items.map(([n, title, id]) => {
          const on = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                  on
                    ? 'border-primary text-text-1 font-medium'
                    : 'text-text-3 hover:text-text-2 border-transparent'
                }`}
              >
                <span className="font-mono text-[11px] opacity-70">{n}</span>
                {title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
