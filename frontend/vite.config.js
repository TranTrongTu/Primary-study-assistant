import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Ép máy tính liên tục quét file thay vì chờ hệ điều hành báo cáo
      interval: 100,    // Quét mỗi 100ms
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
    dedupe: ['react', 'react-dom']
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/api/generated/**', 'src/test/**', 'src/**/*.test.{js,jsx}'],
      reporter: ['text-summary'],
    },
  },
})
