<script setup lang="ts">
defineProps<{ exhausted: boolean, extra: boolean }>()
const emit = defineEmits<{ practice: [] }>()
</script>

<template>
  <section class="completion" role="status">
    <span class="completion-mark" aria-hidden="true">✦</span>
    <h2>{{ $t(exhausted ? 'study.exhaustedTitle' : extra ? 'study.extraComplete' : 'study.completeTitle') }}</h2>
    <p>{{ $t(exhausted ? 'study.exhaustedHint' : 'study.completeHint') }}</p>
    <UButton v-if="!exhausted" size="xl" icon="i-lucide-plus" @click="emit('practice')">{{ $t('study.extraPractice') }}</UButton>
  </section>
</template>

<style scoped>
.completion { display: flex; min-height: 340px; padding: 2rem; flex-direction: column; align-items: center; justify-content: center; gap: 1.2rem; text-align: center; border: 1px solid var(--ui-border); border-radius: 1.75rem; background: var(--study-card); }
.completion-mark { font-size: 3rem; color: var(--ui-primary); }
h2 { font-size: 1.5rem; letter-spacing: -.04em; }
p { font-size: .85rem; color: var(--ui-text-muted); line-height: 1.7; }
</style>
