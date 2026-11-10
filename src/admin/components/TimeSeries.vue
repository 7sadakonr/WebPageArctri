<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ series: { date: string; visits: number }[]; failed?: boolean }>()
const { t } = useI18n()

const W = 640, H = 200, PX = 8, PT = 12, PB = 24
const hover = ref<number | null>(null)
const showTable = ref(false)

const max = computed(() => Math.max(1, ...props.series.map((p) => p.visits)))
const x = (i: number) => PX + (props.series.length <= 1 ? (W - 2 * PX) / 2 : (i / (props.series.length - 1)) * (W - 2 * PX))
const y = (v: number) => PT + (1 - v / max.value) * (H - PT - PB)
const path = computed(() => props.series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.visits).toFixed(1)}`).join(' '))
const ticks = computed(() => [0, 0.5, 1].map((f) => ({ v: Math.round(max.value * f), y: y(max.value * f) })))
const summary = computed(() => t('admin.dashboard.seriesSummary', { n: props.series.length, total: props.series.reduce((s, p) => s + p.visits, 0), max: max.value }))

function onMove(e: PointerEvent) {
  const box = (e.currentTarget as SVGElement).getBoundingClientRect()
  const ratio = (e.clientX - box.left) / box.width
  const i = Math.round(((ratio * W - PX) / (W - 2 * PX)) * (props.series.length - 1))
  hover.value = Math.min(props.series.length - 1, Math.max(0, i))
}
</script>

<template>
  <section class="border border-line bg-surface p-5">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-fg">{{ t('admin.dashboard.visitsOverTime') }}</h3>
      <button v-if="series.length" class="text-xs text-muted hover:text-fg" @click="showTable = !showTable">{{ t('admin.dashboard.tableView') }}</button>
    </div>
    <p v-if="failed" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <p v-else-if="!series.length" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.noData') }}</p>
    <template v-else>
      <div class="relative mt-3">
        <svg :viewBox="`0 0 ${W} ${H}`" class="w-full touch-none" role="img" :aria-label="summary"
          @pointermove="onMove" @pointerleave="hover = null">
          <g class="text-line" stroke="currentColor" stroke-width="1">
            <line v-for="tk in ticks" :key="tk.v" :x1="PX" :x2="W - PX" :y1="tk.y" :y2="tk.y" />
          </g>
          <g class="fill-muted text-[10px]">
            <text v-for="tk in ticks" :key="'l' + tk.v" :x="PX" :y="tk.y - 3">{{ tk.v }}</text>
            <text :x="PX" :y="H - 6">{{ series[0].date }}</text>
            <text :x="W - PX" :y="H - 6" text-anchor="end">{{ series[series.length - 1].date }}</text>
          </g>
          <path :d="path" fill="none" class="stroke-accent" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <g v-if="hover !== null">
            <line :x1="x(hover)" :x2="x(hover)" :y1="PT" :y2="H - PB" class="stroke-muted" stroke-width="1" />
            <circle :cx="x(hover)" :cy="y(series[hover].visits)" r="5" class="fill-accent stroke-surface" stroke-width="2" />
          </g>
        </svg>
        <div v-if="hover !== null" class="pointer-events-none absolute top-0 border border-line bg-bg px-2 py-1 text-xs text-fg"
          :style="{ left: Math.min(80, (x(hover) / W) * 100) + '%' }">
          {{ series[hover].date }} · {{ series[hover].visits.toLocaleString() }}
        </div>
      </div>
      <table v-if="showTable" class="mt-3 w-full text-sm">
        <tbody>
          <tr v-for="p in series" :key="p.date" class="border-t border-line">
            <td class="py-1 text-fg">{{ p.date }}</td><td class="py-1 text-right tabular-nums text-muted">{{ p.visits }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>
