<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>{{ t('menu.new-game') }}</h1>
      <p v-if="!hasSetup">No setup is prepared yet. Start from the home screen to create one.</p>
      <template v-else>
        <p>The full setup grid is still being migrated. The underlying Vuex state is live and ready for the next component pass.</p>
        <dl class="summary-grid">
          <div>
            <dt>Selected Sets</dt>
            <dd>{{ setCount }}</dd>
          </div>
          <div>
            <dt>Rules</dt>
            <dd>{{ ruleCount }}</dd>
          </div>
          <div>
            <dt>AI Enabled</dt>
            <dd>{{ aiEnabled ? 'Yes' : 'No' }}</dd>
          </div>
        </dl>
      </template>
      <div class="actions">
        <v-btn color="primary" :disabled="!hasSetup" @click="createGame">{{ t('button.create') }}</v-btn>
        <v-btn variant="text" @click="router.push('/')">{{ t('button.close') }}</v-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { $store } = useNuxtApp()
const router = useRouter()
const { t } = useI18n()

const hasSetup = computed(() => !!$store.state.gameSetup.sets)
const setCount = computed(() => Object.keys($store.state.gameSetup.sets || {}).length)
const ruleCount = computed(() => Object.keys($store.state.gameSetup.rules || {}).length)
const aiEnabled = computed(() => $store.state.gameSetup.ai)

async function createGame () {
  await $store.dispatch('gameSetup/createGame')
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