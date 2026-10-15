<script setup lang="ts">
import { ChevronDown, Plus, SquareTerminal, X } from 'lucide-vue-next'
import { PROFILES, SHELL_NAMES } from './data'
import { useMockup } from './useMockup'

const m = useMockup()
</script>

<template>
  <div class="flex h-10 items-end gap-1 border-b border-line px-3 text-xs" role="tablist">
    <div
      v-for="tab in m.terms"
      :key="tab.id"
      role="tab"
      tabindex="0"
      :aria-selected="tab.id === m.activeTerm"
      class="flex h-full cursor-pointer items-center gap-2 border-b-2 px-2 transition"
      :class="tab.id === m.activeTerm ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'"
      @click="m.activeTerm = tab.id"
      @keydown.enter="m.activeTerm = tab.id"
    >
      <span class="h-1.5 w-1.5 rounded-full" :class="tab.id === m.activeTerm ? 'bg-green-400' : 'bg-muted/40'" />
      <SquareTerminal :size="13" class="text-muted" />
      <span class="font-medium">{{ SHELL_NAMES[tab.shell] }}</span>
      <button class="p-0.5 text-muted transition hover:text-fg" :aria-label="`Close ${SHELL_NAMES[tab.shell]}`" @click.stop="m.closeTerm(tab.id)">
        <X :size="12" />
      </button>
    </div>

    <div class="relative flex h-full items-center" data-menu-root>
      <button class="p-1.5 text-muted transition hover:text-fg" aria-label="New terminal" @click="m.newTerm()"><Plus :size="14" /></button>
      <button
        class="p-1 text-muted transition hover:text-fg"
        aria-label="Choose shell"
        aria-haspopup="menu"
        :aria-expanded="m.openMenu === 'shells'"
        @click="m.toggleMenu('shells')"
      ><ChevronDown :size="12" /></button>
      <div v-if="m.openMenu === 'shells'" role="menu" class="absolute left-0 top-full z-20 min-w-44 border border-line bg-surface py-1 shadow-xl shadow-black/30">
        <button
          v-for="s in PROFILES[m.os].shells"
          :key="s"
          role="menuitem"
          class="block w-full px-3 py-1.5 text-left text-muted transition hover:bg-surface-2 hover:text-fg"
          @click="m.newTerm(s)"
        >{{ SHELL_NAMES[s] }}</button>
      </div>
    </div>
  </div>
</template>
