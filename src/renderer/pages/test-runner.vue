<template>
  <section class="placeholder-page view">
    <div class="panel">
      <div class="eyebrow">Phase 5</div>
      <h1>{{ t('dev.test-runner') }}</h1>
      <p>The engine test route has been reintroduced, but the full runner table still needs its legacy component migration.</p>
      <p>Use the saved game loader from the home screen for now if you need to inspect individual scenarios.</p>
      <v-btn color="primary" @click="router.push('/')">{{ t('button.close') }}</v-btn>
    </div>
  </section>
</template>

<script setup>
const router = useRouter()
const { t } = useI18n()
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
</style>