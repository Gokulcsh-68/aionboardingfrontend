import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/v1': {
        target: 'https://services-api.a2zhealth.in/onboarding',
        changeOrigin: true,
        secure: false,
      },
      '/onboarding-audio': {
        target: 'https://services-api.a2zhealth.in/onboarding',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
