import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  // webpackFinal 설정 추가
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // process.cwd() -> 프로젝트 루트
        '@': path.resolve(process.cwd(), 'src'),
      };
    }

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  staticDirs: ['../public'],
};
export default config;
