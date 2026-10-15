import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Integration tests against a live Supabase project. Requires VITE_SUPABASE_URL,
// VITE_SUPABASE_ANON_KEY, VITE_TEST_USER_EMAIL and VITE_TEST_USER_PASSWORD.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    include: ['src/**/*.integration.test.ts'],
  },
});
