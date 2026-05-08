<template>
  <v-card class="about-dialog">
    <v-card-text class="content">
      <section class="splash">
        <img :src="splashImage" :alt="t('about.fantitle')" />
      </section>

      <section class="meta-grid">
        <div>
          <div class="label">{{ t('about.author') }}</div>
          <div>Roman Krejcik and fans</div>
        </div>
        <div>
          <div class="label">{{ t('about.version') }}</div>
          <div>{{ version }}</div>
        </div>
        <div>
          <div class="label">{{ t('about.configuration-file') }}</div>
          <div class="linkish" @click="openConfig">{{ settingsFile }}</div>
        </div>
        <div>
          <div class="label">{{ t('about.system-java-version') }}</div>
          <div>{{ javaLabel }}</div>
        </div>
        <div>
          <div class="label">{{ t('about.jcloisterzone-game-engine') }}</div>
          <div>{{ enginePath }}</div>
          <div>{{ engineVersion }}</div>
        </div>
      </section>
    </v-card-text>

    <v-card-actions class="justify-space-between">
      <v-btn variant="text" @click="openReportBug">{{ t('menu.report-bug') }}</v-btn>
      <v-btn variant="text" @click="$emit('close')">{{ t('button.close') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

import splashDark from '~/assets/splash_dark.png'
import splashLight from '~/assets/splash_light.png'
import { getAppVersion } from '@/utils/version'

defineEmits(['close'])

const { $store } = useNuxtApp()
const { t } = useI18n()

const version = getAppVersion()
const splashImage = computed(() => ($store.state.settings.theme === 'dark' ? splashDark : splashLight))
const settingsFile = computed(() => $store.state.settings.file || '')
const javaLabel = computed(() => {
  if (!$store.state.java) return ''
  return [$store.state.java.vendor, $store.state.java.version].filter(Boolean).join(' ')
})
const enginePath = computed(() => $store.state.engine?.path || '')
const engineVersion = computed(() => $store.state.engine?.version || '')

function openConfig () {
  if (settingsFile.value) {
    window.electronAPI.shell.openPath(settingsFile.value)
  }
}

function openReportBug () {
  window.electronAPI.shell.openExternal('https://discord.gg/CswNeVg3eS')
}
</script>

<style scoped>
.content {
  display: grid;
  gap: 1.25rem;
}

.splash {
  display: flex;
  justify-content: center;
}

.splash img {
  max-width: min(100%, 420px);
}

.meta-grid {
  display: grid;
  gap: 1rem;
}

.label {
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.linkish {
  cursor: pointer;
  text-decoration: underline;
}
</style>