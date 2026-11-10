import { ref, watch, type Ref } from 'vue'
import type { Overview, Range } from '../../api/_lib/types'

export function useOverview(range: Ref<Range>) {
  const data = ref<Overview | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unauthorized = ref(false)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api/admin/overview?range=${range.value}`, { credentials: 'same-origin' })
      if (res.status === 401) {
        unauthorized.value = true
        data.value = null
      } else if (!res.ok) {
        error.value = String(res.status)
      } else {
        unauthorized.value = false
        data.value = (await res.json()) as Overview
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'network'
    } finally {
      loading.value = false
    }
  }

  watch(range, refresh, { immediate: true })
  return { data, loading, error, unauthorized, refresh }
}
