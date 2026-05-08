/**
 * Nuxt 3 plugin: sets up Vuex 4 store and provides backward compatibility.
 *
 * In Nuxt 2, store modules were auto-detected from the store/ directory.
 * In Nuxt 3 there is no built-in Vuex support, so we assemble them here.
 *
 * Migration path: when ready, replace individual modules with Pinia stores
 * and remove this plugin.
 */

import { createStore } from 'vuex'

import * as root from '~/store/index'
import * as settings from '~/store/settings'
import * as networking from '~/store/networking'
import * as game from '~/store/game'
import * as gameSetup from '~/store/gameSetup'
import * as board from '~/store/board'
import * as online from '~/store/online'

function toModule (mod) {
  return {
    namespaced: true,
    state: mod.state,
    mutations: mod.mutations ?? {},
    getters: mod.getters ?? {},
    actions: mod.actions ?? {}
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const store = createStore({
    state: root.state,
    mutations: root.mutations ?? {},
    getters: root.getters ?? {},
    actions: root.actions ?? {},
    modules: {
      settings: toModule(settings),
      networking: toModule(networking),
      game: toModule(game),
      gameSetup: toModule(gameSetup),
      board: toModule(board),
      online: toModule(online)
    },
    plugins: [
      // Backward-compat shim: Vuex 2/3 mutations/actions accessed `this._vm`
      // to reach Vue plugin instances ($tiles, $engine, etc.).
      // Vuex 4 still calls handlers with `this = store`, so we set `_vm` to a
      // transparent Proxy that lazily reads from globalProperties, which are
      // populated by the other Nuxt plugins that run after this one.
      (s) => {
        s._vm = new Proxy({}, {
          get (_, prop) {
            return nuxtApp.vueApp.config.globalProperties[prop]
          }
        })
      }
    ]
  })

  // Make $store available in the Options API (this.$store in components)
  nuxtApp.vueApp.use(store)

  return {
    // Also make store available as nuxtApp.$store for plugins
    provide: { store }
  }
})
