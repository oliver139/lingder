<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div
    class="
      mx-auto max-w-[1260px] px-5
      **:focus-visible:outline-3 **:focus-visible:outline-offset-4 **:focus-visible:outline-primary
      motion-reduce:**:animate-none motion-reduce:**:transition-none
      sm:px-8
      desktop:px-12
    "
  >
    <UHeader :toggle="false" class="static h-auto border-0 bg-transparent backdrop-blur-none" :ui="{ container: 'flex min-h-18 items-center justify-between border-b border-default sm:min-h-24 h-auto px-0 sm:px-0 lg:px-0', left: 'lg:flex-none', right: 'lg:flex-none' }">
      <template #left>
        <NuxtLink
          class="
            flex items-center gap-0.5 text-[1.6rem] font-bold
            tracking-[-0.07em] text-highlighted
          "
          :to="localePath('/')"
          :aria-label="$t('study.home')"
        >
          <span class="mr-2.5 text-2xl text-primary" aria-hidden="true">✦</span>{{ $t('study.brand') }}<span class="text-primary">.</span>
        </NuxtLink>
      </template>
      <template #right>
        <div
          class="
            flex items-center gap-6 text-[0.7rem] text-muted
            [&>span]:hidden
            sm:[&>span]:inline
          "
        >
          <span>{{ $t('study.smallSteps') }}</span><ThemeToggler />
        </div>
      </template>
    </UHeader>
    <UMain class="min-h-0">
      <slot />
    </UMain>
    <UFooter :ui="{ container: 'flex justify-between gap-4 border-t border-default py-6 text-[0.65rem] text-muted max-sm:flex-col max-sm:gap-2 px-0 sm:px-0 lg:px-0', left: 'order-1 mt-0 justify-start lg:flex-none', center: 'hidden', right: 'order-3 justify-start lg:flex-none' }">
      <template #left><span>{{ $t('study.footer') }}</span></template>
      <template #right><span>{{ $t('study.localOnly') }}</span></template>
    </UFooter>
  </div>
</template>

<style scoped>
</style>
