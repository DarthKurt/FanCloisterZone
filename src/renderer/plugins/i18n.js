// hint meta keys as used to extractor
// $t('@author')
// $t('@jcz-version')
// $t('@version')

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n
  i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    const messages = i18n.getLocaleMessage(newLocale)
    window.electronAPI.invoke('translate-menu', messages.menu)
    window.electronAPI.invoke('translate-dialogs', messages.dialog)
  }
})
