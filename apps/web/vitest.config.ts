import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/test/setup-tests.ts'],
    // vitest 는 src/ 의 .test.* 만 본다.
    // Playwright(e2e) 는 e2e/ 의 .e2e.* 를 본다 — 확장자 자체가 달라 IDE 매핑 충돌 없음.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/shared/test/__mocks__/server-only.ts'),
    },
  },
});
