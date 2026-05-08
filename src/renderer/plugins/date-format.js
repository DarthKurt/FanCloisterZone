// Vue 3 removed filters; expose formatDate as a global property so templates
// can call $formatDate(...) directly, and components that already define a
// local formatDate method continue to work unchanged.
import moment from 'moment'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.globalProperties.$formatDate = function (value) {
    if (value) {
      return moment(String(value)).format('YYYY-MM-DD hh:mm')
    }
    return ''
  }
})
