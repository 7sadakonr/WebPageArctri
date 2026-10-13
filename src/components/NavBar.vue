<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Github } from 'lucide-vue-next'
import { setLocale } from '../i18n'
import { REPO_URL } from '../config'

const { t, locale } = useI18n()
const links = ['features', 'agents', 'download', 'faq'] as const
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-bg/70 backdrop-blur-md">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
      <a href="#" class="flex items-center gap-2 font-semibold">
        <img src="/icon.png" alt="" class="h-6 w-6 rounded" /> Arctri
      </a>
      <nav class="hidden gap-6 text-sm text-white/60 md:flex">
        <a v-for="l in links" :key="l" :href="`#${l}`" class="transition hover:text-white">{{ t(`nav.${l}`) }}</a>
      </nav>
      <div class="flex items-center gap-3 text-sm">
        <button class="rounded-md border border-white/10 px-2 py-1 text-white/70 hover:text-white"
          @click="setLocale(locale === 'en' ? 'th' : 'en')">{{ locale === 'en' ? 'TH' : 'EN' }}</button>
        <a :href="REPO_URL" target="_blank" rel="noopener" aria-label="GitHub" class="text-white/70 hover:text-white"><Github :size="18" /></a>
        <a href="#download" class="rounded-md bg-white px-3 py-1.5 font-medium text-black hover:bg-white/90">{{ t('nav.download') }}</a>
      </div>
    </div>
  </header>
</template>
