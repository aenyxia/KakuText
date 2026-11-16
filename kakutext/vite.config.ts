import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'src/tests/unit/**/*.test.ts',
      'src/tests/unit/**/*.test.tsx',
      'src/tests/rls/**/*.test.ts',
    ],
    exclude: ['src/tests/e2e/**', 'node_modules/**'],
  },
});