<script setup lang="ts">
defineProps<{ exhausted: boolean, extra: boolean }>()
const emit = defineEmits<{ practice: [] }>()
</script>

<template>
  <section
    class="
      completion mx-auto flex aspect-3/4 w-full
      max-w-60 flex-col items-center justify-center gap-4
      rounded-[1.75rem] border border-default bg-card p-6
      text-center
      sm:max-w-[21.09375rem]
    "
    role="status"
    tabindex="-1"
  >
    <span class="text-5xl text-primary" aria-hidden="true">✦</span>
    <h2 class="text-2xl tracking-[-0.04em]">{{ $t(exhausted ? 'study.exhaustedTitle' : extra ? 'study.extraComplete' : 'study.completeTitle') }}</h2>
    <p class="text-sm leading-[1.7] text-muted">{{ $t(exhausted ? 'study.exhaustedHint' : 'study.completeHint') }}</p>
    <UButton v-if="!exhausted" size="xl" icon="i-lucide-plus" @click="emit('practice')">{{ $t('study.extraPractice') }}</UButton>
  </section>
</template>

<style scoped>
</style>
