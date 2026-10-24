import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['pruebas/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/servidor.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 85 },
    },
  },
});
