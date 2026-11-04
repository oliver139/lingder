<script setup lang="ts">
const getRouteBaseName = useRouteBaseName()
const route = useRoute()
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

function selectLocale(code: 'zh-Hant' | 'zh-Hans' | 'en' | 'ja') {
  const path = switchLocalePath(code)
  // The default locale must not pass through / and restore the previous preference.
  const explicitPath = code === 'zh-Hant' && !/^\/zh-Hant(?:[/?#]|$)/.test(path)
    ? `/zh-Hant${path}`
    : path
  return navigateTo(explicitPath)
}
</script>

<template>
  <div class="overflow-clip selection:bg-violet-400/40 selection:text-highlighted">
    <div
      class="
        mx-auto flex min-h-dvh w-full max-w-[1260px]
        flex-col px-5
        motion-reduce:**:animate-none motion-reduce:**:transition-none
        sm:px-8
        desktop:px-12
        [&_:focus-visible:not(.study-card)]:outline-3 [&_:focus-visible:not(.study-card)]:outline-offset-4 [&_:focus-visible:not(.study-card)]:outline-primary
      "
    >
      <UHeader
        :toggle="false"
        class="
          static h-auto shrink-0 border-0 bg-transparent
          backdrop-blur-none
        "
        :ui="{
          container: 'grid grid-cols-[1fr_auto] items-center gap-y-0 border-b border-default h-auto px-0 sm:flex sm:px-0 lg:px-0',
          left: 'min-h-18 sm:min-h-24 lg:flex-none',
          center: 'flex col-span-2 row-start-2 justify-center border-t border-default sm:ml-auto sm:border-0',
          right: 'col-start-2 row-start-1 lg:flex-none',
        }"
      >
        <template #left>
          <NuxtLinkLocale
            class="
              flex items-center gap-0.5 text-[1.6rem] font-bold
              tracking-[-0.07em] text-highlighted
            "
            to="/"
            :aria-label="$t('study.home')"
          >
            <span class="mr-2.5 text-2xl text-primary" aria-hidden="true">✦</span>{{ $t('study.brand') }}<span class="text-primary">.</span>
          </NuxtLinkLocale>
        </template>
        <nav
          class="flex items-center gap-2 text-sm font-medium"
          :aria-label="$t('app.navigation.label')"
        >
          <NuxtLinkLocale
            v-for="link in [{ path: '/', name: 'index', label: 'cards' }, { path: '/table', name: 'table', label: 'table' }]"
            :key="link.name"
            v-slot="{ href, navigate }"
            :to="link.path"
            custom
          >
            <a
              :href="href"
              class="
                flex min-h-11 items-center rounded-lg px-2
                text-muted
                hover:text-highlighted
                aria-[current=page]:text-primary
                sm:px-3
              "
              :aria-current="getRouteBaseName(route) === link.name ? 'page' : undefined"
              @click="navigate"
            >{{ $t(`app.navigation.${link.label}`) }}</a>
          </NuxtLinkLocale>
        </nav>
        <template #right>
          <div class="flex items-center gap-1 sm:gap-4">
            <UButton
              to="https://github.com/oliver139/lingder"
              target="_blank"
              rel="noopener noreferrer"
              icon="i-ri-github-fill"
              color="primary"
              variant="ghost"
              class="size-10 justify-center p-0"
              :aria-label="$t('app.github')"
            />
            <USelect
              :model-value="locale"
              :items="locales"
              label-key="name"
              value-key="code"
              icon="i-lucide-languages"
              color="primary"
              variant="ghost"
              :content="{ align: 'end' }"
              class="
                size-10 cursor-pointer justify-center p-0 text-primary
                hover:bg-primary/10
                focus:bg-transparent
                active:bg-primary/10
              "
              :ui="{ leading: 'inset-0 justify-center p-0', leadingIcon: 'text-primary', value: 'sr-only', trailing: 'hidden', content: 'min-w-36' }"
              :aria-label="$t('app.language')"
              @update:model-value="selectLocale($event)"
            />
            <ThemeToggler />
          </div>
        </template>
      </UHeader>
      <UMain class="min-h-0 flex-1">
        <slot />
      </UMain>
      <UFooter class="shrink-0" :ui="{ container: 'flex justify-between gap-4 border-t border-default py-6 text-[0.65rem] text-muted max-sm:flex-col max-sm:gap-2 px-0 sm:px-0 lg:px-0', left: 'order-1 mt-0 justify-start lg:flex-none', center: 'hidden', right: 'order-3 justify-start lg:flex-none' }">
        <template #left><div class="flex flex-wrap items-center gap-2"><span>{{ $t('study.footer') }}</span>•<AudioCredits /></div></template>
        <template #right><span>{{ $t('study.localOnly') }}</span></template>
      </UFooter>
    </div>
  </div>
</template>

<style scoped>
</style>
