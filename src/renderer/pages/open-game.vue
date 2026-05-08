<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>{{ gameName }}</h1>
      <p>The open-game lobby route is back in place. The detailed slot management UI will be restored in the next component pass.</p>
      <dl class="summary-grid">
        <div>
          <dt>Game Key</dt>
          <dd>{{ gameKey || 'Unavailable' }}</dd>
        </div>
        <div>
          <dt>Slots</dt>
          <dd>{{ slotCount }}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{{ isOwner ? 'Local player' : 'Remote host' }}</dd>
        </div>
      </dl>
      <div class="actions">
        <v-btn color="primary" :disabled="!canStart" @click="startGame">{{ t('button.start') }}</v-btn>
        <v-btn variant="text" @click="leave">{{ t('menu.leave-game') }}</v-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { $store } = useNuxtApp()
const router = useRouter()
const { t } = useI18n()

const gameName = computed(() => $store.state.game.name || t('game-setup.open-game.untitled-game'))
const gameKey = computed(() => $store.state.game.key)
const slotCount = computed(() => ($store.state.game.slots || []).length)
const isOwner = computed(() => $store.state.game.owner === $store.state.settings.clientId)
const canStart = computed(() => isOwner.value && !!$store.state.game.id)

async function startGame () {
  await $store.dispatch('game/start')
}

async function leave () {
  await $store.dispatch('networking/close')
  router.push('/')
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