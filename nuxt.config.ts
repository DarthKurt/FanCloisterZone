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
  }
})