<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Github } from 'lucide-vue-next'
import { setLocale } from '../i18n'
import { REPO_URL } from '../config'

const { t, locale } = useI18n()
const links = ['features', 'agents', 'download', 'faq'] as const
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
      <a href="#" class="flex items-center gap-2 font-semibold text-fg">
        <img src="/icon.png" alt="" class="h-6 w-6 rounded" /> Arctri
      </a>
      <nav class="hidden gap-6 text-sm text-muted md:flex">
        <a v-for="l in links" :key="l" :href="`#${l}`" class="transition hover:text-fg">{{ t(`nav.${l}`) }}</a>
      </nav>
      <div class="flex items-center gap-3 text-sm">
        <button class="rounded-md border border-line px-2 py-1 text-muted hover:text-fg"
          @click="setLocale(locale === 'en' ? 'th' : 'en')">{{ locale === 'en' ? 'TH' : 'EN' }}</button>
        <a :href="REPO_URL" target="_blank" rel="noopener" aria-label="GitHub" class="text-muted hover:text-fg"><Github :size="18" /></a>
        <a href="#download" class="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg hover:bg-accent/90">{{ t('nav.download') }}</a>
      </div>
    </div>
  </header>
</template>
