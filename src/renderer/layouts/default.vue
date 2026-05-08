<template>
  <v-app>
    <div v-if="notifyConnectionReconnecting" class="top-bar">
      <v-alert type="warning" variant="tonal" border="start">
        <div class="reconnect-copy">Connection interrupted. Reconnecting...</div>
        <v-progress-linear indeterminate />
      </v-alert>
    </div>

    <slot />

    <v-dialog v-model="showAbout" max-width="680">
      <AboutDialog @close="showAbout = false" />
    </v-dialog>

    <v-dialog v-model="showJoinDialog" max-width="560">
      <JoinGameDialog v-if="showJoinDialog" @close="showJoinDialog = false" />
    </v-dialog>

    <v-dialog v-model="showSettings" max-width="720">
      <SettingsDialog @close="showSettings = false" />
    </v-dialog>

    <v-dialog v-model="showErrorDialog" max-width="680">
      <ErrorDialog v-if="errorMessage" :msg="errorMessage" @close="showErrorDialog = false" />
    </v-dialog>
  </v-app>
</template>

<script setup>
import fs from '@/utils/fs-shim'
import os from '@/utils/os-shim'
import path from '@/utils/path-shim'
const extname = path.extname
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

import AboutDialog from '~/components/AboutDialog.vue'
import ErrorDialog from '~/components/ErrorDialog.vue'
import JoinGameDialog from '~/components/JoinGameDialog.vue'
import SettingsDialog from '~/components/SettingsDialog.vue'
import { getAppVersion } from '@/utils/version'
import { STATUS_CONNECTED, STATUS_RECONNECTING } from '@/store/networking'

const ZOOM_SENSITIVITY = 1.4

const { $addons, $connection, $server, $store, $theme, $tiles } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const vuetifyTheme = useTheme()

const showAbout = ref(false)
const addonsUpdated = ref(false)
const listenerDisposers = []

const errorMessage = computed(() => $store.state.errorMessage)
const onlineConnected = computed(() => $store.state.networking.connectionType === 'online')
const notifyConnectionReconnecting = computed(() => $store.state.networking.connectionStatus === STATUS_RECONNECTING)
const undoAllowed = computed(() => $store.getters['game/isUndoAllowed'])

const showJoinDialog = computed({
  get: () => $store.state.showJoinDialog,
  set: (value) => $store.commit('showJoinDialog', value)
})

const showSettings = computed({
  get: () => $store.state.showSettings,
  set: (value) => $store.commit('showSettings', value)
})

const showErrorDialog = computed({
  get: () => !!$store.state.errorMessage,
  set: () => $store.commit('errorMessage', null)
})

function registerListener (channel, handler) {
  if (typeof window === 'undefined' || !window.electronAPI?.on) {
    return
  }

  const disposer = window.electronAPI.on(channel, handler)
  listenerDisposers.push(typeof disposer === 'function' ? disposer : () => window.electronAPI.off?.(channel, handler))
}

function applyTheme (value) {
  const themeName = value === 'dark' ? 'dark' : 'light'
  vuetifyTheme.global.name.value = themeName
  if (typeof window !== 'undefined' && window.electronAPI?.invoke) {
    window.electronAPI.invoke('theme.change', themeName)
  }
}

async function loadAddons () {
  await $addons.loadAddons()
  await $tiles.loadExpansions()

  if (!addonsUpdated.value) {
    await $addons.updateOutdatedAddons()
    addonsUpdated.value = true
  }

  $theme.loadArtworks()
}

async function updateMenu () {
  if (typeof window === 'undefined' || !window.electronAPI?.invoke) {
    return
  }

  const routeName = String(route.name || '')
  const gameOpen = routeName === 'game-setup' || routeName === 'open-game' || routeName === 'game'
  const gameRunning = routeName === 'game'

  await window.electronAPI.invoke('update-menu', {
    'playonline-connect': !onlineConnected.value && !gameOpen && !!$store.state.engine?.ok,
    'playonline-disconnect': onlineConnected.value,
    'new-game': !onlineConnected.value && !gameOpen,
    'join-game': !onlineConnected.value && !gameOpen && !!$store.state.engine?.ok,
    'leave-game': gameOpen,
    'save-game': gameRunning,
    'load-game': !gameOpen && !!$store.state.engine?.ok,
    'undo': gameRunning && undoAllowed.value,
    'zoom-in': gameRunning,
    'zoom-out': gameRunning,
    'rotate': gameRunning,
    'game-tiles': gameRunning,
    'game-farm-hints': gameRunning,
    'toggle-history': gameRunning,
    'game-setup': gameRunning,
    'dump-server': $server.isRunning(),
    'theme-inspector': !gameOpen,
    'save-for-test-runner': gameRunning
  })
}

function updateTitle () {
  document.title = onlineConnected.value
    ? 'FanCloisterZone Edition @ fanserver'
    : 'FanCloisterZone Edition'
}

async function leaveGame () {
  if (onlineConnected.value) {
    const gameId = $store.state.game.id
    if (gameId && $store.state.networking.connectionStatus === STATUS_CONNECTED) {
      $connection.send({ type: 'LEAVE_GAME', payload: { gameId } })
    }
    await $store.dispatch('networking/close')
    return
  }

  await $store.dispatch('game/close')
  router.push('/')
}

function onKeyDown (event) {
  if (event.key === '+') {
    window.dispatchEvent(new CustomEvent('fcz:request-zoom', { detail: ZOOM_SENSITIVITY }))
    return
  }

  if (event.key === '-') {
    window.dispatchEvent(new CustomEvent('fcz:request-zoom', { detail: -ZOOM_SENSITIVITY }))
    return
  }

  if (event.key === 'Escape' && showAbout.value) {
    showAbout.value = false
    event.preventDefault()
    event.stopPropagation()
  }
}

async function dumpServer () {
  const data = {
    appVersion: getAppVersion(),
    engineVersion: $store.state.engine?.version,
    date: (new Date()).toISOString(),
    os: `${os.platform()} ${os.release()}`,
    java: $store.state.java ? `${$store.state.java.vendor} ${$store.state.java.version}` : '',
    ...(await $server.dump())
  }

  let { filePath } = await window.electronAPI.invoke('dialog.showSaveDialog', {
    title: 'Save Server Dump',
    filters: [{ name: 'JSON files', extensions: ['json'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  })

  if (!filePath) {
    return
  }

  if (extname(filePath) === '') {
    filePath += '.json'
  }

  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
}

onMounted(async () => {
  if (window.electronAPI?.webFrame) {
    window.electronAPI.webFrame.setZoomLevel(0)
    window.electronAPI.webFrame.setVisualZoomLevelLimits(1, 1)
  }

  const settingsPayload = await window.electronAPI.invoke('settings.get')
  await $store.dispatch('settings/loaded', settingsPayload)

  if ($store.state.settings.locale) {
    locale.value = $store.state.settings.locale
  }

  applyTheme($store.state.settings.theme)

  registerListener('app-update', (event, updateInfo) => {
    $store.commit('updateInfo', updateInfo)
  })
  registerListener('update-progress', (event, progress) => {
    $store.commit('updateProgress', progress.percent)
  })
  registerListener('error', (event, value) => {
    $store.commit('errorMessage', value)
  })
  registerListener('settings.changed', async (event, value) => {
    await $store.dispatch('settings/loaded', value)
  })
  registerListener('settings.update', async (event, update) => {
    await $store.dispatch('settings/update', update)
    try {
      await $store.dispatch('checkEngineVersion')
    } catch {
      // state is updated by the action
    }
  })
  registerListener('menu.playonline-connect', () => {
    $store.dispatch('networking/connectPlayOnlineFan')
  })
  registerListener('menu.playonline-disconnect', () => {
    $store.dispatch('networking/close')
  })
  registerListener('menu.new-game', () => {
    $store.dispatch('gameSetup/newGame')
    router.push('/game-setup')
  })
  registerListener('menu.join-game', () => {
    showJoinDialog.value = true
  })
  registerListener('menu.leave-game', () => {
    leaveGame()
  })
  registerListener('menu.save-game', () => {
    $store.dispatch('game/save')
  })
  registerListener('menu.load-game', () => {
    $store.dispatch('game/load')
  })
  registerListener('menu.show-settings', () => {
    showSettings.value = true
  })
  registerListener('menu.undo', () => {
    $store.dispatch('game/undo')
  })
  registerListener('menu.zoom-in', () => {
    window.dispatchEvent(new CustomEvent('fcz:request-zoom', { detail: ZOOM_SENSITIVITY }))
  })
  registerListener('menu.zoom-out', () => {
    window.dispatchEvent(new CustomEvent('fcz:request-zoom', { detail: -ZOOM_SENSITIVITY }))
  })
  registerListener('menu.rotate', () => {
    window.dispatchEvent(new CustomEvent('fcz:request-rotate', { detail: 90 }))
  })
  registerListener('menu.game-tiles', () => {
    $store.commit('showGameTiles', !$store.state.showGameTiles)
  })
  registerListener('menu.game-farm-hints', () => {
    if ($store.state.board.layers.FarmHintsLayer) {
      $store.dispatch('board/hideLayer', { layer: 'FarmHintsLayer' })
    } else {
      $store.dispatch('board/showLayer', { layer: 'FarmHintsLayer', props: {} })
    }
  })
  registerListener('menu.game-history', () => {
    $store.commit('toggleGameHistory')
  })
  registerListener('menu.game-setup', () => {
    $store.commit('showGameSetup', true)
  })
  registerListener('menu.rules', () => {
    window.electronAPI.shell.openExternal('https://wikicarpedia.com/car/Special:MyLanguage/Main_Page')
  })
  registerListener('menu.report-bug', () => {
    window.electronAPI.shell.openExternal('https://discord.gg/CswNeVg3eS')
  })
  registerListener('menu.about', () => {
    showAbout.value = true
  })
  registerListener('menu.dump-server', () => {
    dumpServer()
  })
  registerListener('menu.save-for-test-runner', () => {
    $store.dispatch('game/savescenario')
  })
  registerListener('menu.test-runner', () => {
    router.push('/test-runner')
  })
  registerListener('menu.reload-addons', () => {
    loadAddons()
  })
  registerListener('menu.theme-inspector', () => {
    router.push('/theme-inspector')
  })

  try {
    await $store.dispatch('checkJavaVersion')
    if ($store.state.java?.ok) {
      await $store.dispatch('checkEngineVersion')
    }
  } catch {
    // state flags are updated by the actions
  }

  try {
    await loadAddons()
  } catch (error) {
    console.error(error)
  }

  window.addEventListener('keydown', onKeyDown)
  updateMenu()
  updateTitle()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  while (listenerDisposers.length) {
    const dispose = listenerDisposers.pop()
    dispose?.()
  }
})

watch(() => $store.state.settings.theme, (value) => {
  if (value) {
    applyTheme(value)
  }
})

watch(() => $store.state.settings.locale, (value) => {
  if (value) {
    locale.value = value
  }
})

watch(
  [() => route.fullPath, () => onlineConnected.value, () => undoAllowed.value, () => $store.state.engine?.ok],
  () => {
    updateMenu()
    updateTitle()
  }
)
</script>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 0.75rem 0.75rem 0;
}

.reconnect-copy {
  margin-bottom: 0.5rem;
}
</style>