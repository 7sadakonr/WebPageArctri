<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Overview } from '../../../api/_lib/types'

defineProps<{ rows: Overview['downloads']; failed?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <section class="border border-line bg-surface p-4 sm:p-5">
    <h3 class="text-sm font-medium text-fg">{{ t('admin.dashboard.downloads') }}</h3>
    <p class="mt-1 text-xs text-muted">{{ t('admin.dashboard.githubNote') }}</p>
    <p v-if="failed" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <p v-else-if="!rows.length" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.noData') }}</p>
    <div v-else class="mt-3 overflow-x-auto">
    <table class="w-full min-w-[18rem] text-sm">
      <thead class="text-left text-muted">
        <tr><th class="py-1 font-normal">{{ t('admin.dashboard.version') }}</th><th class="py-1 font-normal">{{ t('admin.dashboard.platform') }}</th><th class="py-1 text-right font-normal">{{ t('admin.dashboard.count') }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i" class="border-t border-line">
          <td class="py-1 text-fg">{{ r.version }}</td>
          <td class="py-1 text-fg">{{ t(`admin.dashboard.platforms.${r.platform}`) }}</td>
          <td class="py-1 text-right tabular-nums text-muted">{{ r.githubCount.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </section>
</template>
