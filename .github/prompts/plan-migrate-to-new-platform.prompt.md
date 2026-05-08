## Plan: Continue Migration

The migration is mostly past the build/preload/main-process stage. To continue safely, fix the current Nuxt 3 config error first, then finish the renderer compatibility cleanup, and only after that extract renderer-side Node work behind preload/main IPC so nodeIntegration can be turned off without breaking engine, add-ons, save/load, or settings flows.

**Steps**
1. Fix the current Nuxt 3 config mismatch in /Users/taapoev2/sources/FanCloisterZone/src/renderer/nuxt.config.ts by removing or rewriting the unsupported generate.dir setting. This is independent and should be done first so the editor baseline is clean.
2. Establish a shared renderer event bus using the existing EventsBase wrapper in /Users/taapoev2/sources/FanCloisterZone/src/renderer/utils/events.js, exposed through a Nuxt plugin or equivalent injection point. This avoids adding a new library and defines the replacement for $root.$on/$off/$emit.
3. Migrate the board interaction flow away from the root instance event bus across /Users/taapoev2/sources/FanCloisterZone/src/renderer/layouts/default.vue, /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/Board.vue, /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/ActionPanel.vue, /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/layers/, and /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/actions/. This depends on step 2 and is the main functional blocker in the game UI.
4. Convert remaining lifecycle hooks from beforeDestroy to beforeUnmount after the affected components are touched for step 3. This can run in parallel with the late part of step 3 once the event-bus shape is stable.
5. Replace remaining Vuetify 2 runtime APIs and Vue 2 template syntax. Prioritize this.$vuetify.theme.dark, this.$vuetify.breakpoint, v-simple-table, .native listeners, slot-scope, and outdated field props such as outlined where they actually break behavior. Use Vuetify 3 patterns such as useTheme() and useDisplay(). This can run in parallel with step 4 once the core board loop is stable.
6. Remove global $nuxt usage from stores, pages, and utilities in favor of injected translation/router access that works reliably in Nuxt 3. This can run in parallel with step 5 but should be verified page-by-page because it touches store and utility code.
7. Move renderer-side Node and Electron responsibilities behind preload/main IPC. Start with the highest-risk modules: /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/engine.js, /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/addons.js, /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/index.js, /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/settings.js, /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/game.js, and /Users/taapoev2/sources/FanCloisterZone/src/renderer/pages/test-runner.vue. Replace direct fs/path/os/crypto/child_process/net/https/process/window.process access with preload APIs backed by IPC handlers in src/main/modules. This blocks step 8.
8. Only after step 7, disable nodeIntegration in /Users/taapoev2/sources/FanCloisterZone/src/main/index.js and remove any remaining renderer assumptions around process.resourcesPath or process.platform in favor of preload-exposed data.
9. Verify in stages. Do a source-pattern pass after steps 3-6, then a dev smoke pass, then a production build pass, and only then a nodeIntegration=false smoke pass.

**Relevant files**
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/nuxt.config.ts — remove the unsupported generate.dir setting and preserve the current plugin/module layout.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/utils/events.js — existing tiny-emitter wrapper to reuse for the UI event bus.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/layouts/default.vue — menu events, theme switching, Node imports, and request-zoom/request-rotate emission.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/Board.vue — central listener hub for request-zoom/request-rotate and rclick emission.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/ActionPanel.vue — rclick emission path and lifecycle cleanup.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/layers/ — tile/feature/tower/ferry selection emitters.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/actions/ and /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/game/actions/items/ — many event listeners and beforeDestroy hooks.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/pages/index.vue and /Users/taapoev2/sources/FanCloisterZone/src/renderer/components/AboutDialog.vue — dark-theme asset selection still using this.$vuetify.theme.dark.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/pages/test-runner.vue — v-simple-table, $nuxt, and direct fs/path use.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/index.js, /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/settings.js, and /Users/taapoev2/sources/FanCloisterZone/src/renderer/store/game.js — direct Node built-ins and Nuxt 2 global access.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/engine.js — child_process, net, process, and argv usage that prevents disabling nodeIntegration today.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/addons.js — fs/path/os/https and user-data path handling to move behind IPC.
- /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/tiles.js and /Users/taapoev2/sources/FanCloisterZone/src/renderer/plugins/artwork-loader/artwork-loader.js — local file/resource loading patterns to review during isolation.
- /Users/taapoev2/sources/FanCloisterZone/src/preload/index.js — extend the bridge with the APIs required by step 7.
- /Users/taapoev2/sources/FanCloisterZone/src/main/index.js — keep nodeIntegration enabled until isolation is complete, then flip it off here.
- /Users/taapoev2/sources/FanCloisterZone/src/main/modules/ — reuse the existing IPC module pattern for new engine/add-on/file/platform handlers.

**Verification**
1. Confirm the editor error in /Users/taapoev2/sources/FanCloisterZone/src/renderer/nuxt.config.ts is resolved.
2. Search source-only files under src/renderer for $root.$on, $root.$off, $root.$emit, beforeDestroy, this.$vuetify.theme.dark, this.$vuetify.breakpoint, @click.native, slot-scope, $nuxt, and direct Node builtin imports to make sure each category is intentionally removed or tracked.
3. Run yarn dev and smoke test startup, zoom/rotate, tile placement, selection layers, theme switching, open/save dialogs, add-on loading/install flows, test runner, and engine start/connect.
4. Run yarn build and confirm the Nuxt renderer output still lands in dist/renderer and Electron loads it correctly.
5. If step 8 is completed, do an additional smoke test with nodeIntegration disabled to verify no renderer-only Node dependency remains.

**Decisions**
- Included: Vue 3/Nuxt 3/Vuetify 3 compatibility cleanup, the current config error, and the renderer-isolation work required to finish Electron hardening.
- Excluded: Pinia migration, general styling cleanup, ASAR/signing/release automation, and converting asset require() calls unless they prove to be a real build/runtime problem.
- Recommendation: For the fastest reliable progress, do steps 1 through 6 first while keeping nodeIntegration as the temporary compatibility crutch, then do steps 7 and 8 as a dedicated isolation/hardening phase.