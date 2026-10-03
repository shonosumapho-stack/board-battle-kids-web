import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
    open: '/#/',
  },
  preview: {
    port: 4175,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
