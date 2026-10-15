<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectOS } from '../composables/useOS'
import { PROFILES, type OS } from './mockup/data'
import { provideMockup } from './mockup/useMockup'
import TitleBar from './mockup/TitleBar.vue'
import TerminalTabs from './mockup/TerminalTabs.vue'
import TerminalPane from './mockup/TerminalPane.vue'
import EditorPane from './mockup/EditorPane.vue'
import SidePanel from './mockup/SidePanel.vue'

const { t } = useI18n()
const m = provideMockup(detectOS() === 'mac' ? 'mac' : 'windows')
const oses: OS[] = ['windows', 'mac']

function onPointerDown(e: PointerEvent) {
  if (m.openMenu && !(e.target as HTMLElement).closest('[data-menu-root]')) m.closeMenus()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') m.closeMenus()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div>
    <div v-if="m.closed" class="flex h-56 flex-col items-center justify-center gap-4 border border-line bg-surface">
      <img src="/icon.png" alt="" class="h-10 w-10" />
      <button class="border border-line px-4 py-2 text-sm text-fg transition hover:bg-surface-2" @click="m.reopenWindow()">
        {{ t('mock.reopen') }}
      </button>
    </div>

    <div v-else class="border border-line bg-surface text-left shadow-2xl shadow-black/20">
      <TitleBar />
      <div v-show="m.win !== 'minimized'">
        <TerminalTabs />
        <div
          class="flex overflow-hidden transition-[height] motion-reduce:transition-none"
          :class="m.win === 'maximized' ? 'h-[560px]' : 'h-[400px]'"
        >
          <TerminalPane />
          <EditorPane />
          <SidePanel />
        </div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
      <span>{{ t('mock.preview') }}</span>
      <div class="inline-flex border border-line" role="group">
        <button
          v-for="o in oses"
          :key="o"
          class="px-3 py-1 transition"
          :class="m.os === o ? 'bg-surface-2 text-fg' : 'hover:text-fg'"
          :aria-pressed="m.os === o"
          @click="m.setOS(o)"
        >{{ PROFILES[o].label }}</button>
      </div>
    </div>
  </div>
</template>
