<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, X } from 'lucide-vue-next'
import { DOC_KEYS, FILES } from './data'
import { useMockup } from './useMockup'

const { t, tm } = useI18n()
const m = useMockup()

const base = (p: string) => p.split('/').pop() ?? p

const lines = computed<string[]>(() => {
  const f = m.activeFile
  if (!f) return []
  const key = DOC_KEYS[f]
  if (key) return tm(`mock.docs.${key}`) as string[]
  return FILES[f] ?? ['(no preview available)']
})

interface Token { t: string; c: string }
const TOKEN_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\/\/.*|<!--.*?-->)|\b(import|export|from|const|let|default|function|return)\b|(<\/?[A-Za-z][\w-]*)/g

function tokens(line: string): Token[] {
  if (m.activeFile?.endsWith('.md')) {
    const c = line.startsWith('#') ? 'font-semibold text-accent' : line.startsWith('- ') ? 'text-fg/80' : 'text-fg/70'
    return [{ t: line || ' ', c }]
  }
  const out: Token[] = []
  let last = 0
  for (const x of line.matchAll(TOKEN_RE)) {
    const i = x.index ?? 0
    if (i > last) out.push({ t: line.slice(last, i), c: 'text-fg/80' })
    out.push({ t: x[0], c: x[1] ? 'text-green-300/70' : x[2] ? 'italic text-muted' : x[3] ? 'text-accent' : 'text-yellow-300/70' })
    last = i + x[0].length
  }
  if (last < line.length) out.push({ t: line.slice(last), c: 'text-fg/80' })
  return out.length ? out : [{ t: ' ', c: '' }]
}
</script>

<template>
  <div class="hidden min-w-0 flex-[1.2] flex-col border-l border-line md:flex">
    <div class="flex h-10 items-end overflow-x-auto border-b border-line text-xs" role="tablist">
      <div
        v-for="path in m.tabs"
        :key="path"
        role="tab"
        tabindex="0"
        :aria-selected="path === m.activeFile"
        class="flex h-full shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 transition"
        :class="path === m.activeFile ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'"
        @click="m.selectFile(path)"
        @keydown.enter="m.selectFile(path)"
      >
        <FileText :size="13" :class="path === m.activeFile ? 'text-accent' : ''" />
        {{ base(path) }}
        <button class="p-0.5 text-muted transition hover:text-fg" :aria-label="`Close ${base(path)}`" @click.stop="m.closeFile(path)">
          <X :size="12" />
        </button>
      </div>
    </div>

    <div v-if="m.editorOpen && m.activeFile" class="flex-1 overflow-auto py-3 font-mono text-[13px] leading-6">
      <div
        v-for="(l, i) in lines"
        :key="i"
        class="flex cursor-text"
        :class="m.activeLine === i ? 'bg-surface-2' : ''"
        @click="m.activeLine = i"
      >
        <span class="w-10 shrink-0 select-none pr-3 text-right" :class="m.activeLine === i ? 'text-fg/70' : 'text-muted/60'">{{ i + 1 }}</span>
        <span class="min-w-0 whitespace-pre-wrap break-words pr-4"><span v-for="(tok, k) in tokens(l)" :key="k" :class="tok.c">{{ tok.t }}</span></span>
      </div>
    </div>
    <button
      v-else
      class="flex flex-1 items-center justify-center gap-2 text-sm text-muted transition hover:text-fg"
      @click="m.openFile('README.md')"
    >
      <FileText :size="16" /> {{ t('mock.openHint') }}
    </button>
  </div>
</template>
