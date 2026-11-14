<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ title: string; rows: { name: string; visits: number }[]; failed?: boolean }>()
const { t } = useI18n()
const max = computed(() => Math.max(1, ...props.rows.map((r) => r.visits)))
</script>

<template>
  <section class="border border-line bg-surface p-4 sm:p-5">
    <h3 class="text-sm font-medium text-fg">{{ title }}</h3>
    <p v-if="failed" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.unavailable') }}</p>
    <p v-else-if="!rows.length" class="mt-3 text-sm text-muted">{{ t('admin.dashboard.noData') }}</p>
    <table v-else class="mt-3 w-full text-sm">
      <tbody>
        <tr v-for="r in rows" :key="r.name">
          <td class="w-2/5 truncate py-1 pr-3 text-fg">{{ r.name }}</td>
          <td class="py-1 pr-3">
            <div class="h-1.5 bg-accent" :style="{ width: (r.visits / max) * 100 + '%' }" aria-hidden="true"></div>
          </td>
          <td class="w-12 py-1 text-right tabular-nums text-muted">{{ r.visits.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
