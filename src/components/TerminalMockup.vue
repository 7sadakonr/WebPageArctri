<script setup lang="ts">
const blocks = [
  { cwd: '~/arctri', cmd: 'git status -sb', out: '## main...origin/main\n M src/App.vue', ok: true, ms: '84ms' },
  { cwd: '~/arctri', cmd: 'pnpm test', out: '✓ 128 tests passed', ok: true, ms: '3.2s' },
]
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-white/10 bg-surface shadow-2xl shadow-sky-500/10">
    <div class="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <span class="h-3 w-3 rounded-full bg-red-400/70" /><span class="h-3 w-3 rounded-full bg-yellow-400/70" /><span class="h-3 w-3 rounded-full bg-green-400/70" />
      <span class="ml-4 rounded-md bg-white/5 px-3 py-0.5 font-mono text-xs text-white/60">PowerShell</span>
      <span class="rounded-md px-3 py-0.5 font-mono text-xs text-white/30">claude</span>
    </div>
    <div class="space-y-3 p-5 text-left font-mono text-[13px] leading-relaxed">
      <div v-for="b in blocks" :key="b.cmd" class="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div class="flex justify-between text-xs text-white/40"><span>{{ b.cwd }}</span><span class="text-green-400/80">✓ {{ b.ms }}</span></div>
        <div class="mt-1 text-accent">$ {{ b.cmd }}</div>
        <pre class="mt-1 whitespace-pre-wrap text-white/70">{{ b.out }}</pre>
      </div>
      <div class="flex flex-wrap items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-300/5 px-3 py-2 text-xs text-sky-200/80">
        <span class="font-semibold">Claude Code</span><span class="text-white/30">|</span>
        <span>@ files</span><span>/ commands</span><span>2 changed</span>
      </div>
      <div class="text-white/80">$ <span class="caret">▌</span></div>
    </div>
  </div>
</template>
