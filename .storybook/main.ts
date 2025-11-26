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
      '@': path.resolve(__dirname, '../src'),
      '@app': path.resolve(__dirname, '../src/app'),
      '@entities': path.resolve(__dirname, '../src/entities'),
      '@features': path.resolve(__dirname, '../src/features'),
      '@shared': path.resolve(__dirname, '../src/shared'),
      '@widgets': path.resolve(__dirname, '../src/widgets'),
      '@stories': path.resolve(__dirname, '../src/stories'),
    };

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  staticDirs: ['../public'],
};
export default config;
