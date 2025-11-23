// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...storybook.configs['flat/recommended'],

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // [FSD 공통 규칙] shared는 절대 상위 레이어(비즈니스 로직)를 알면 안 됨
  {
    files: ['src/shared/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**/*',
                '@/widgets/**/*',
                '@/features/**/*',
                '@/entities/**/*',
                '../app/**/*',
                '../widgets/**/*',
                '../features/**/*',
                '../entities/**/*',
              ],
              message:
                'FSD 위반: shared 레이어는 상위 레이어(app, widgets, features, entities)를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },

  // [UI 라이브러리 전용 규칙] shared/ui는 프레임워크/상태관리도 알면 안 됨
  // shared/lib 같은 곳은 Next.js 써도 됨
  // 라이브러리로 분리예정
  {
    // shared 폴더 내부 파일들만 감시
    files: ['src/shared/ui/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // 라이브러리 차단
          paths: [
            {
              name: 'zustand',
              message:
                'UI 라이브러리는 전역 상태(Store)를 알면 안 됩니다! 필요한 데이터는 Props로 받으세요.',
            },
            {
              name: 'next/navigation',
              message:
                '[Router, Pathname, SearchParams 금지] UI 컴포넌트 내에서 next/navigation 쓰면 재사용이 불가능합니다. onClick 핸들러를 Props로 받으세요.',
            },
            {
              name: 'next/router',
              message: 'UI 컴포넌트 내에서 Router를 쓰지 마세요.',
            },
            {
              name: 'next/link',
              message:
                '[Link 금지] UI 라이브러리가 next/link에 의존하면 다른 프로젝트(Vite 등)에서 못 씁니다. a 태그나 Props로 주입받으세요.',
            },
            {
              name: 'next/image',
              message:
                '[Image 금지] UI 라이브러리가 next/image에 의존하면 무겁습니다. img 태그를 쓰거나 이미지 컴포넌트를 주입받으세요.',
            },
            {
              name: 'next/server',
              message: '[Server 금지] UI 컴포넌트는 클라이언트/서버 어디서든 돌아야 합니다.',
            },
            {
              name: 'next/headers',
              message: '[Headers 금지] UI 컴포넌트는 쿠키나 헤더에 접근하면 안 됩니다.',
            },
          ],

          // eslint 덮어쓰기 방지
          patterns: [
            {
              group: [
                '@/app/**/*',
                '@/widgets/**/*',
                '@/features/**/*',
                '@/entities/**/*',
                '../app/**/*',
                '../widgets/**/*',
                '../features/**/*',
                '../entities/**/*',
              ],
              message:
                'FSD 위반: shared 레이어는 상위 레이어(app, widgets, features, entities)를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },

  // Prettier와 충돌 비활성화
  prettier,
]);

export default eslintConfig;
