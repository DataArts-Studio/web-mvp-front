import { FileText, Flag, HelpCircle, LayoutDashboard, Settings } from 'lucide-react';

const ASIDE_SECTIONS = [
  {
    title: '테스트',
    items: [
      { label: '대시보드', href: '#', icon: LayoutDashboard },
      { label: '마일스톤', href: '#', icon: Flag },
      { label: '테스트 스위트', href: '#', icon: FileText },
      { label: '테스트 케이스', href: '#', icon: FileText },
    ],
  },
  {
    title: '빠른 시작',
    items: [
      { label: '마일스톤 생성', href: '#', icon: Flag },
      { label: '테스트케이스 생성', href: '#', icon: FileText },
      { label: '테스트스위트 생성', href: '#', icon: FileText },
    ],
  },
  {
    title: '테스트 실행',
    items: [
      { label: '마일스톤 실행', href: '#', icon: Flag },
      { label: '테스트케이스 실행', href: '#', icon: FileText },
      { label: '테스트스위트 실행', href: '#', icon: FileText },
    ],
  },
];

const ASIDE_BOTTOM = [
  { label: '설정', href: '#', icon: Settings },
  { label: '도움말', href: '#', icon: HelpCircle },
];

export type AsideSection = (typeof ASIDE_SECTIONS)[number];
export type AsideMenuItem = (typeof ASIDE_SECTIONS)[number]['items'][number];

export const MENUS = {
  ASIDE_SECTIONS,
  ASIDE_BOTTOM
}