<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ label: string; value: number; failed?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div class="border border-line bg-surface p-5">
    <p class="text-sm text-muted">{{ label }}</p>
    <p v-if="failed" class="mt-2 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <p v-else class="mt-2 text-3xl font-semibold tabular-nums text-fg">{{ value.toLocaleString() }}</p>
  </div>
</template>
