<template>
  <v-card>
    <v-card-title>{{ t('settings.title') }}</v-card-title>
    <v-card-text class="settings-grid">
      <div>
        <div class="label">{{ t('about.configuration-file') }}</div>
        <div class="value linkish" @click="openConfig">{{ settings.file }}</div>
      </div>
      <div>
        <div class="label">Theme</div>
        <div class="value">{{ settings.theme }}</div>
      </div>
      <div>
        <div class="label">Locale</div>
        <div class="value">{{ settings.locale }}</div>
      </div>
      <div>
        <div class="label">Java Path</div>
        <div class="value">{{ settings.javaPath || 'java' }}</div>
      </div>
      <div>
        <div class="label">Engine Path</div>
        <div class="value">{{ settings.enginePath || 'Engine.jar' }}</div>
      </div>
      <v-alert type="info" variant="tonal">
        The full legacy settings UI is still being migrated. This dialog keeps the route and menu flow working during Phase 5.
      </v-alert>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn variant="text" @click="$emit('close')">{{ t('button.close') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

defineEmits(['close'])

const { $store } = useNuxtApp()
const { t } = useI18n()

const settings = computed(() => $store.state.settings)

function openConfig () {
  if (settings.value.file) {
    window.electronAPI.shell.openPath(settings.value.file)
  }
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  gap: 1rem;
}

.label {
  font-weight: 600;
}

.value {
  margin-top: 0.2rem;
  word-break: break-word;
}

.linkish {
  cursor: pointer;
  text-decoration: underline;
}
</style>