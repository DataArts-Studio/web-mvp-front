import type { StorybookConfig } from '@storybook/nextjs';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
// import path from 'path';

// const ROOT = process.cwd();

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
    /*config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(ROOT, 'src'),
      '@app': path.resolve(ROOT, 'src/app'),
      '@entities': path.resolve(ROOT, 'src/entities'),
      '@features': path.resolve(ROOT, 'src/features'),
      '@shared': path.resolve(ROOT, 'src/shared'),
      '@widgets': path.resolve(ROOT, 'src/widgets'),
      '@stories': path.resolve(ROOT, 'src/stories'),
    };*/
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, './tsconfig.json'),
        extensions: config.resolve.extensions,
      }),
    ];

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  staticDirs: ['../public'],
};
export default config;
