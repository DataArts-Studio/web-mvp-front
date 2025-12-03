'use client';
import React from 'react';

import { FolderTree, Home, LayoutDashboard, ListChecks, Milestone, Zap } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const pages = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'milestones', label: '마일스톤', icon: Milestone },
  { id: 'test-suites', label: '테스트 스위트', icon: FolderTree },
  { id: 'test-cases', label: '테스트 케이스', icon: ListChecks },
];

export const MvpBottomNavbar = ({ currentPage, onPageChange }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-[24px] left-1/2 z-50 -translate-x-1/2 transform">
      <div className="rounded-[16px] border border-[rgba(11,181,127,0.2)] bg-[rgba(255,255,255,0.05)] px-[24px] py-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px] backdrop-filter">
        <div className="flex flex-row items-center gap-[8px]">
          {pages.map((page) => {
            const Icon = page.icon;
            const isActive = currentPage === page.id;

            return (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                className={`flex cursor-pointer flex-col items-center gap-[4px] rounded-[8px] px-[16px] py-[8px] transition-all ${
                  isActive
                    ? 'bg-[#0bb57f] text-white'
                    : 'text-[rgba(198,204,215,0.7)] hover:bg-[rgba(11,181,127,0.1)] hover:text-[#0bb57f]'
                }`}
              >
                <Icon className="h-[20px] w-[20px]" />
                <span className="font-['Pretendard:Medium',sans-serif] text-[12px] tracking-[-0.24px]">
                  {page.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
