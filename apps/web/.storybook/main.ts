import type { StorybookConfig } from '@storybook/nextjs';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();
// const ROOT = path.resolve(__dirname, '..');

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

    // server-only 모듈을 빈 모듈로 대체 (Storybook은 클라이언트 환경)
    if (!config.resolve.alias) config.resolve.alias = {};
    config.resolve.alias['server-only'] = path.resolve(__dirname, 'mocks/server-only.js');

    // Node.js 전용 모듈을 빈 모듈로 대체 (postgres 등 서버 코드가 번들에 포함될 때)
    if (!config.resolve.fallback) config.resolve.fallback = {};
    Object.assign(config.resolve.fallback, {
      net: false,
      tls: false,
      fs: false,
      dns: false,
      child_process: false,
      perf_hooks: false,
      crypto: false,
      os: false,
      path: false,
      stream: false,
      'pg-native': false,
    });

    return config;
  },

  // 크로스 플랫폼 호환 (\\ -> /)
  staticDirs: [path.resolve(process.cwd(), 'public')],
};

export default config;
