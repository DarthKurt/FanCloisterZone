<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>{{ t('button.play-online-fan') }}</h1>
      <p>The online route is back and wired to the migrated networking store. The lobby cards and join flow UI will follow in the next pass.</p>
      <dl class="summary-grid">
        <div>
          <dt>Status</dt>
          <dd>{{ connectionStatus || 'idle' }}</dd>
        </div>
        <div>
          <dt>Public Games</dt>
          <dd>{{ publicGameCount }}</dd>
        </div>
        <div>
          <dt>Your Games</dt>
          <dd>{{ privateGameCount }}</dd>
        </div>
      </dl>
      <div class="actions">
        <v-btn color="primary" :disabled="connected" @click="connect">{{ t('button.play-online-fan') }}</v-btn>
        <v-btn variant="text" :disabled="!connected" @click="disconnect">{{ t('button.disconnect') }}</v-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { $store } = useNuxtApp()
const { t } = useI18n()

const connectionStatus = computed(() => $store.state.networking.connectionStatus)
const connected = computed(() => $store.state.networking.connectionStatus === 'connected')
const publicGameCount = computed(() => $store.state.online.gamePublicList.length)
const privateGameCount = computed(() => $store.state.online.gameList.length)

function connect () {
  $store.dispatch('networking/connectPlayOnlineFan')
}

function disconnect () {
  $store.dispatch('networking/close')
}
</script>

<style scoped>
.placeholder-page {
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.panel {
  width: min(100%, 720px);
  border-radius: 24px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  opacity: 0.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.summary-grid dt {
  font-weight: 600;
}

.summary-grid dd {
  margin: 0.25rem 0 0;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>