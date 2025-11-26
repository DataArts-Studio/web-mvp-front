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
    if (!config.resolve) config.resolve = {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(process.cwd(), '../src'),
      '@app': path.resolve(process.cwd(), '../src/app'),
      '@entities': path.resolve(process.cwd(), '../src/entities'),
      '@features': path.resolve(process.cwd(), '../src/features'),
      '@shared': path.resolve(process.cwd(), '../src/shared'),
      '@widgets': path.resolve(process.cwd(), '../src/widgets'),
      '@stories': path.resolve(process.cwd(), '../src/stories'),
    };

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  staticDirs: ['../public'],
};
export default config;
