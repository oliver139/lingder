<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="lingder-shell">
    <UHeader :toggle="false" class="static h-auto border-0 bg-transparent backdrop-blur-none" :ui="{ container: 'site-header h-auto px-0 sm:px-0 lg:px-0', left: 'lg:flex-none', right: 'lg:flex-none' }">
      <template #left>
        <NuxtLink class="wordmark" :to="localePath('/')" :aria-label="$t('study.home')"><span class="brand-mark" aria-hidden="true">✦</span>{{ $t('study.brand') }}<span class="brand-dot">.</span></NuxtLink>
      </template>
      <template #right>
        <div class="header-meta"><span>{{ $t('study.smallSteps') }}</span><ThemeToggler /></div>
      </template>
    </UHeader>
    <UMain class="min-h-0">
      <slot />
    </UMain>
    <UFooter :ui="{ container: 'site-footer px-0 sm:px-0 lg:px-0', left: 'order-1 mt-0 justify-start lg:flex-none', center: 'hidden', right: 'order-3 justify-start lg:flex-none' }">
      <template #left><span>{{ $t('study.footer') }}</span></template>
      <template #right><span>{{ $t('study.localOnly') }}</span></template>
    </UFooter>
  </div>
</template>

<style scoped>
</style>
