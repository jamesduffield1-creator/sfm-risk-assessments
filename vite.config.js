import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'STF Risk Assessment Manager',
        short_name: 'STF Risks',
        description: 'Risk Assessment Designer and Record Keeper — St Francis Mackworth',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/sfm-risk-assessments/',
        scope: '/sfm-risk-assessments/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  base: '/sfm-risk-assessments/',
  define: {
    'import.meta.env.VITE_ADMIN_PASSWORD': JSON.stringify(process.env.VITE_ADMIN_PASSWORD || ''),
    'import.meta.env.VITE_SHEETS_API_KEY': JSON.stringify(process.env.VITE_SHEETS_API_KEY || ''),
    'import.meta.env.VITE_SHEET_ID': JSON.stringify(process.env.VITE_SHEET_ID || ''),
    'import.meta.env.VITE_CLIENT_EMAIL': JSON.stringify(process.env.VITE_CLIENT_EMAIL || ''),
    'import.meta.env.VITE_PRIVATE_KEY': JSON.stringify(process.env.VITE_PRIVATE_KEY || ''),
  },
})
