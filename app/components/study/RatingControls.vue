<script setup lang="ts">
import type { Rating } from '../../types/study'

defineProps<{ disabled: boolean, canUndo: boolean }>()
const emit = defineEmits<{ rate: [rating: Rating], undo: [] }>()
</script>

<template>
  <div class="grid justify-items-center gap-4">
    <div class="grid w-full grid-cols-2 gap-3">
      <UButton
        color="neutral"
        variant="outline"
        size="xl"
        class="min-h-12 cursor-pointer justify-center rounded-[1rem] max-sm:text-sm"
        :disabled="disabled"
        icon="i-lucide-repeat-2"
        @click="emit('rate', 'review')"
      >
        {{ $t('study.review') }}
      </UButton>
      <UButton
        size="xl"
        class="min-h-12 cursor-pointer justify-center rounded-[1rem] max-sm:text-sm"
        :disabled="disabled"
        icon="i-lucide-check"
        @click="emit('rate', 'mastered')"
      >
        {{ $t('study.mastered') }}
      </UButton>
    </div>
    <UButton
      color="neutral"
      class="min-h-10 cursor-pointer justify-center rounded-[1rem] px-4"
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
</style>
