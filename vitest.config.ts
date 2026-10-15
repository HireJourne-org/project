import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Unit tests only. Tests that hit a live Supabase project are named
// *.integration.test.ts and run via `npm run test:integration`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
