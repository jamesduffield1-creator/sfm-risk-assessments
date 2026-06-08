import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sfm-risk-assessments/',
  define: {
    'import.meta.env.VITE_ADMIN_PASSWORD': JSON.stringify(process.env.VITE_ADMIN_PASSWORD || ''),
    'import.meta.env.VITE_SHEETS_API_KEY': JSON.stringify(process.env.VITE_SHEETS_API_KEY || ''),
    'import.meta.env.VITE_SHEET_ID': JSON.stringify(process.env.VITE_SHEET_ID || ''),
    'import.meta.env.VITE_CLIENT_EMAIL': JSON.stringify(process.env.VITE_CLIENT_EMAIL || ''),
    'import.meta.env.VITE_PRIVATE_KEY': JSON.stringify(process.env.VITE_PRIVATE_KEY || ''),
  }
})
