import type { StorybookConfig } from '@storybook/nextjs';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';

// const ROOT = process.cwd();
const ROOT = path.resolve(__dirname, '..');

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
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        configFile: path.resolve(ROOT, './tsconfig.json'),
        extensions: config.resolve.extensions,
      }),
    ];

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  // staticDirs 경로를 __dirname 기준으로 절대 경로로 변경
  staticDirs: [path.resolve(__dirname, '../public')],
};
export default config;
