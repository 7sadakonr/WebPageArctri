<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
const items = () => tm('faq.items') as { q: string; a: string }[]
</script>

<template>
  <section id="faq" class="mx-auto max-w-3xl scroll-mt-16 px-5 pb-24">
    <h2 v-reveal class="text-center text-3xl font-semibold tracking-tight">{{ t('faq.title') }}</h2>
    <div class="mt-10 divide-y divide-white/10 border-y border-white/10">
      <details v-for="(f, i) in items()" :key="i" class="group py-4">
        <summary class="flex cursor-pointer list-none items-center justify-between font-medium">
          {{ f.q }}<span class="text-white/40 transition group-open:rotate-45">+</span>
        </summary>
        <p class="mt-3 text-sm leading-relaxed text-white/60">{{ f.a }}</p>
      </details>
    </div>
  </section>
</template>
