import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['tests/**/*.test.js', 'api/**/*.test.js', 'src/**/*.test.{js,jsx}'],
  },
});
