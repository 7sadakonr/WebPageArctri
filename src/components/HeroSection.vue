<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import TerminalMockup from './TerminalMockup.vue'
import { detectOS, osLabel } from '../composables/useOS'
import { useLatestRelease } from '../composables/useLatestRelease'
import { RELEASES_URL } from '../config'

const { t } = useI18n()
const os = detectOS()
const { release } = useLatestRelease()

const href = computed(() => {
  const r = release.value
  const asset = os === 'mac' ? (r?.macArm ?? r?.macIntel) : r?.windows
  return asset?.browser_download_url ?? RELEASES_URL
})
</script>

<template>
  <section class="relative overflow-hidden px-5 pb-24 pt-36 text-center">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(143,184,222,0.08),transparent_70%)]" />
    <div class="relative mx-auto max-w-3xl">
      <span class="mb-6 inline-block rounded-full border border-line px-3 py-1 text-xs text-muted">
        {{ t('hero.badge') }}<template v-if="release"> · {{ release.tag }}</template>
      </span>
      <h1 class="text-4xl font-semibold leading-[1.1] tracking-tight text-fg sm:text-6xl">{{ t('hero.title') }}</h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg text-muted">{{ t('hero.subtitle') }}</p>
      <div class="mt-9 flex flex-wrap justify-center gap-3">
        <a :href="href" class="hidden items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-accent-fg hover:bg-accent/90 sm:inline-flex">
          <Download :size="18" /> {{ t('hero.downloadFor', { os: osLabel[os] }) }}
        </a>
        <a href="#download" class="rounded-lg bg-accent px-5 py-3 font-medium text-accent-fg sm:hidden">{{ t('hero.mobile') }}</a>
        <a href="#download" class="rounded-lg border border-line px-5 py-3 text-fg/80 hover:bg-surface-2">{{ t('hero.allDownloads') }}</a>
      </div>
    </div>
    <div class="relative mx-auto mt-16 max-w-4xl"><TerminalMockup /></div>
  </section>
</template>
