<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Overview } from '../../../api/_lib/types'

const props = defineProps<{ sync: Overview['sync']; failed?: boolean }>()
const { t } = useI18n()
const symbol = computed(() => ({ 'in-sync': '✓', behind: '⚠', unknown: '?' })[props.sync.status])
const dash = '—'
</script>

<template>
  <section class="border border-line bg-surface p-5">
    <h3 class="text-sm font-medium text-fg">{{ t('admin.dashboard.sync.title') }}</h3>
    <p v-if="failed" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <template v-else>
      <p class="mt-3 text-lg font-semibold text-fg"><span aria-hidden="true">{{ symbol }}</span> {{ t(`admin.dashboard.sync.status.${sync.status}`) }}</p>
      <dl class="mt-2 grid grid-cols-2 gap-1 text-sm">
        <dt class="text-muted">{{ t('admin.dashboard.sync.website') }}</dt><dd class="text-right tabular-nums text-fg">{{ sync.website ?? dash }}</dd>
        <dt class="text-muted">{{ t('admin.dashboard.sync.github') }}</dt><dd class="text-right tabular-nums text-fg">{{ sync.github ?? dash }}</dd>
      </dl>
      <p class="mt-2 text-xs text-muted">{{ t('admin.dashboard.sync.note') }}</p>
    </template>
  </section>
</template>
