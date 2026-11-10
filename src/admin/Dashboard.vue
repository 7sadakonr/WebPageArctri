<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Overview, Range } from '../../api/_lib/types'

defineProps<{ data: Overview; range: Range }>()
defineEmits<{ 'update:range': [Range] }>()
const { t } = useI18n()
</script>

<template>
  <section class="mx-auto max-w-5xl px-5 py-10">
    <p class="text-sm text-muted">{{ t('admin.dashboard.visits') }}: {{ data.totals.visits }}</p>
  </section>
</template>
