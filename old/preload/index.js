/**
 * Preload script — runs in renderer context with Node.js access, before the
 * page loads.  Exposes a safe, channel-whitelist-enforced bridge so the
 * renderer (contextIsolation: true) can communicate with the main process
 * without ever directly accessing Electron internals.
 */

/* global DEV_RESOURCES_PATH */

import { contextBridge, ipcRenderer, shell, webFrame } from 'electron'
import path from 'path'

// ─── channel white-lists ────────────────────────────────────────────────────

const INVOKE_CHANNELS = new Set([
  'get-app-version',
  'settings.get',
  'settings.save',
  'open-load-game-dialog',
  'dialog.showOpenDialog',
  'dialog.showSaveDialog',
  'dialog.showConfirmDialog',
  'confirm-leave-game',
  'localserver.start',
  'localserver.stop',
  'localserver.dump',
  'translate-menu',
  'translate-dialogs',
  'get-addon-defaults',
  'theme.change',
  'update-menu',
  'win.isVisible',
  'win.setProgressBar',
  'win.setIcon'
])

const SEND_CHANNELS = new Set([
  'set-local-game',
  'win-close-allowed',
  'installer.download-file',
  'installer.run',
  'do-update'
])

const ON_CHANNELS = new Set([
  // window state events (main → renderer)
  'win.restore', 'win.show', 'win.focus',
  'win.minimize', 'win.hide', 'win.blur',
  'win-close-request',
  // app lifecycle
  'app-update',
  'update-progress',
  'error',
  // settings pushed from main
  'settings.changed',
  'settings.update',
  // menu commands
  'menu.playonline-connect',
  'menu.playonline-disconnect',
  'menu.new-game',
  'menu.join-game',
  'menu.leave-game',
  'menu.save-game',
  'menu.load-game',
  'menu.show-settings',
  'menu.undo',
  'menu.zoom-in',
  'menu.zoom-out',
  'menu.rotate',
  'menu.game-tiles',
  'menu.game-farm-hints',
  'menu.game-history',
  'menu.game-setup',
  'menu.rules',
  'menu.report-bug',
  'menu.about',
  'menu.dump-server',
  'menu.save-for-test-runner',
  'menu.test-runner',
  'menu.reload-addons',
  'menu.theme-inspector',
  // installer / auto-updater
  'download-progress',
  'download-complete',
  'download-error',
  'installer.error',
  'installer.started'
])

// ─── resource path ────────────────────────────────────────────────────────────
// In production Electron sets process.resourcesPath correctly.
// In development the electron-vite define injects the absolute local path.
const resourcesPath = process.env.NODE_ENV === 'development'
  ? DEV_RESOURCES_PATH
  : process.resourcesPath

// ─── bridge ───────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invoke a whitelisted IPC channel (request/response).
   * @param {string} channel
   * @param {...*} args
   * @returns {Promise}
   */
  invoke(channel, ...args) {
    if (!INVOKE_CHANNELS.has(channel)) {
      throw new Error(`[preload] Blocked invoke channel: "${channel}"`)
    }
    return ipcRenderer.invoke(channel, ...args)
  },

  /**
   * Send a fire-and-forget message on a whitelisted channel.
   * @param {string} channel
   * @param {...*} args
   */
  send(channel, ...args) {
    if (!SEND_CHANNELS.has(channel)) {
      throw new Error(`[preload] Blocked send channel: "${channel}"`)
    }
    ipcRenderer.send(channel, ...args)
  },

  /**
   * Subscribe to events pushed from the main process.
   * Returns an unsubscribe function.
   * @param {string} channel
   * @param {Function} listener (event, ...args)
   * @returns {() => void} unsubscribe
   */
  on(channel, listener) {
    if (!ON_CHANNELS.has(channel)) {
      throw new Error(`[preload] Blocked on channel: "${channel}"`)
    }
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.off(channel, listener)
  },

  /**
   * Unsubscribe a previously registered listener.
   * @param {string} channel
   * @param {Function} listener
   */
  off(channel, listener) {
    if (ON_CHANNELS.has(channel)) {
      ipcRenderer.off(channel, listener)
    }
  },

  /**
   * Remove all listeners on a whitelisted channel.
   * @param {string} channel
   */
  removeAllListeners(channel) {
    if (ON_CHANNELS.has(channel)) {
      ipcRenderer.removeAllListeners(channel)
    }
  },

  // ─── shell ──────────────────────────────────────────────────────────────
  shell: {
    openExternal: (url) => shell.openExternal(url),
    openPath: (filePath) => shell.openPath(filePath)
  },

  // ─── webFrame ────────────────────────────────────────────────────────────
  webFrame: {
    setZoomLevel: (level) => webFrame.setZoomLevel(level),
    setVisualZoomLevelLimits: (min, max) => webFrame.setVisualZoomLevelLimits(min, max)
  },

  // ─── resources ───────────────────────────────────────────────────────────
  /** Absolute path to the extra resources directory. */
  resourcesPath
})
