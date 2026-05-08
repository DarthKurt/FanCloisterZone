<template>
  <v-card>
    <v-card-text>
      <v-alert type="error" variant="tonal" class="mb-4">
        {{ msg.title }}
      </v-alert>
      <div class="content">{{ msg.content }}</div>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn variant="text" @click="$emit('close')">{{ t('button.close') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineEmits(['close'])
defineProps({
  msg: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
</script>

<style scoped>
.content {
  white-space: pre-wrap;
}
</style>