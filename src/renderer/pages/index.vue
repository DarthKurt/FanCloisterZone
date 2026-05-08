<template>
  <div class="landing-view view">
    <div class="alerts">
      <v-alert
        v-if="java?.error === 'not-found' && !javaSelectedByUser"
        type="warning"
        variant="tonal"
        class="mb-3"
      >
        <div>{{ t('settings.java.unable-to-find-java') }}</div>
        <div class="mt-2">{{ t('settings.java.java-is-required') }}</div>
        <div class="mt-2 actions-inline">
          <a href="#" @click.prevent="openLink('https://www.oracle.com/java/technologies/downloads/')">{{ t('settings.java.download-java') }}</a>
          <a href="#" @click.prevent="openSettings">{{ t('settings.title') }}</a>
        </div>
      </v-alert>

      <v-alert
        v-if="java?.error === 'outdated'"
        type="warning"
        variant="tonal"
        class="mb-3"
      >
        <div>{{ t('settings.java.java-is-outdated') }}</div>
        <div class="mt-2">{{ t('settings.java.java-version-found', { version: java.version }) }}</div>
        <div class="mt-2 actions-inline">
          <a href="#" @click.prevent="openLink('https://www.oracle.com/java/technologies/downloads/')">{{ t('settings.java.download-java') }}</a>
          <a href="#" @click.prevent="openSettings">{{ t('settings.title') }}</a>
        </div>
      </v-alert>

      <v-alert
        v-if="engine?.error === 'not-found'"
        type="warning"
        variant="tonal"
        class="mb-3"
      >
        <div>{{ t('settings.engine.engine-path-not-exists', { path: engine.path }) }}</div>
      </v-alert>

      <v-alert
        v-if="engine?.error === 'exec-error'"
        type="warning"
        variant="tonal"
        class="mb-3"
      >
        <div>{{ t('settings.engine.unable-to-spawn-game-engine') }}</div>
        <small>{{ engine.errorMessage }}</small>
      </v-alert>

      <v-alert
        v-if="artworksLoaded && !hasClassicAddon"
        type="warning"
        variant="tonal"
      >
        <div>{{ t('settings.add-ons.artwork-not-found-internet-connection-is-needed') }}</div>
        <div>{{ t('settings.add-ons.please-check-connectivity-and-restart-app') }}</div>
        <small v-if="classicAddonUrl">
          {{ t('settings.add-ons.add-on-url') }}:
          <a :href="classicAddonUrl" @click.prevent="openLink(classicAddonUrl)">{{ classicAddonUrl }}</a>
        </small>
      </v-alert>
    </div>

    <div v-if="download" class="download-box">
      <v-progress-linear
        v-if="download.size"
        :model-value="(download.progress / download.size) * 100"
      />
      <v-progress-linear v-else indeterminate />
    </div>

    <section class="splash">
      <img :src="splashImage" alt="FanCloisterZone splash" />
    </section>

    <section class="hero-card surface-card">
      <div>
        <div class="eyebrow">Fan-hosted</div>
        <h1>{{ t('index.online.title-fan') }}</h1>
        <p>{{ t('index.online.online-storage-description') }}</p>
      </div>
      <v-btn size="large" color="primary" :disabled="!appReady || !engine?.ok" @click="playOnlineFan">
        {{ t('button.play-online-fan') }}
      </v-btn>
    </section>

    <section class="local-card surface-card">
      <div class="section-head">
        <div>
          <div class="eyebrow">Local</div>
          <h2>{{ t('index.local.local-games') }}</h2>
        </div>
      </div>

      <div class="button-row">
        <v-btn size="large" color="primary" :disabled="!appReady" @click="newGame()">
          {{ t('index.local.new-game') }}
        </v-btn>

        <v-btn v-if="settings.devMode === true" size="large" color="secondary" :disabled="!appReady" @click="newGameAI()">
          {{ t('index.local.new-game-against-ai') }}
        </v-btn>

        <v-btn size="large" color="secondary" :disabled="!appReady || !engine?.ok" @click="loadGame">
          {{ t('index.local.open-game') }}
        </v-btn>
      </div>

      <p class="favorites-copy">
        {{ t('index.local.create-directly-from') }}
        <a href="#" @click.prevent="newGame(0)">{{ t('index.local.my-favorites') }}</a>
      </p>

      <div v-if="recentSaves.length" class="recent-saves">
        <h3>{{ t('index.local.continue-with-recently-saved-games') }}</h3>
        <div class="recent-list">
          <a
            v-for="save in recentSaves"
            :key="save"
            href="#"
            @click.prevent="loadSavedGame(save)"
          >
            {{ save }}
          </a>
        </div>
        <v-btn variant="text" color="secondary" @click="clearRecentSaves">
          {{ t('button.clear-list') }}
        </v-btn>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import splashDark from '~/assets/splash_dark.png'
import splashLight from '~/assets/splash_light.png'

const { $addons, $store } = useNuxtApp()
const router = useRouter()
const { t } = useI18n()

const classicAddonUrl = ref('')
const recentSaves = ref([...$store.state.settings.recentSaves])

const java = computed(() => $store.state.java)
const javaSelectedByUser = computed(() => $store.state.settings.javaPath)
const engine = computed(() => $store.state.engine)
const download = computed(() => $store.state.download)
const settings = computed(() => $store.state.settings)
const artworksLoaded = computed(() => $store.state.loaded.artworks)
const hasClassicAddon = computed(() => $store.state.hasClassicAddon)
const appReady = computed(() => $store.state.loaded.settings && $store.getters.loaded)
const splashImage = computed(() => ($store.state.settings.theme === 'dark' ? splashDark : splashLight))

watch(() => $store.state.loaded.settings, () => {
  recentSaves.value = [...$store.state.settings.recentSaves]
})

watch(() => $store.state.settings.addonsManifestUrl, () => {
  refreshClassicAddonUrl()
})

async function refreshClassicAddonUrl () {
  try {
    const urls = await $addons.getDefaultArtworkUrl()
    classicAddonUrl.value = Array.isArray(urls) ? (urls.find(Boolean) || '') : (urls || '')
  } catch {
    classicAddonUrl.value = ''
  }
}

function openSettings () {
  $store.commit('showSettings', true)
}

function openLink (href) {
  window.electronAPI.shell.openExternal(href)
}

function newGame (tab) {
  $store.dispatch('gameSetup/newGame')
  router.push('/game-setup' + (tab !== undefined ? `?tab=${tab}` : ''))
}

function newGameAI (tab) {
  $store.dispatch('gameSetup/newGameAI')
  router.push('/game-setup' + (tab !== undefined ? `?tab=${tab}` : ''))
}

function playOnlineFan () {
  $store.dispatch('networking/connectPlayOnlineFan')
}

function loadGame () {
  $store.dispatch('game/load')
}

async function loadSavedGame (file) {
  try {
    await $store.dispatch('game/load', { file })
  } catch {
    await $store.dispatch('settings/validateRecentSaves')
    recentSaves.value = [...$store.state.settings.recentSaves]
  }
}

function clearRecentSaves () {
  $store.dispatch('settings/clearRecentSaves')
  recentSaves.value = []
}

onMounted(async () => {
  await refreshClassicAddonUrl()
})
</script>

<style scoped>
.landing-view {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
}

.alerts {
  display: grid;
  gap: 0.75rem;
}

.actions-inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.download-box {
  padding: 0 0.25rem;
}

.surface-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(255, 255, 255, 0.02));
}

.splash {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 24vh;
}

.splash img {
  max-width: min(100%, 640px);
}

.hero-card,
.local-card {
  display: grid;
  gap: 1rem;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 0.35rem;
}

.button-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.favorites-copy,
.recent-saves h3,
.hero-card p {
  margin: 0;
}

.recent-saves {
  display: grid;
  gap: 0.75rem;
}

.recent-list {
  display: grid;
  gap: 0.35rem;
}

@media (max-width: 720px) {
  .landing-view {
    padding: 1rem;
  }

  .surface-card {
    padding: 1rem;
  }
}
</style>