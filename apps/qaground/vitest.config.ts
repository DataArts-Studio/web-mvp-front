import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/test/setup-tests.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    // jsdom 환경 콜드 스타트(첫 파일 import/transform)가 기본 5초를 넘겨 첫 테스트가
    // 간헐 타임아웃되는 것을 방지한다.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
