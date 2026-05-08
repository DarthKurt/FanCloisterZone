import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtConfig } from 'nuxt/config'
import vuetify from 'vite-plugin-vuetify'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: file:",
  "media-src 'self' data: blob: file:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' blob:",
  "connect-src 'self' http: https: ws: wss:",
  "worker-src 'self' blob:"
].join('; ')

export default defineNuxtConfig({
  compatibilityDate: '2026-05-03',
  srcDir: 'src/renderer',
  ssr: false,
  devtools: { enabled: false },
  nitro: { preset: 'static' },
  typescript: {
    typeCheck: true,
    strict: true,
    tsConfig: {
      compilerOptions: {
        types: ['node']
      }
    }
  },

  app: {
    head: {
      title: 'FanCloisterZone Edition',
      meta: [
        { charset: 'utf-8' },
        { httpEquiv: 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY }
      ]
    },
    // Hash-based routing for Electron file:// / app:// protocol
    baseURL: './'
  },

  router: {
    options: {
      hashMode: true
    }
  },

  modules: [
    '@nuxtjs/i18n'
  ],

  i18n: {
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales/',
    locales: [
      { code: 'ca', file: 'ca.json' },
      { code: 'cs', file: 'cs.json' },
      { code: 'de', file: 'de.json' },
      { code: 'en', file: 'en.json' },
      { code: 'es', file: 'es.json' },
      { code: 'fr', file: 'fr.json' },
      { code: 'lt', file: 'lt.json' },
      { code: 'nl', file: 'nl.json' },
      { code: 'pl', file: 'pl.json' },
      { code: 'ro', file: 'ro.json' },
      { code: 'ru', file: 'ru.json' },
      { code: 'sk', file: 'sk.json' },
      { code: 'sl', file: 'sl.json' }
    ],
    vueI18n: './src/renderer/i18n/vuei18n.js'
  },

  plugins: [
    '~/plugins/vuetify.js',
    '~/plugins/vuex-store.js',
    '~/plugins/engine.js',
    '~/plugins/server.js',
    '~/plugins/connection.js',
    '~/plugins/addons.js',
    '~/plugins/tiles.js',
    '~/plugins/theme.js',
    { src: '~/plugins/icons.js', mode: 'client' },
    '~/plugins/router-patch.js',
    '~/plugins/date-format.js',
    '~/plugins/i18n.js'
  ],

  vite: {
    plugins: [vuetify({ autoImport: true })],
    css: {
      preprocessorOptions: {
        sass: {
          additionalData: '@use "~/assets/styles/shared.sass" as *\n'
        }
      }
    },
    assetsInclude: ['**/*.ogg', '**/*.mp3', '**/*.wav'],
    define: {
      'process.resourcesPath': JSON.stringify(
        process.env.NODE_ENV === 'development'
          ? resolve(__dirname, 'src/extraResources')
          : undefined
      )
    }
  }
})