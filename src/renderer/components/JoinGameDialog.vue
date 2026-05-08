<template>
  <v-card>
    <v-card-title>{{ t('join-game.title') }}</v-card-title>
    <v-card-text>
      <p>{{ t('join-game.connect-to-remote-host') }}</p>
      <p class="hint"><i>{{ t('join-game.description') }}</i></p>

      <v-progress-linear v-if="connecting" indeterminate class="mb-4" />
      <v-text-field
        v-else
        ref="input"
        v-model="host"
        :label="t('join-game.host')"
        @keydown.enter="connect"
      />

      <v-alert v-if="error" type="error" variant="tonal">
        {{ error }}
      </v-alert>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn variant="text" @click="$emit('close')">{{ t('button.cancel') }}</v-btn>
      <v-btn variant="text" :disabled="host.trim() === '' || connecting" @click="connect">{{ t('button.connect') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'

import { connectExceptionToMessage } from '@/utils/networking'

const emit = defineEmits(['close'])

const { $store } = useNuxtApp()
const { t } = useI18n()

const input = ref(null)
const connecting = ref(false)
const error = ref(null)
const host = ref($store.state.settings.recentJoinedGames[0] || '')

async function connect () {
  connecting.value = true
  error.value = null

  try {
    await $store.dispatch('networking/connect', { host: host.value, connectionType: 'direct' })
    $store.dispatch('settings/addRecentJoinedGame', host.value)
    connecting.value = false
    input.value = null
    emit('close')
  } catch (e) {
    connecting.value = false
    error.value = connectExceptionToMessage(e)
    console.error(e)
  }
}

onMounted(async () => {
  await nextTick()
  input.value?.focus?.()
})
</script>

<style scoped>
.hint {
  margin-bottom: 1rem;
}
</style>