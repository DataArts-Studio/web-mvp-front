'use client';
import React from 'react';

import { Logo } from '@/shared';
import { AsideMenuItem, AsideSection, MENUS } from '@/widgets/aside/model';
import { AsideNavItem } from '@/widgets/aside/ui';

// TODO: 원시컴포넌트로 분리작업 진행해야함
export const Aside = () => {
  return (
    <aside
      id="aside"
      className="bg-bg-1 flex h-screen w-64 flex-col border-r border-bg-4 text-text-1"
    >
      {/* 사이드바 상단 */}
      <div className="border-b border-bg-4 px-6 pt-10 pb-6">
        <Logo />
        <p className="typo-label-normal text-text-3 mt-4 tracking-[0.2em]">
          테스트 도구
        </p>
      </div>

      {/* 사이드바 퀵메뉴 */}
      <div className="flex flex-col gap-8 px-4 pt-4 pb-4">
        {MENUS.ASIDE_SECTIONS.map((section: AsideSection) => (
          <section key={section.title} className="flex flex-col">
            <h2 className="typo-label-heading text-text-3 mb-3 uppercase tracking-[0.18em]">
              {section.title}
            </h2>

            <div className="flex flex-col gap-2">
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
          </section>
        ))}
      </div>

      {/* 사이드바 하단 */}
      <div className="mt-auto border-t border-bg-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          {MENUS.ASIDE_BOTTOM.map((item: AsideMenuItem) => (
            <AsideNavItem
              key={item.label}
              label={item.label}
              href={item.href}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};
