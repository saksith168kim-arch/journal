import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',  // 👈 change from '/journal/' to '/'
  plugins: [react()],
})