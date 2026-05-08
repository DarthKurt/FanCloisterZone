import type { ElectronOptions } from 'nuxt-electron'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    electron?: ElectronOptions
  }
  interface NuxtOptions {
    electron?: ElectronOptions
  }
}

export { }