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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/__mocks__/**',
        'src/**/__fixtures__/**',
        'src/shared/test/**',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/shared/test/__mocks__/server-only.ts'),
    },
  },
});
