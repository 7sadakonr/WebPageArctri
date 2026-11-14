<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHART, nearestIndex, xAt, yAt } from '../chartGeometry'

const props = defineProps<{ series: { date: string; visits: number }[]; failed?: boolean }>()
const { t } = useI18n()

const H = CHART.height
const box = ref<HTMLElement | null>(null)
const width = ref(640)
const hover = ref<number | null>(null)
const showTable = ref(false)

// Draw at the real pixel width so text and strokes stay the same size on every screen.
let observer: ResizeObserver | null = null
watch(box, (el) => {
  observer?.disconnect()
  if (!el || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => { width.value = Math.max(200, Math.round(entry.contentRect.width)) })
  observer.observe(el)
}, { flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())

const max = computed(() => Math.max(1, ...props.series.map((p) => p.visits)))
const x = (i: number) => xAt(i, props.series.length, width.value)
const y = (v: number) => yAt(v, max.value)
const path = computed(() => props.series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.visits).toFixed(1)}`).join(' '))
const ticks = computed(() => [0, 0.5, 1].map((f, i) => ({ k: i, v: Math.round(max.value * f), y: y(max.value * f) })))
const summary = computed(() => t('admin.dashboard.seriesSummary', { n: props.series.length, total: props.series.reduce((s, p) => s + p.visits, 0), max: max.value }))
const tipLeft = computed(() => (hover.value === null ? 0 : Math.min(Math.max(x(hover.value), 64), width.value - 64)))

function onMove(e: PointerEvent) {
  const r = (e.currentTarget as SVGElement).getBoundingClientRect()
  hover.value = nearestIndex(e.clientX, r.left, r.width, props.series.length)
}
</script>

<template>
  <section class="border border-line bg-surface p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-medium text-fg">{{ t('admin.dashboard.visitsOverTime') }}</h3>
      <button v-if="series.length" class="min-h-11 px-2 text-xs text-muted hover:text-fg" @click="showTable = !showTable">{{ t('admin.dashboard.tableView') }}</button>
    </div>
    <p v-if="failed" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <p v-else-if="!series.length" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.noData') }}</p>
    <template v-else>
      <div ref="box" class="relative mt-1">
        <svg :viewBox="`0 0 ${width} ${H}`" :width="width" :height="H" class="block w-full touch-pan-y" role="img" :aria-label="summary"
          @pointermove="onMove" @pointerdown="onMove" @pointerleave="hover = null" @pointercancel="hover = null">
          <g class="text-line" stroke="currentColor" stroke-width="1">
            <line v-for="tk in ticks" :key="tk.k" :x1="CHART.padX" :x2="width - CHART.padX" :y1="tk.y" :y2="tk.y" />
          </g>
          <g class="fill-muted" font-size="11">
            <text v-for="tk in ticks" :key="'l' + tk.k" :x="CHART.padX" :y="tk.y - 4">{{ tk.v }}</text>
            <text :x="CHART.padX" :y="H - 6">{{ series[0].date }}</text>
            <text :x="width - CHART.padX" :y="H - 6" text-anchor="end">{{ series[series.length - 1].date }}</text>
          </g>
          <path :d="path" fill="none" class="stroke-accent" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <g v-if="hover !== null">
            <line :x1="x(hover)" :x2="x(hover)" :y1="CHART.padTop" :y2="H - CHART.padBottom" class="stroke-muted" stroke-width="1" />
            <circle :cx="x(hover)" :cy="y(series[hover].visits)" r="5" class="fill-accent stroke-surface" stroke-width="2" />
          </g>
        </svg>
        <div v-if="hover !== null" class="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap border border-line bg-bg px-2 py-1 text-xs text-fg"
          :style="{ left: tipLeft + 'px' }">
          {{ series[hover].date }} · {{ series[hover].visits.toLocaleString() }}
        </div>
      </div>
      <div v-if="showTable" class="mt-3 max-h-64 overflow-y-auto">
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="p in series" :key="p.date" class="border-t border-line">
              <td class="py-1 text-fg">{{ p.date }}</td><td class="py-1 text-right tabular-nums text-muted">{{ p.visits }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
