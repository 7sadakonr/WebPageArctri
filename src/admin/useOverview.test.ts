import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useOverview } from './useOverview'
import type { Range } from '../../api/_lib/types'

const sample = { range: 30, sources: { vercel: 'ok', github: 'ok' }, totals: { visits: 1, githubDownloads: 2 }, series: [], byOs: [], byCountry: [], byReferrer: [], downloads: [] }
const stub = (impl: (url: string) => Response | Promise<Response>) => vi.stubGlobal('fetch', vi.fn(async (u: string) => impl(String(u))))
afterEach(() => vi.unstubAllGlobals())

describe('useOverview', () => {
  it('loads data on creation', async () => {
    stub(() => new Response(JSON.stringify(sample), { status: 200 }))
    const o = useOverview(ref<Range>(30))
    await vi.waitFor(() => expect(o.data.value?.totals.visits).toBe(1))
    expect(o.loading.value).toBe(false)
    expect(o.unauthorized.value).toBe(false)
  })
  it('flags unauthorized on 401 so the UI can show the login form', async () => {
    stub(() => new Response('{}', { status: 401 }))
    const o = useOverview(ref<Range>(30))
    await vi.waitFor(() => expect(o.unauthorized.value).toBe(true))
    expect(o.data.value).toBeNull()
  })
  it('sets error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    const o = useOverview(ref<Range>(30))
    await vi.waitFor(() => expect(o.error.value).not.toBeNull())
    expect(o.unauthorized.value).toBe(false)
  })
  it('sets error on a 500', async () => {
    stub(() => new Response('{}', { status: 500 }))
    const o = useOverview(ref<Range>(30))
    await vi.waitFor(() => expect(o.error.value).toBe('500'))
  })
  it('refetches when the range changes and exposes refresh()', async () => {
    const urls: string[] = []
    stub((u) => { urls.push(u); return new Response(JSON.stringify(sample), { status: 200 }) })
    const range = ref<Range>(30)
    const o = useOverview(range)
    await vi.waitFor(() => expect(urls).toHaveLength(1))
    range.value = 7
    await nextTick()
    await vi.waitFor(() => expect(urls).toHaveLength(2))
    expect(urls[1]).toContain('range=7')
    await o.refresh()
    expect(urls).toHaveLength(3)
  })
})
