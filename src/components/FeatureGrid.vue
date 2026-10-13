<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SquareTerminal, Layers, Boxes, TextCursorInput, Bot, GitBranch } from 'lucide-vue-next'

const { t, tm } = useI18n()
const icons = [SquareTerminal, Layers, Boxes, TextCursorInput, Bot, GitBranch]
const items = () => tm('features.items') as { t: string; d: string }[]
</script>

<template>
  <section id="features" class="mx-auto max-w-6xl scroll-mt-16 px-5 py-24">
    <h2 v-reveal class="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('features.title') }}</h2>
    <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="(f, i) in items()" :key="i" v-reveal class="rounded-xl border border-white/10 bg-surface p-6 transition hover:border-white/20">
        <component :is="icons[i]" :size="22" class="text-accent" />
        <h3 class="mt-4 font-medium">{{ f.t }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-white/55">{{ f.d }}</p>
      </div>
    </div>
  </section>
</template>
