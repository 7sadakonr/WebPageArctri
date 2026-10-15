<script setup lang="ts">
import { ChevronRight, Folder, GitBranch } from 'lucide-vue-next'
import { CHANGED } from './data'
import { useMockup } from './useMockup'

const m = useMockup()
</script>

<template>
  <div v-if="m.filesOpen" class="hidden w-48 shrink-0 flex-col border-l border-line text-[13px] lg:flex">
    <div class="flex h-10 items-end gap-4 border-b border-line px-3 text-xs">
      <button
        class="h-full border-b-2 font-medium transition"
        :class="m.sideTab === 'files' ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'"
        @click="m.sideTab = 'files'"
      >Files</button>
      <button
        class="flex h-full items-center gap-1.5 border-b-2 transition"
        :class="m.sideTab === 'git' ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'"
        aria-label="Git changes"
        @click="m.sideTab = 'git'"
      >
        <GitBranch :size="13" /><span class="text-[10px]">{{ CHANGED.length }}</span>
      </button>
    </div>

    <template v-if="m.sideTab === 'files'">
      <div class="p-2 pb-0">
        <input
          v-model="m.filter"
          type="text"
          placeholder="Filter"
          aria-label="Filter files"
          class="w-full border border-line bg-bg px-2 py-1 text-xs text-fg outline-none transition placeholder:text-muted/60 focus:border-accent/60"
        />
      </div>
      <div class="flex-1 space-y-0.5 overflow-auto p-2">
        <button
          v-for="r in m.rows"
          :key="r.node.path"
          class="flex w-full items-center gap-1.5 py-1 pr-1.5 text-left transition hover:bg-surface-2"
          :class="!r.node.dir && r.node.path === m.activeFile ? 'bg-surface-2 text-fg' : r.node.dir ? 'text-muted' : 'text-fg/80'"
          :style="{ paddingLeft: `${6 + r.depth * 14}px` }"
          @click="r.node.dir ? m.toggleDir(r.node.path) : m.openFile(r.node.path)"
        >
          <template v-if="r.node.dir">
            <ChevronRight :size="12" class="shrink-0 transition" :class="m.expanded.includes(r.node.path) || m.filter ? 'rotate-90' : ''" />
            <Folder :size="13" class="shrink-0 text-accent/70" />
          </template>
          <span v-else class="w-3 shrink-0" />
          <span class="truncate">{{ r.node.name }}</span>
        </button>
        <div v-if="!m.rows.length" class="px-2 py-3 text-xs text-muted">No matches</div>
      </div>
    </template>

    <div v-else class="flex-1 space-y-0.5 overflow-auto p-2">
      <button
        v-for="c in CHANGED"
        :key="c.path"
        class="flex w-full items-center gap-2 px-1.5 py-1 text-left transition hover:bg-surface-2"
        @click="m.openFile(c.path)"
      >
        <span class="w-3 shrink-0 text-center font-mono text-yellow-300/80">{{ c.flag }}</span>
        <span class="truncate text-fg/80">{{ c.path }}</span>
      </button>
    </div>
  </div>
</template>
