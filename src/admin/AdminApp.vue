<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'
import type { Range } from '../../api/_lib/types'
import Dashboard from './Dashboard.vue'
import LoginForm from './LoginForm.vue'
import { useOverview } from './useOverview'

const { t, locale } = useI18n()
const range = ref<Range>(30)
const { data, loading, error, unauthorized, refresh } = useOverview(range)

onMounted(() => {
  document.title = 'Arctri admin'
  const m = document.createElement('meta')
  m.name = 'robots'
  m.content = 'noindex'
  document.head.appendChild(m)
})

async function logout() {
  await fetch('/api/admin/logout', { method: 'POST' })
  unauthorized.value = true
  data.value = null
}
</script>

<template>
  <header class="border-b border-line bg-surface">
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
      <span class="font-semibold text-fg">Arctri · {{ t('admin.title') }}</span>
      <div class="flex items-center gap-3 text-sm">
        <button class="border border-line px-2 py-1 text-muted hover:text-fg" @click="setLocale(locale === 'en' ? 'th' : 'en')">
          {{ locale === 'en' ? 'TH' : 'EN' }}
        </button>
        <button v-if="!unauthorized" class="border border-line px-2 py-1 text-muted hover:text-fg" @click="logout">{{ t('admin.logout') }}</button>
      </div>
    </div>
  </header>
  <main>
    <LoginForm v-if="unauthorized" @success="refresh" />
    <p v-else-if="error" role="alert" class="mx-auto mt-16 max-w-5xl px-5 text-sm text-red-300">{{ t('admin.error.generic') }}</p>
    <p v-else-if="!data && loading" class="mx-auto mt-16 max-w-5xl px-5 text-sm text-muted">{{ t('admin.loading') }}</p>
    <Dashboard v-else-if="data" :data="data" :range="range" @update:range="range = $event" />
  </main>
</template>
