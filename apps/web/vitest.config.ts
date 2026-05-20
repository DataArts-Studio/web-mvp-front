import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/test/setup-tests.ts'],
    // vitest 는 src/ 의 .test.* 만 본다.
    // Playwright(e2e) 는 tests/ 의 .spec.* 를 본다 — 경로로 분리(아래 exclude 의 tests/**)해
    // 같은 .spec.* 라도 vitest 가 tests 를 수집하지 않는다.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/shared/test/__mocks__/server-only.ts'),
    },
  },
});
