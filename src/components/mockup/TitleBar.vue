<script setup lang="ts">
import { Check, Folder, GitBranch, Minus, PanelRight, Square, X } from 'lucide-vue-next'
import { BRANCHES, MENUS, PROFILES } from './data'
import { useMockup } from './useMockup'
import { useLatestRelease } from '../../composables/useLatestRelease'

const m = useMockup()
const { release } = useLatestRelease()

function onDoubleClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button, [role="menu"]')) return
  m.toggleMaximize()
}

function hoverSwitch(id: string) {
  if (MENUS.some((x) => x.id === m.openMenu)) m.setMenu(id)
}
</script>

<template>
  <div
    class="relative flex h-10 select-none items-center justify-between border-b border-line pl-3 text-xs text-muted"
    :class="m.os === 'windows' ? 'pr-0' : 'pr-3'"
    @dblclick="onDoubleClick"
  >
    <!-- left -->
    <div class="flex items-center gap-3">
      <div v-if="m.os === 'mac'" class="group flex gap-2">
        <button aria-label="Close window" class="flex h-3 w-3 items-center justify-center rounded-full bg-red-400/70 text-black/70 hover:bg-red-400" @click="m.closeWindow()">
          <X :size="8" class="opacity-0 group-hover:opacity-100" />
        </button>
        <button aria-label="Minimize window" class="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-400/70 text-black/70 hover:bg-yellow-400" @click="m.minimize()">
          <Minus :size="8" class="opacity-0 group-hover:opacity-100" />
        </button>
        <button aria-label="Maximize window" class="flex h-3 w-3 items-center justify-center rounded-full bg-green-400/70 text-black/70 hover:bg-green-400" @click="m.toggleMaximize()">
          <Square :size="7" class="opacity-0 group-hover:opacity-100" />
        </button>
      </div>

      <template v-else>
        <img src="/icon.png" alt="" class="h-4 w-4" />
        <nav class="hidden items-center md:flex" role="menubar">
          <div v-for="menu in MENUS" :key="menu.id" class="relative" data-menu-root>
            <button
              class="px-2 py-1 transition hover:text-fg"
              :class="m.openMenu === menu.id ? 'bg-surface-2 text-fg' : ''"
              aria-haspopup="menu"
              :aria-expanded="m.openMenu === menu.id"
              @click="m.toggleMenu(menu.id)"
              @mouseenter="hoverSwitch(menu.id)"
            >{{ menu.label }}</button>
            <div v-if="m.openMenu === menu.id" role="menu" class="absolute left-0 top-full z-20 min-w-44 border border-line bg-surface py-1 shadow-xl shadow-black/30">
              <button
                v-for="item in menu.items"
                :key="item.id"
                role="menuitem"
                class="block w-full px-3 py-1.5 text-left transition hover:bg-surface-2 hover:text-fg"
                @click="m.runAction(item.id)"
              >{{ item.label }}</button>
            </div>
            <div v-if="menu.id === 'help' && m.openMenu === 'about'" class="absolute left-0 top-full z-20 w-56 border border-line bg-surface p-3 shadow-xl shadow-black/30">
              <div class="font-medium text-fg">Arctri</div>
              <div class="mt-0.5">{{ release?.tag ?? 'beta' }}</div>
              <div class="mt-2 text-muted/80">An agent-first terminal for Windows and macOS.</div>
            </div>
          </div>
        </nav>
      </template>
    </div>

    <!-- center -->
    <div class="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 sm:flex">
      <Folder :size="13" />
      <template v-if="m.os === 'mac'">Arctri — {{ PROFILES.mac.path }}</template>
      <template v-else>{{ PROFILES.windows.path }}</template>
    </div>

    <!-- right -->
    <div class="flex items-center gap-3">
      <div class="relative hidden sm:block" data-menu-root>
        <button
          class="flex items-center gap-1.5 px-1.5 py-1 transition hover:text-fg"
          aria-haspopup="menu"
          :aria-expanded="m.openMenu === 'branch'"
          @click="m.toggleMenu('branch')"
        ><GitBranch :size="13" /> {{ m.branch }}</button>
        <div v-if="m.openMenu === 'branch'" role="menu" class="absolute right-0 top-full z-20 min-w-48 border border-line bg-surface py-1 shadow-xl shadow-black/30">
          <button
            v-for="b in BRANCHES"
            :key="b"
            role="menuitem"
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-surface-2 hover:text-fg"
            @click="m.branch = b; m.closeMenus()"
          >
            <Check :size="12" :class="m.branch === b ? 'text-accent' : 'opacity-0'" /> {{ b }}
          </button>
        </div>
      </div>

      <button
        class="p-1 transition hover:text-fg"
        :class="m.filesOpen ? 'text-accent' : ''"
        :aria-pressed="m.filesOpen"
        aria-label="Toggle files panel"
        @click="m.filesOpen = !m.filesOpen"
      ><PanelRight :size="15" /></button>

      <div v-if="m.os === 'windows'" class="flex h-10">
        <button aria-label="Minimize window" class="flex w-11 items-center justify-center transition hover:bg-surface-2 hover:text-fg" @click="m.minimize()"><Minus :size="14" /></button>
        <button :aria-label="m.win === 'maximized' ? 'Restore window' : 'Maximize window'" class="flex w-11 items-center justify-center transition hover:bg-surface-2 hover:text-fg" @click="m.toggleMaximize()"><Square :size="11" /></button>
        <button aria-label="Close window" class="flex w-11 items-center justify-center transition hover:bg-red-500/80 hover:text-white" @click="m.closeWindow()"><X :size="14" /></button>
      </div>
    </div>
  </div>
</template>
