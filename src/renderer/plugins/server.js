import { getAppVersion } from '@/utils/version'
import { randomId } from '@/utils/random'

export default defineNuxtPlugin((nuxtApp) => {
  let running = false

  const server = {
    async start (game) {
      const { settings } = nuxtApp.$store.state
      const appVersion = getAppVersion()
      const engineVersion = nuxtApp.$store.state.engine.version
      if (!game.gameId) {
        game = { gameId: randomId(), ...game }
      }

      await window.electronAPI.invoke('localserver.start', {
        game,
        port: settings.port,
        clientId: settings.clientId,
        appVersion,
        engineVersion
      })
      running = true
    },

    async stop () {
      running = false
      await window.electronAPI.invoke('localserver.stop')
    },

    isRunning () {
      return running
    },

    async dump () {
      return await window.electronAPI.invoke('localserver.dump')
    }
  }

  return { provide: { server } }
})
