import { ref } from 'vue'
import { MANIFEST_URL } from '../config'

export interface Asset { url: string; size?: number }
export interface Release { tag: string; windows?: Asset; macArm?: Asset; macIntel?: Asset }

const release = ref<Release | null>(null)
const loading = ref(true)
let started = false

export function useLatestRelease() {
  if (!started) {
    started = true
    fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        release.value = { tag: j.version, windows: j.windows, macArm: j.macArm, macIntel: j.macIntel }
      })
      .catch(() => {})
      .finally(() => (loading.value = false))
  }
  return { release, loading }
}
