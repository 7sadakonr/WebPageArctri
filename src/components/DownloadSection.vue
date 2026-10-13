<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Monitor, Apple } from 'lucide-vue-next'
import { useLatestRelease } from '../composables/useLatestRelease'

const { t } = useI18n()
const { release, loading } = useLatestRelease()

const cards = computed(() => {
  const r = release.value
  return [
    { icon: Monitor, name: t('download.windows'), req: t('download.windowsReq'), links: [{ label: 'x64 .exe', url: r?.windows?.url }] },
    { icon: Apple, name: t('download.mac'), req: t('download.macReq'), links: [
      { label: 'Apple Silicon .dmg', url: r?.macArm?.url },
      { label: 'Intel .dmg', url: r?.macIntel?.url },
    ] },
  ]
})
</script>

<template>
  <section id="download" class="mx-auto max-w-4xl scroll-mt-16 px-5 py-24 text-center">
    <h2 v-reveal class="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{{ t('download.title') }}</h2>
    <p v-if="release" class="mt-3 text-muted">{{ release.tag }}</p>
    <div class="mt-12 grid gap-4 text-left sm:grid-cols-2">
      <div v-for="c in cards" :key="c.name" v-reveal class="border border-line bg-surface p-6">
        <component :is="c.icon" :size="24" class="text-accent" />
        <h3 class="mt-3 text-lg font-medium text-fg">{{ c.name }}</h3>
        <p class="text-sm text-muted">{{ c.req }}</p>
        <div class="mt-5 space-y-2">
          <template v-for="l in c.links" :key="l.label">
            <a v-if="l.url" :href="l.url" class="flex items-center justify-between bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90">
              {{ t('download.get') }} · {{ l.label }} <Download :size="16" />
            </a>
            <div v-else class="border border-line px-4 py-2.5 text-sm text-muted/70">{{ l.label }}</div>
          </template>
        </div>
      </div>
    </div>
    <p v-if="!loading && !release?.windows && !release?.macArm" class="mt-6 text-sm text-muted">{{ t('download.noRelease') }}</p>
    <p class="mx-auto mt-6 max-w-xl text-xs text-muted/70">{{ t('download.unsigned') }}</p>
  </section>
</template>
