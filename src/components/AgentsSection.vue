<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ShieldCheck } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<template>
  <section id="agents" class="mx-auto max-w-6xl scroll-mt-16 px-5 py-16">
    <div class="grid gap-4 md:grid-cols-2">
      <div v-reveal class="rounded-xl border border-white/10 bg-surface p-8">
        <h2 class="text-2xl font-semibold tracking-tight">{{ t('agents.title') }}</h2>
        <p class="mt-3 text-white/60">{{ t('agents.body') }}</p>
        <div class="mt-6 flex gap-3 font-mono text-xs text-white/70">
          <span class="rounded-md border border-white/10 px-3 py-1">Claude Code</span>
          <span class="rounded-md border border-white/10 px-3 py-1">Codex CLI</span>
        </div>
      </div>
      <div v-reveal class="rounded-xl border border-white/10 bg-surface p-8">
        <ShieldCheck :size="24" class="text-accent" />
        <h2 class="mt-3 text-2xl font-semibold tracking-tight">{{ t('privacy.title') }}</h2>
        <p class="mt-3 text-white/60">{{ t('privacy.body') }}</p>
      </div>
    </div>
  </section>
</template>
