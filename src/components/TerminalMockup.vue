<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, FileText, Folder, GitBranch, PanelRight, Plus, SquareTerminal, X } from 'lucide-vue-next'

const { t, tm } = useI18n()

const editorOpen = ref(true)
const filesOpen = ref(true)

const menu = ['File', 'Edit', 'View', 'Terminal', 'Help']
const runs = [
  { cmd: 'claude', time: '53 s' },
  { cmd: 'agy', time: '12 s', active: true },
  { cmd: 'codex', time: '5.5 s' },
]
const folders = ['dist', 'node_modules', 'public', 'src']
const files = ['index.html', 'README.md', 'LICENSE', 'package.json', 'vite.config.ts']

const lines = () => tm('mock.readme') as string[]
const lineClass = (l: string) =>
  l.startsWith('#') ? 'font-semibold text-accent' : l.startsWith('- ') ? 'text-fg/80' : 'text-fg/70'
</script>

<template>
  <div class="overflow-hidden border border-line bg-surface text-left shadow-2xl shadow-black/20">
    <!-- title bar -->
    <div class="flex h-10 items-center justify-between border-b border-line px-4 text-xs text-muted">
      <div class="flex items-center gap-4">
        <div class="flex gap-2">
          <span class="h-3 w-3 rounded-full bg-red-400/50" /><span class="h-3 w-3 rounded-full bg-yellow-400/50" /><span class="h-3 w-3 rounded-full bg-green-400/50" />
        </div>
        <nav class="hidden gap-4 md:flex"><span v-for="m in menu" :key="m">{{ m }}</span></nav>
      </div>
      <div class="hidden items-center gap-1.5 sm:flex"><Folder :size="13" /> D:\Arctri</div>
      <div class="flex items-center gap-3">
        <span class="hidden items-center gap-1.5 sm:flex"><GitBranch :size="13" /> dark-theme</span>
        <button
          class="p-1 transition hover:text-fg"
          :class="filesOpen ? 'text-accent' : ''"
          :aria-pressed="filesOpen"
          aria-label="Toggle files panel"
          @click="filesOpen = !filesOpen"
        ><PanelRight :size="15" /></button>
      </div>
    </div>

    <!-- terminal tab bar -->
    <div class="flex h-10 items-center gap-2 border-b border-line px-3 text-xs">
      <div class="flex items-center gap-2 border-b-2 border-accent px-2 py-2.5 text-fg">
        <span class="h-1.5 w-1.5 rounded-full bg-green-400" />
        <SquareTerminal :size="13" class="text-muted" />
        <span class="font-medium">Windows PowerShell</span>
        <X :size="12" class="text-muted" />
      </div>
      <Plus :size="14" class="text-muted" />
    </div>

    <div class="flex h-[400px]">
      <!-- terminal -->
      <div class="flex min-w-0 flex-1 flex-col justify-end font-mono text-[13px]">
        <div
          v-for="r in runs"
          :key="r.cmd"
          class="mx-2 flex items-center justify-between border px-3 py-3"
          :class="r.active ? 'border-accent/50 bg-surface-2' : 'border-transparent'"
        >
          <span class="flex items-center gap-2">
            <ChevronRight v-if="r.active" :size="14" class="text-muted" />
            <span class="text-fg/80">PS D:\Arctri&gt;</span>
            <span class="text-yellow-300/80">{{ r.cmd }}</span>
          </span>
          <span class="text-[11px] text-muted"><span class="hidden sm:inline">{{ r.time }} · Interactive program</span></span>
        </div>
        <div class="mt-1 border-t border-line px-5 py-4 text-fg/80">
          PS D:\Arctri&gt; <span class="caret">▌</span>
        </div>
      </div>

      <!-- editor -->
      <div class="hidden min-w-0 flex-[1.2] flex-col border-l border-line md:flex">
        <div class="flex h-10 items-center border-b border-line text-xs">
          <div v-if="editorOpen" class="flex h-full items-center gap-2 border-b-2 border-accent px-3 text-fg">
            <FileText :size="13" class="text-accent" />
            README.md
            <button class="p-0.5 text-muted transition hover:text-fg" aria-label="Close README.md" @click="editorOpen = false">
              <X :size="12" />
            </button>
          </div>
        </div>
        <div v-if="editorOpen" class="flex-1 overflow-auto py-3 font-mono text-[13px] leading-6">
          <div v-for="(l, i) in lines()" :key="i" class="flex">
            <span class="w-10 shrink-0 select-none pr-3 text-right text-muted/60">{{ i + 1 }}</span>
            <span class="min-w-0 whitespace-pre-wrap pr-4" :class="lineClass(l)">{{ l }}</span>
          </div>
        </div>
        <button
          v-else
          class="flex flex-1 items-center justify-center gap-2 text-sm text-muted transition hover:text-fg"
          @click="editorOpen = true"
        >
          <FileText :size="16" /> {{ t('mock.openHint') }}
        </button>
      </div>

      <!-- files -->
      <div v-if="filesOpen" class="hidden w-44 shrink-0 flex-col border-l border-line text-[13px] lg:flex">
        <div class="flex h-10 items-center border-b border-line px-3 text-xs">
          <span class="border-b-2 border-accent py-2.5 font-medium text-fg">Files</span>
        </div>
        <div class="space-y-0.5 overflow-auto p-2">
          <div v-for="f in folders" :key="f" class="flex items-center gap-1.5 px-1.5 py-1 text-muted">
            <ChevronRight :size="12" /><Folder :size="13" class="text-accent/70" />{{ f }}
          </div>
          <button
            v-for="f in files"
            :key="f"
            class="flex w-full items-center gap-1.5 px-1.5 py-1 pl-5 text-left transition hover:bg-surface-2"
            :class="f === 'README.md' ? (editorOpen ? 'bg-surface-2 text-fg' : 'text-fg') : 'cursor-default text-muted'"
            @click="f === 'README.md' && (editorOpen = true)"
          >{{ f }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
