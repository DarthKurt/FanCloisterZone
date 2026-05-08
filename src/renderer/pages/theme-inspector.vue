<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>Theme Inspector</h1>
      <p>This route is back so the desktop menu can navigate without hitting a 404 while the full inspector view is still being migrated.</p>
      <p>Current theme: <strong>{{ currentTheme }}</strong></p>
      <div class="actions">
        <v-btn color="primary" @click="toggleTheme">Toggle Theme</v-btn>
        <v-btn variant="text" @click="router.push('/')">Close</v-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { $store } = useNuxtApp()
const router = useRouter()

const currentTheme = computed(() => $store.state.settings.theme || 'light')

function toggleTheme () {
  const nextTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  $store.dispatch('settings/update', { theme: nextTheme })
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

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>