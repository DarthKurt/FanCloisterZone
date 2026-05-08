import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: 'fa',
      aliases,
      sets: { fa }
    },
    theme: {
      themes: {
        light: {
          colors: {
            primary: '#5dc4ff'
          }
        },
        dark: {
          colors: {
            primary: '#148bd0'
          }
        }
      },
      options: { customProperties: true }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})