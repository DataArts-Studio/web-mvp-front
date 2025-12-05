'use client';
import React from 'react';

import { Logo } from '@/shared';
import { AsideMenuItem, AsideSection, MENUS } from '@/widgets/aside/model';
import { AsideNavItem } from '@/widgets/aside/ui';

// TODO: 원시컴포넌트로 분리작업 진행해야함
export const Aside = () => {
  return (
    <aside className="bg-bg-1 flex h-screen w-64 flex-col justify-between border-r border-zinc-800 text-zinc-200">
      {/* 사이드바 상단 */}
      <div className="px-6 pt-6">
        <Logo />
        <p className="text-text-3 mt-4 text-sm tracking-[0.2em]">테스트 도구</p>
      </div>

      {/* 사이드바 퀵메뉴*/}
      <div className="flex flex-col gap-10 px-4 pt-4">
        {MENUS.ASIDE_SECTIONS.map((section: AsideSection) => (
          <div key={section.title} className="flex flex-col">
            <h2 className="text-text-3 mb-3 text-sm font-semibold tracking-[0.18em] uppercase">
              {section.title}
            </h2>

            <div className="flex flex-col gap-1">
              {section.items.map((item: AsideMenuItem) => (
                <AsideNavItem
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  // 일단 액티브 테스트용
                  active={item.label === '마일스톤'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 사이드바 하단 */}
      <div className="mt-4 border-t border-zinc-800 px-4 py-4">
        <div className="flex flex-col gap-1">
          {MENUS.ASIDE_BOTTOM.map((item: AsideMenuItem) => (
            <AsideNavItem key={item.label} label={item.label} href={item.href} icon={item.icon} />
          ))}
        </div>
      </div>
    </aside>
  );
};
