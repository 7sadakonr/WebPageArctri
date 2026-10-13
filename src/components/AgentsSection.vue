<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ShieldCheck } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<template>
  <section id="agents" class="mx-auto max-w-6xl scroll-mt-16 px-5 py-16">
    <div class="grid gap-4 md:grid-cols-2">
      <div v-reveal class="border border-line bg-surface p-8">
        <h2 class="text-2xl font-semibold tracking-tight text-fg">{{ t('agents.title') }}</h2>
        <p class="mt-3 text-muted">{{ t('agents.body') }}</p>
        <div class="mt-6 flex gap-3 font-mono text-xs text-muted">
          <span class="border border-line px-3 py-1">Claude Code</span>
          <span class="border border-line px-3 py-1">Codex CLI</span>
        </div>
      </div>
      <div v-reveal class="border border-line bg-surface p-8">
        <ShieldCheck :size="24" class="text-accent" />
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-fg">{{ t('privacy.title') }}</h2>
        <p class="mt-3 text-muted">{{ t('privacy.body') }}</p>
      </div>
    </div>
  </section>
</template>
