import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    // Feature barrels import src/config/env.ts, which validates env at load time.
    // Static fake values keep tests deterministic and independent of any local or CI .env.
    env: {
      NEXT_PUBLIC_BASE_URL: 'https://app.styreiq.test',
      NEXT_PUBLIC_NODE_ENV: 'test',
      FROM_ADDRESS: 'no-reply@styreiq.test',
      FROM_NAME: 'StyreIQ',
      PAYLOAD_SECRET: 'unit-test-secret',
      RESEND_API_KEY: 're_unit_test_key',
      LOCAL_EMAIL_TO_ADDRESS: 'dev@styreiq.test',
      DEMO_REQUEST_TO_ADDRESS: 'ventas@styreiq.test',
      DEMO_SCHEDULING_URL: 'https://agenda.styreiq.test/demo',
      BASE_SOCIAL_MEDIA_API_URL: 'https://social-api.styreiq.test',
    },
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/types/**', 'src/migrations/**', 'src/**/*.d.ts'],
    },
  },
})
