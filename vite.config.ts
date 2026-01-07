import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/scorecard/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We keep this minimal to avoid missing asset 404s on GitHub Pages.
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Scorecard - Vechtsport Score App',
        short_name: 'Scorecard',
        description: 'Digitale scorecard voor vechtsportwedstrijden',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            // Use an existing asset to prevent console errors about missing png icons.
            // If you want proper PWA icons later, we can add real pngs to /public.
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})

