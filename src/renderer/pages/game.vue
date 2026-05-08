<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>{{ t('menu.new-game') }}</h1>
      <p>The main game route is registered again. The board, layers, and action panels still need their component tree restored.</p>
      <dl class="summary-grid">
        <div>
          <dt>Phase</dt>
          <dd>{{ phase || 'Loading' }}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>{{ playerCount }}</dd>
        </div>
        <div>
          <dt>History Visible</dt>
          <dd>{{ showHistory ? 'Yes' : 'No' }}</dd>
        </div>
      </dl>
      <div class="actions">
        <v-btn color="primary" @click="router.push('/')">{{ t('button.close') }}</v-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { $store } = useNuxtApp()
const router = useRouter()
const { t } = useI18n()

const phase = computed(() => $store.state.game.phase)
const playerCount = computed(() => ($store.state.game.players || []).length)
const showHistory = computed(() => $store.state.showGameHistory)
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
</style>