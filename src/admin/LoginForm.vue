<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ success: [] }>()
const { t } = useI18n()
const password = ref('')
const failed = ref<'wrong' | 'error' | null>(null)
const busy = ref(false)

async function submit() {
  busy.value = true
  failed.value = null
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })
    if (res.status === 204) { password.value = ''; emit('success') }
    else failed.value = res.status === 401 ? 'wrong' : 'error'
  } catch {
    failed.value = 'error'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="mx-auto mt-24 max-w-sm space-y-4 border border-line bg-surface p-6" @submit.prevent="submit">
    <h1 class="text-lg font-medium text-fg">{{ t('admin.login.title') }}</h1>
    <label class="block text-sm text-muted">
      {{ t('admin.login.password') }}
      <input v-model="password" type="password" autocomplete="current-password" required
        class="mt-1 w-full border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent" />
    </label>
    <p v-if="failed" role="alert" class="text-sm text-red-300">{{ t(failed === 'wrong' ? 'admin.login.wrong' : 'admin.error.generic') }}</p>
    <button :disabled="busy" class="w-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-60">
      {{ t('admin.login.submit') }}
    </button>
  </form>
</template>
