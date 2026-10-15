<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Plus } from 'lucide-vue-next'
import { promptFor } from './data'
import { suggest } from './commands'
import { useMockup } from './useMockup'

const { t } = useI18n()
const m = useMockup()

const term = computed(() => m.activeTermObj)
const prompt = computed(() => (term.value ? promptFor(term.value.shell, m.os) : ''))
const scroller = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

const ghost = computed(() => {
  const tm = term.value
  if (!tm) return ''
  const s = suggest(tm.input, tm.history)
  return s ? s.slice(tm.input.length) : ''
})

watch(
  () => [term.value?.id, term.value?.blocks.length],
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  },
)

function onKey(e: KeyboardEvent) {
  const tm = term.value
  if (!tm) return
  if (e.key === 'Enter') {
    m.runCommand(tm, tm.input)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (tm.hIdx > 0) { tm.hIdx--; tm.input = tm.history[tm.hIdx] ?? '' }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (tm.hIdx < tm.history.length) { tm.hIdx++; tm.input = tm.history[tm.hIdx] ?? '' }
  } else if ((e.key === 'Tab' || (e.key === 'ArrowRight' && input.value?.selectionStart === tm.input.length)) && ghost.value) {
    e.preventDefault()
    tm.input += ghost.value
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault()
    m.clearTerm(tm)
  }
}
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col font-mono text-[13px]" @click="input?.focus()">
    <template v-if="term">
      <div ref="scroller" class="flex-1 overflow-auto">
        <div class="flex min-h-full flex-col justify-end py-2">
          <div
            v-for="b in term.blocks"
            :key="b.id"
            class="mx-2 cursor-pointer border px-3 py-3 transition"
            :class="m.selectedBlock === b.id ? 'border-accent/50 bg-surface-2' : 'border-transparent hover:bg-surface-2/50'"
            @click.stop="m.selectedBlock = b.id"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="flex min-w-0 items-center gap-2">
                <button v-if="b.out" class="text-muted transition hover:text-fg" :aria-label="b.collapsed ? 'Expand output' : 'Collapse output'" @click.stop="b.collapsed = !b.collapsed">
                  <ChevronRight :size="14" class="transition" :class="b.collapsed ? '' : 'rotate-90'" />
                </button>
                <ChevronRight v-else-if="m.selectedBlock === b.id" :size="14" class="text-muted" />
                <span class="shrink-0 text-fg/80">{{ b.prompt }}</span>
                <span class="truncate text-yellow-300/80">{{ b.cmd }}</span>
              </span>
              <span class="shrink-0 text-[11px]" :class="b.ok ? 'text-muted' : 'text-red-400/80'">
                {{ b.ok ? '✓' : '✗' }} {{ b.time }}<span v-if="b.label" class="hidden sm:inline"> · {{ b.label }}</span>
              </span>
            </div>
            <pre v-if="b.out && !b.collapsed" class="mt-2 whitespace-pre-wrap pl-5 text-[12px] text-fg/70">{{ b.out }}</pre>
          </div>
        </div>
      </div>

      <div v-if="term.agent" class="mx-2 mb-1 flex flex-wrap items-center gap-2 border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent/80">
        <span class="font-semibold">{{ term.agent }}</span><span class="text-muted/70">|</span>
        <span>@ files</span><span>/ commands</span><span>2 changed</span>
        <button class="ml-auto border border-accent/30 px-2 py-0.5 transition hover:bg-accent/10" @click.stop="m.exitAgent(term)">Exit</button>
      </div>

      <label class="flex items-center gap-2 border-t border-line px-5 py-4 text-fg/80">
        <span class="shrink-0">{{ prompt }}</span>
        <span class="relative min-w-0 flex-1">
          <span class="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-muted/50" aria-hidden="true"><span class="invisible">{{ term.input }}</span>{{ ghost }}</span>
          <input
            ref="input"
            v-model="term.input"
            type="text"
            class="relative w-full bg-transparent text-fg outline-none"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            aria-label="Terminal input"
            @keydown="onKey"
          />
        </span>
      </label>
    </template>

    <div v-else class="flex flex-1 items-center justify-center">
      <button class="flex items-center gap-2 border border-line px-4 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg" @click.stop="m.newTerm()">
        <Plus :size="14" /> {{ t('mock.newTerminal') }}
      </button>
    </div>
  </div>
</template>
