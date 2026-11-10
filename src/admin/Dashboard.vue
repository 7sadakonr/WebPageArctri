<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Overview, Range } from '../../api/_lib/types'
import BreakdownTable from './components/BreakdownTable.vue'
import DownloadsTable from './components/DownloadsTable.vue'
import StatCard from './components/StatCard.vue'
import TimeSeries from './components/TimeSeries.vue'
import { regionName } from './regionName'

const props = defineProps<{ data: Overview; range: Range }>()
defineEmits<{ 'update:range': [Range] }>()
const { t, locale } = useI18n()

const ranges: Range[] = [7, 30, 90]
const vFail = computed(() => props.data.sources.vercel === 'error')
const gFail = computed(() => props.data.sources.github === 'error')
const countries = computed(() => props.data.byCountry.map((r) => ({ name: regionName(r.code, locale.value), visits: r.visits })))
const referrers = computed(() => props.data.byReferrer.map((r) => ({ name: r.host || t('admin.dashboard.direct'), visits: r.visits })))
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-4 px-5 py-8">
    <div class="flex items-center justify-between">
      <div role="group" :aria-label="t('admin.dashboard.range')" class="flex border border-line text-sm">
        <button v-for="r in ranges" :key="r" :aria-pressed="r === range"
          class="px-3 py-1.5" :class="r === range ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'"
          @click="$emit('update:range', r)">{{ t('admin.dashboard.days', { n: r }) }}</button>
      </div>
      <p class="hidden text-xs text-muted sm:block">{{ t('admin.dashboard.lowerBound') }}</p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <StatCard :label="t('admin.dashboard.visits')" :value="data.totals.visits" :failed="vFail" />
      <StatCard :label="t('admin.dashboard.githubDownloads')" :value="data.totals.githubDownloads" :failed="gFail" />
    </div>
    <TimeSeries :series="data.series" :failed="vFail" />
    <div class="grid gap-4 md:grid-cols-3">
      <BreakdownTable :title="t('admin.dashboard.byOs')" :rows="data.byOs" :failed="vFail" />
      <BreakdownTable :title="t('admin.dashboard.byCountry')" :rows="countries" :failed="vFail" />
      <BreakdownTable :title="t('admin.dashboard.byReferrer')" :rows="referrers" :failed="vFail" />
    </div>
    <DownloadsTable :rows="data.downloads" :failed="gFail" />
  </section>
</template>
