import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'vitest.config.js',
        'package.json',
        'package-lock.json',
        'README.md',
        'LICENSE',
        '**/postmark-templates/**',
      ],
    },
  },
});


