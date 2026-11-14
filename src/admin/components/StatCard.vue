<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatChange } from '../formatChange'

defineProps<{ label: string; value: number; failed?: boolean; change?: number | null; changeLabel?: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="border border-line bg-surface p-4 sm:p-5">
    <p class="text-sm text-muted">{{ label }}</p>
    <p v-if="failed" class="mt-2 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <template v-else>
      <p class="mt-2 text-3xl font-semibold tabular-nums text-fg">{{ value.toLocaleString() }}</p>
      <p v-if="change !== undefined" class="mt-1 text-sm text-muted">
        <span class="tabular-nums text-fg">{{ formatChange(change) }}</span> {{ changeLabel }}
      </p>
    </template>
  </div>
</template>
