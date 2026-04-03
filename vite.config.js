import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 10000,
  },
  server: {
    // 本地開發時讓 /admin 路由正常
    historyApiFallback: true,
  },
})
