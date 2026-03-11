import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/journal/',  // 👈 changed from /tradelog/ to /journal/
  plugins: [react()],
})