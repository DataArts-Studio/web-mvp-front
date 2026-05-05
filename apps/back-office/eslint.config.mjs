import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // [FSD 공통 규칙] shared는 절대 상위 레이어를 알면 안 됨
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

  prettier,
]);

export default eslintConfig;
