<script setup lang="ts">
</script>

<template>
  <UButton
    color="primary"
    class="size-10 p-0"
    variant="ghost"
    :disabled="$colorMode.unknown"
    :aria-label="$colorMode.unknown ? $t('app.theme.switch.theme') : $colorMode.value === 'dark' ? $t('app.theme.switch.light') : $t('app.theme.switch.dark')"
    @click="toggleDark"
  >
    <template #leading="{ ui }">
      <UIcon name="i-bx-sun" :class="ui.leadingIcon()" class="dark:hidden" aria-hidden="true" />
      <UIcon name="i-bx-moon" :class="ui.leadingIcon()" class="hidden dark:inline-block" aria-hidden="true" />
    </template>
  </UButton>
</template>

<style scoped>
</style>
