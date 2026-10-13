import { ref } from 'vue'
import { LATEST_API } from '../config'

interface Asset { name: string; browser_download_url: string; size: number }
export interface Release { tag: string; windows?: Asset; macArm?: Asset; macIntel?: Asset }

const release = ref<Release | null>(null)
const loading = ref(true)
let started = false

function pick(assets: Asset[], re: RegExp) {
  return assets.find((a) => re.test(a.name))
}

export function useLatestRelease() {
  if (!started) {
    started = true
    const cached = sessionStorage.getItem('release')
    if (cached) {
      release.value = JSON.parse(cached)
      loading.value = false
    } else {
      fetch(LATEST_API)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((j) => {
          const assets: Asset[] = j.assets ?? []
          release.value = {
            tag: j.tag_name,
            windows: pick(assets, /\.exe$/i),
            macArm: pick(assets, /arm64.*\.dmg$/i),
            macIntel: pick(assets, /(?<!arm64.*)\.dmg$/i) ?? pick(assets, /x64.*\.dmg$/i),
          }
          sessionStorage.setItem('release', JSON.stringify(release.value))
        })
        .catch(() => {})
        .finally(() => (loading.value = false))
    }
  }
  return { release, loading }
}
