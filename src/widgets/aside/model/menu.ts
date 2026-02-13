import { FileText, Flag, FolderOpen, HelpCircle, Play, Settings } from 'lucide-react';

// 동적 경로를 위한 함수
export const createAsideMenus = (projectSlug: string) => {
  const basePath = `/projects/${projectSlug}`;

  return {
    sections: [
      {
        title: '테스트 관리',
        items: [
          { label: '테스트 케이스', href: `${basePath}/cases`, icon: FileText, matchPath: `${basePath}/cases` },
          { label: '테스트 스위트', href: `${basePath}/suites`, icon: FolderOpen, matchPath: `${basePath}/suites` },
          { label: '마일스톤', href: `${basePath}/milestones`, icon: Flag, matchPath: `${basePath}/milestones` },
          { label: '테스트 실행', href: `${basePath}/runs`, icon: Play, matchPath: `${basePath}/runs` },
        ],
      },
    ],
    bottom: [
      { label: '설정', href: `#`, icon: Settings, matchPath: `#` }, // ${basePath}/settings
      { label: '도움말', href: '#', icon: HelpCircle, matchPath: '' },
    ],
  };
};

// 레거시 호환용 (점진적 마이그레이션)
const ASIDE_SECTIONS = [
  {
    title: '테스트 관리',
    items: [
      { label: '마일스톤', href: '#', icon: Flag },
      { label: '테스트 스위트', href: '#', icon: FolderOpen },
      { label: '테스트 케이스', href: '#', icon: FileText },
      { label: '테스트 실행', href: '#', icon: Play },
    ],
  },
];

const ASIDE_BOTTOM = [
  { label: '설정', href: '#', icon: Settings },
  { label: '도움말', href: '#', icon: HelpCircle },
];

export type AsideSection = (typeof ASIDE_SECTIONS)[number];
export type AsideMenuItem = (typeof ASIDE_SECTIONS)[number]['items'][number] & { matchPath?: string };

export const MENUS = {
  ASIDE_SECTIONS,
  ASIDE_BOTTOM
}