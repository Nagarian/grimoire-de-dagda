import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import svgrPlugin from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  base: '/grimoire-de-dagda/',
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    viteTsconfigPaths({ projects: ['./tsconfig.json'] }),
    svgrPlugin(),
    VitePWA({
      devOptions: {
        enabled: false,
        type: 'module',
      },
      injectRegister: 'inline',
      registerType: 'autoUpdate',
      // strategies: 'injectManifest',
      // injectManifest: {
      //   maximumFileSizeToCacheInBytes: 10000000,
      //   globPatterns: ['**/*.{js,css,html,png,svg}'],
      // },
      // srcDir: 'src',
      // filename: 'service-worker.ts',

      strategies: 'generateSW',
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 50000000,
        globPatterns: ['**/*.{js,css,json,html,png,svg}'],
      },

      manifest: {
        short_name: 'Grimoire de Dagda',
        name: 'Le Grimoire de Dagda',
        display: 'standalone',
        theme_color: '#efaf55',
        background_color: '#47362a',
        start_url: './',
        scope: '.',
        icons: [],
      },
    }),
  ],
})
