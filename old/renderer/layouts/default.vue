<template>
  <v-app>
    <div v-if="notifyConnectionReconnecting" class="top-bar">
      <v-alert type="error">
        Connection interrupted. Reconnecting&hellip;
        <v-progress-linear
          indeterminate
          color="white"
        />
      </v-alert>
    </div>

    <nuxt />
    <v-dialog
      v-model="showAbout"
      max-width="600"
    >
      <AboutDialog
        @close="showAbout = false"
      />
    </v-dialog>
    <v-dialog
      v-model="showJoinDialog"
      max-width="600"
    >
      <!-- use if to always create fresh dialog instance -->
      <JoinGameDialog
        v-if="showJoinDialog"
        @close="showJoinDialog = false"
      />
    </v-dialog>
    <v-dialog
      v-model="showSettings"
      content-class="settings-dialog"
      max-width="800"
    >
      <SettingsDialog
        ref="settings"
        @close="showSettings = false"
      />
    </v-dialog>
    <v-dialog
      v-model="showErrorDialog"
      content-class="error-dialog"
      max-width="800"
    >
      <ErrorDialog
        v-if="errorMessage"
        :msg="errorMessage"
        @close="showErrorDialog = false"
      />
    </v-dialog>
  </v-app>
</template>

<script>
import os from 'os'
import fs from 'fs'
import { extname } from 'path'
import { mapState, mapGetters } from 'vuex'

import AboutDialog from '@/components/AboutDialog'
import ErrorDialog from '@/components/ErrorDialog'
import JoinGameDialog from '@/components/JoinGameDialog'
import SettingsDialog from '@/components/SettingsDialog'
import { getAppVersion } from '@/utils/version'

import { STATUS_CONNECTED } from '@/store/networking'

const ZOOM_SENSITIVITY = 1.4

export default {
  components: {
    AboutDialog,
    ErrorDialog,
    JoinGameDialog,
    SettingsDialog
  },

  data () {
    return {
      showAbout: false,
      addonsUpdated: false
    }
  },

  computed: {
    ...mapState({
      java: state => state.java,
      engine: state => state.engine,
      connectionState: state => state.networking.connectionStatus,
      onlineConnected: state => state.networking.connectionType === 'online',
      errorMessage: state => state.errorMessage
    }),

    ...mapGetters({
      undoAllowed: 'game/isUndoAllowed'
    }),

    showJoinDialog: {
      get () {
        return this.$store.state.showJoinDialog
      },

      set (value) {
        this.$store.commit('showJoinDialog', value)
      }
    },

    showSettings: {
      get () {
        return this.$store.state.showSettings
      },

      set (value) {
        this.$store.commit('showSettings', value)
      }
    },

    showErrorDialog: {
      get () {
        return !!this.errorMessage
      },

      set (value) {
        this.$store.commit('errorMessage', null)
      }
    },

    notifyConnectionReconnecting () {
      return this.connectionState === 'reconnecting'
    }
  },

  watch: {
    $route (to) {
      this.updateMenu()
    },

    undoAllowed () {
      this.updateMenu()
    },

    onlineConnected () {
      this.updateMenu()
      this.updateTitle()
    },

    showSettings (val) {
      if (val) {
        this.$refs.settings?.clean()
      }
    },

    engine () {
      this.updateMenu()
    }
  },

  created () {
    window.electronAPI.on('win-close-request', async (hasLocalGame) => {
      console.log(hasLocalGame)
      if (!hasLocalGame) {
        window.electronAPI.send('win-close-allowed')
        return
      }
 
      const confirmed = await window.electronAPI.invoke('dialog.showConfirmDialog', {
        title: $t('dialog.close-local-game.unfinished-local-game'),
        ok: $t('dialog.close-local-game.resign-and-close'),
        cancel: $t('dialog.close-local-game.continue-playing')
      })

      if (confirmed) {
        window.electronAPI.send('win-close-allowed')
      }
    })

    window.electronAPI.on('app-update', (event, updateInfo) => {
      this.$store.commit('updateInfo', updateInfo)
    })
    window.electronAPI.on('update-progress', (event, progress) => {
      this.$store.commit('updateProgress', progress.percent)
    })

    window.electronAPI.on('menu.playonline-connect', () => {
      this.$store.dispatch('networking/connectPlayOnlineFan')
    })
    window.electronAPI.on('menu.playonline-disconnect', () => {
      this.$store.dispatch('networking/close')
      this.$router.push('/')
    })
    window.electronAPI.on('menu.new-game', () => {
      this.$store.dispatch('gameSetup/newGame')
      this.$router.push('/game-setup')
    })
    window.electronAPI.on('menu.join-game', () => {
      this.showJoinDialog = true
    })
    window.electronAPI.on('menu.leave-game', () => {
      this.leaveGame()
    })
    window.electronAPI.on('menu.save-game', () => {
      this.$store.dispatch('game/save')
    })
    window.electronAPI.on('menu.load-game', () => {
      this.$store.dispatch('game/load')
    })
    window.electronAPI.on('menu.show-settings', () => {
      this.showSettings = true
    })
    window.electronAPI.on('menu.undo', () => {
      this.$store.dispatch('game/undo')
    })
    window.electronAPI.on('menu.zoom-in', () => {
      this.$root.$emit('request-zoom', ZOOM_SENSITIVITY)
    })
    window.electronAPI.on('menu.zoom-out', () => {
      this.$root.$emit('request-zoom', -ZOOM_SENSITIVITY)
    })
    window.electronAPI.on('menu.rotate', () => {
      this.$root.$emit('request-rotate', 90)
    })
    window.electronAPI.on('menu.game-tiles', () => {
      this.$store.commit('showGameTiles', !this.$store.state.showGameTiles)
    })
    window.electronAPI.on('menu.game-farm-hints', () => {
      if (this.$store.state.board.layers.FarmHintsLayer) {
        this.$store.dispatch('board/hideLayer', { layer: 'FarmHintsLayer' })
      } else {
        this.$store.dispatch('board/showLayer', {
          layer: 'FarmHintsLayer',
          props: {}
        })
      }
    })
    window.electronAPI.on('menu.game-history', () => {
      this.$store.commit('toggleGameHistory')
    })
    window.electronAPI.on('menu.game-setup', () => {
      this.$store.commit('showGameSetup', true)
    })
    window.electronAPI.on('menu.rules', () => {
      window.electronAPI.shell.openExternal('https://wikicarpedia.com/car/Special:MyLanguage/Main_Page')
    })
    window.electronAPI.on('menu.report-bug', () => {
      window.electronAPI.shell.openExternal('https://discord.gg/CswNeVg3eS') /* Fan Edition */
    })
    window.electronAPI.on('menu.about', () => {
      this.showAbout = true
    })

    window.electronAPI.on('menu.dump-server', () => {
      this.dumpServer()
    })
    window.electronAPI.on('menu.save-for-test-runner', () => {
      this.$store.dispatch('game/savescenario')
    })
    window.electronAPI.on('menu.test-runner', () => {
      this.$router.push('/test-runner')
    })
    window.electronAPI.on('menu.reload-addons', () => {
      this.loadAddons()
    })
    window.electronAPI.on('menu.theme-inspector', () => {
      this.$router.push('/theme-inspector')
    })
  },

  async mounted () {
    window.electronAPI.webFrame.setZoomLevel(0)
    window.electronAPI.webFrame.setVisualZoomLevelLimits(1, 1)

    const onThemeChange = val => {
      if (val === 'dark') {
        this.$vuetify.theme.dark = true
        window.electronAPI.invoke('theme.change', 'dark')
      } else {
        this.$vuetify.theme.dark = false
        window.electronAPI.invoke('theme.change', 'light')
      }
    }

    await this.$store.dispatch('settings/loaded', await window.electronAPI.invoke('settings.get'))
    onThemeChange(this.$store.state.settings.theme)
    this.$i18n.setLocale(this.$store.state.settings.locale)
    this.updateMenu()

    window.electronAPI.on('error', (ev, value) => {
      this.$store.commit('errorMessage', value)
    })

    window.electronAPI.on('settings.changed', (ev, value) => {
      this.$store.dispatch('settings/loaded', value)
    })

    window.electronAPI.on('settings.update', (ev, update) => {
      this.$store.dispatch('settings/update', update)
      this.$store.dispatch('checkEngineVersion')
    })
    
    try {
      await this.$store.dispatch('checkJavaVersion')
      if (this.java?.ok) {
        this.$store.dispatch('checkEngineVersion')
      }
    } catch {
      // do nothing, state flags asre set
    }

    await this.loadAddons()

    window.addEventListener('keydown', this.onKeyDown)

    await this.$store.dispatch('settings/registerChangeCallback', ['theme', onThemeChange])
    await this.$store.dispatch('settings/registerChangeCallback', ['userAddons', () => { this.loadAddons() }])
    await this.$store.dispatch('settings/registerChangeCallback', ['addonsManifestUrl', async () => {
      this.addonsUpdated = false
      await this.loadAddons()
      this.$addons.emit('change')
    }])
    await this.$store.dispatch('settings/registerChangeCallback', ['enabledArtworks', (_, source) => {
      if (source === 'load') {
        // load only when triggered by manual user change, otherwise it's cause by addon install/uninstall and reloaed from her
        this.$theme.loadArtworks()
      }
    }])
    await this.$store.dispatch('settings/registerChangeCallback', ['dev', () => { this.updateMenu() }])

    this.$addons.on('change', async () => {
      await this.loadAddons()
    })
  },
  
  beforeDestroy () {
    window.removeEventListener('keydown', this.onKeyDown)
  },

  methods: {
    async loadAddons () {
      await this.$addons.loadAddons()
      await this.$tiles.loadExpansions()
      if (!this.addonsUpdated) {
        await this.$addons.updateOutdatedAddons()
        this.addonsUpdated=true
      }
      
      // during start up, don't wait for artworks, theme can be loaded in background
      this.$theme.loadArtworks()
    },

    updateMenu () {
      const routeName = this.$route.name
      const gameOpen = routeName === 'game-setup' || routeName === 'open-game' || routeName === 'game'
      const gameRunning = routeName === 'game'

      window.electronAPI.invoke('update-menu', {
        'playonline-connect': !this.onlineConnected && !gameOpen && this.engine?.ok,
        'playonline-disconnect': this.onlineConnected,
        'new-game': !this.onlineConnected && !gameOpen,
        'join-game': !this.onlineConnected && !gameOpen && this.engine?.ok,
        'leave-game': gameOpen,
        'save-game': gameRunning,
        'load-game': !gameOpen && this.engine?.ok,
        'undo': gameRunning && this.undoAllowed,
        'zoom-in': gameRunning,
        'zoom-out': gameRunning,
        'rotate': gameRunning,
        'toggle-history': gameRunning,
        'game-tiles': gameRunning,
        'game-farm-hints': gameRunning,
        'game-setup': gameRunning,
        'dump-server': this.$server.isRunning(),
        'theme-inspector': !gameOpen,
        'save-for-test-runner': gameRunning
      })
    },
    
    updateTitle() {
      document.title = this.onlineConnected ? 'FanCloisterZone Edition @ fanserver' /* + this.$store.state.onlineHostName */ : 'FanCloisterZone Edition' /* Fan Edition */
    },

    async leaveGame () {
      if (this.onlineConnected) {
        const { $connection } = this
        const gameId = this.$store.state.game.id
        if (gameId) {
          if (this.$store.state.networking.connectionStatus === STATUS_CONNECTED) {
            $connection.send({ type: 'LEAVE_GAME', payload: { gameId } })
          }
        }
        this.$router.push('/online')
      } else {
        const confirmed = await window.electronAPI.invoke('confirm-leave-game')
        if (!confirmed) return
 
        this.$store.dispatch('game/close')
        this.$router.push('/')
      }
    },	

    onKeyDown (ev) {
      if (ev.key === '+') { // bind both + and numpad +
        this.$root.$emit('request-zoom', ZOOM_SENSITIVITY)
        return
      }
      if (ev.key === '-') {
        this.$root.$emit('request-zoom', -ZOOM_SENSITIVITY)
        return
      }
      if (ev.key === 'Escape') {
        this.$store.commit('board/pointsExpression', null)
        if (this.showAbout) {
          this.showAbout = false
          ev.preventDefault()
          ev.stopPropagation()
        }
      }
    },

    async dumpServer () {
      const data = {
        appVersion: getAppVersion(),
        engineVersion: this.$store.state.engine?.version,
        date: (new Date()).toISOString(),
        os: `${os.platform()} ${os.release()}`,
        java: this.java ? `${this.java.vendor} ${this.java.version}` : '',
        ...(await this.$server.dump())
      }

      let { filePath } = await window.electronAPI.invoke('dialog.showSaveDialog', {
        title: 'Save Server Dump',
        filters: [{ name: 'JSON files', extensions: ['json'] }],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      })
      if (filePath) {
        if (extname(filePath) === '') {
          filePath += '.json'
        }
        fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
          if (err) {
            console.error(err)
          } else {
            console.log(`Dump save to ${filePath}`)
          }
        })
      }
    }
  }
}
</script>

<style lang="sass">
@import '@openfonts/roboto_latin-ext/index.css'
@import '~vuetify/src/styles/styles.sass'

@import '~/assets/styles/player-colors.scss'
@import '~/assets/styles/rotation.sass'

:root
  --aside-width: 290px
  --aside-width-plus-gap: #{290px + $panel-gap}
  --action-bar-height: 84px
  --game-setup-header-height: 72px

  @media #{map-get($display-breakpoints, 'lg-and-down')}
    --aside-width: 250px
    --aside-width-plus-gap: #{250px + $panel-gap}

  @media #{map-get($display-breakpoints, 'md-and-down')}
    --aside-width: 210px
    --aside-width-plus-gap: #{210px + $panel-gap}

  @media (max-height: 768px)
    --action-bar-height: 60px
    --game-setup-header-height: 50px

html
  overflow-y: auto

body
  margin: 0 !important

.view
  width: 100%
  min-height: 100vh

svg, g, use
  &.dragon, &.bigtop
    fill: $dragon-color

svg, g, use
  &.fairy
    fill: $fairy-color

svg, g, use
  &.count
    fill: $count-color

svg, g, use
  &.mage
    fill: $mage-color

svg, g, use
  &.witch
    fill: $witch-color

svg, g, use
  &.donkey
    fill: $donkey-color

.settings-dialog
  height: 80vh
  display: grid

#theme-resources, #symbols
  display: none

.top-bar
  position: absolute
  top: 0
  left: 0
  width: 100%
  z-index: 999

::-webkit-scrollbar
  width: 8px
  height: 8px

::-webkit-scrollbar-track
  background: #f0f0f0

::-webkit-scrollbar-thumb
  background: #555
  border-radius: 10px

::-webkit-scrollbar-thumb:hover
  background: #777
</style>
