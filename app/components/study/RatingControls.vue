<script setup lang="ts">
import type { Rating } from '../../types/study'

defineProps<{ disabled: boolean, canUndo: boolean }>()
const emit = defineEmits<{ rate: [rating: Rating], undo: [] }>()
</script>

<template>
  <div class="rating-controls">
    <div class="rating-buttons">
      <UButton
        color="neutral"
        variant="outline"
        size="xl"
        :disabled="disabled"
        icon="i-lucide-repeat-2"
        @click="emit('rate', 'review')"
      >
        {{ $t('study.review') }}
      </UButton>
      <UButton size="xl" :disabled="disabled" icon="i-lucide-check" @click="emit('rate', 'mastered')">{{ $t('study.mastered') }}</UButton>
    </div>
    <UButton
      color="neutral"
      variant="ghost"
      :disabled="!canUndo"
      icon="i-lucide-undo-2"
      @click="emit('undo')"
    >
      {{ $t('study.undo') }}
    </UButton>
  </div>
</template>

<style scoped>
.rating-controls { display: grid; justify-items: center; gap: .65rem; }
.rating-buttons { display: grid; width: 100%; grid-template-columns: 1fr 1fr; gap: .75rem; }
.rating-buttons :deep(button) { min-height: 48px; justify-content: center; border-radius: 1rem; }
</style>
