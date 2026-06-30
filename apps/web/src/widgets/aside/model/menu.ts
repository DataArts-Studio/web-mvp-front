import {
  Bot,
  CheckSquare,
  Dumbbell,
  FileText,
  Flag,
  FolderOpen,
  HelpCircle,
  ListChecks,
  Play,
  Settings,
  Trash2,
} from 'lucide-react';

// 동적 경로를 위한 함수.
// label/title 은 표시 텍스트가 아니라 `aside` 네임스페이스의 메시지 키다(소비처 aside.tsx 에서
// useTranslations 로 번역). 안정적 식별자라 React key·tracking·prefetch 키로도 그대로 쓴다.
export const createAsideMenus = (projectSlug: string) => {
  const basePath = `/projects/${projectSlug}`;

  return {
    sections: [
      {
        title: 'sections.requirements',
        items: [
          {
            label: 'items.requirements',
            href: `${basePath}/requirements`,
            icon: FileText,
            matchPath: `${basePath}/requirements`,
          },
          {
            label: 'items.scenarios',
            href: `${basePath}/scenarios`,
            icon: ListChecks,
            matchPath: `${basePath}/scenarios`,
          },
        ],
      },
      {
        title: 'sections.testManagement',
        items: [
          {
            label: 'items.cases',
            href: `${basePath}/cases`,
            icon: FileText,
            matchPath: `${basePath}/cases`,
          },
          {
            label: 'items.suites',
            href: `${basePath}/suites`,
            icon: FolderOpen,
            matchPath: `${basePath}/suites`,
          },
          {
            label: 'items.milestones',
            href: `${basePath}/milestones`,
            icon: Flag,
            matchPath: `${basePath}/milestones`,
          },
          {
            label: 'items.runs',
            href: `${basePath}/runs`,
            icon: Play,
            matchPath: `${basePath}/runs`,
          },
          {
            label: 'items.checklists',
            href: `${basePath}/checklists`,
            icon: CheckSquare,
            matchPath: `${basePath}/checklists`,
          },
          {
            label: 'items.automation',
            href: `${basePath}/automation`,
            icon: Bot,
            matchPath: `${basePath}/automation`,
          },
        ],
      },
    ],
    bottom: [
      {
        label: 'items.trash',
        href: `${basePath}/trash`,
        icon: Trash2,
        matchPath: `${basePath}/trash`,
      },
      {
        label: 'items.settings',
        href: `${basePath}/settings`,
        icon: Settings,
        matchPath: `${basePath}/settings`,
      },
      {
        label: 'items.qaground',
        href: 'https://qaground.gettestea.com',
        icon: Dumbbell,
        matchPath: '',
        external: true,
      },
      { label: 'items.help', href: '#', icon: HelpCircle, matchPath: '' },
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
export type AsideMenuItem = (typeof ASIDE_SECTIONS)[number]['items'][number] & {
  matchPath?: string;
  external?: boolean;
};

export const MENUS = {
  ASIDE_SECTIONS,
  ASIDE_BOTTOM,
};
