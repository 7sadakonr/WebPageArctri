<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const ids = ['features', 'agents', 'download', 'faq'] as const
const ticks = Array.from({ length: 101 }, (_, i) => i)

const progress = ref(0)
const positions = ref<Record<string, number>>({})
const hovered = ref(false)
const focused = ref(false)
const open = computed(() => hovered.value || focused.value)
let raf = 0
let ro: ResizeObserver | null = null

const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

function updateProgress() {
  raf = 0
  progress.value = Math.min(100, Math.max(0, (window.scrollY / maxScroll()) * 100))
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(updateProgress)
}

function measure() {
  const next: Record<string, number> = {}
  for (const id of ids) {
    const el = document.getElementById(id)
    if (el) next[id] = Math.min(100, (el.getBoundingClientRect().top + window.scrollY) / maxScroll() * 100)
  }
  positions.value = next
  updateProgress()
}

const active = computed(() => {
  let current: string | null = null
  for (const id of ids) {
    const p = positions.value[id]
    if (p !== undefined && p <= progress.value + 1) current = id
  }
  return current
})

// Collapsed: labels stack at the bottom. Open: each label slides to its section position.
function labelTop(id: string, index: number) {
  if (!open.value) return `calc(100% - ${(ids.length - 1 - index) * 22}px)`
  return `${positions.value[id] ?? 0}%`
}

function jump(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure)
  ro = new ResizeObserver(measure)
  ro.observe(document.body)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  ro?.disconnect()
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <aside
    class="fixed right-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-14 lg:block"
    aria-label="Page progress"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <!-- panel background, only visible when open -->
    <div
      class="absolute inset-0 border-l border-line bg-bg/80 backdrop-blur-md transition-opacity duration-300"
      :class="open ? 'opacity-100' : 'opacity-0'"
    />

    <div class="absolute inset-x-0 bottom-9 top-3">
      <div
        v-for="i in ticks"
        :key="i"
        class="absolute right-0 flex items-center transition-opacity duration-300"
        :class="open ? 'opacity-100' : i % 5 === 0 ? 'opacity-30' : 'opacity-0'"
        :style="{ top: `${i}%`, transform: 'translateY(-50%)' }"
      >
        <span
          v-if="i % 5 === 0"
          class="mr-1.5 font-mono text-[10px] leading-none text-muted transition-opacity duration-300"
          :class="open ? 'opacity-100' : 'opacity-0'"
        >{{ i }}</span>
        <span class="h-px" :class="i % 5 === 0 ? 'w-4 bg-muted' : 'w-2 bg-line'" />
      </div>

      <button
        v-for="(id, index) in ids"
        :key="id"
        v-show="positions[id] !== undefined"
        class="absolute right-full mr-4 -translate-y-1/2 whitespace-nowrap rounded px-1 text-xs font-semibold uppercase tracking-widest transition-[top,color,background-color] duration-500 ease-out hover:text-fg motion-reduce:transition-none"
        :class="[
          active === id || open ? 'text-fg' : 'text-muted/70',
          open ? 'bg-bg/70' : 'bg-transparent',
        ]"
        :style="{ top: labelTop(id, index) }"
        @click="jump(id)"
      >
        {{ t(`nav.${id}`) }}
      </button>

      <!-- progress marker: short when collapsed, long when open -->
      <div
        class="pointer-events-none absolute right-0 h-0.5 bg-fg transition-[width,opacity] duration-300"
        :class="open ? 'w-20 opacity-100 shadow-[0_0_8px_rgba(205,211,220,0.5)]' : 'w-5 opacity-60'"
        :style="{ top: `${progress}%`, transform: 'translateY(-50%)' }"
      />
    </div>

    <div
      class="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center border-t border-line font-mono text-[10px] text-accent transition-opacity duration-300"
      :class="open ? 'opacity-100' : 'opacity-0'"
    >
      {{ Math.round(progress) }}%
    </div>
  </aside>
</template>
