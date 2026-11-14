import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildOverview } from './overview'
import { fetchVercelStats } from './vercelAnalytics'
import { fetchGithubDownloads } from './githubReleases'
import type { GithubRaw, VercelRaw } from './types'

const vercel: VercelRaw = {
  previousSeries: [{ timestamp: '2026-10-01T00:00:00.000Z', pageviews: 12, visitors: 10 }],
  series: [
    { timestamp: '2026-11-01T00:00:00.000Z', pageviews: 12, visitors: 10 },
    { timestamp: '2026-11-02T00:00:00.000Z', pageviews: 6, visitors: 5 },
  ],
  byOs: [{ osName: 'macOS', visitors: 9 }, { osName: 'Windows', visitors: 6 }],
  byCountry: [{ country: 'TH', visitors: 11 }, { country: 'US', visitors: 4 }],
  byReferrer: [{ referrerHostname: 'github.com', visitors: 7 }],
}
const github: GithubRaw = {
  assets: [
    { version: '0.3.0', name: 'Arctri-Setup-0.3.0-x64.exe', downloadCount: 20 },
    { version: '0.3.0', name: 'Arctri-0.3.0-arm64.dmg', downloadCount: 30 },
    { version: '0.3.0', name: 'Arctri-0.3.0-x64.dmg', downloadCount: 5 },
    { version: '0.3.0', name: 'latest.yml', downloadCount: 1 },
  ],
}

describe('buildOverview', () => {
  it('condenses both sources', () => {
    const o = buildOverview(30, vercel, github)
    expect(o.sources).toEqual({ vercel: 'ok', github: 'ok' })
    expect(o.totals).toEqual({ visits: 15, githubDownloads: 56, visitsPrevious: 10, visitsChangePct: 50 })
    expect(o.series).toEqual([{ date: '2026-11-01', visits: 10 }, { date: '2026-11-02', visits: 5 }])
    expect(o.byOs).toEqual([{ name: 'macOS', visits: 9 }, { name: 'Windows', visits: 6 }])
    expect(o.byCountry[0]).toEqual({ code: 'TH', visits: 11 })
    expect(o.byReferrer).toEqual([{ host: 'github.com', visits: 7 }])
    expect(o.downloads).toEqual([
      { version: '0.3.0', platform: 'windows', githubCount: 20 },
      { version: '0.3.0', platform: 'mac-arm', githubCount: 30 },
      { version: '0.3.0', platform: 'mac-intel', githubCount: 5 },
      { version: '0.3.0', platform: 'other', githubCount: 1 },
    ])
  })
  it('returns zeros and empty lists for a site with no traffic', () => {
    const empty: VercelRaw = { previousSeries: [], series: [], byOs: [], byCountry: [], byReferrer: [] }
    const o = buildOverview(7, empty, { assets: [] })
    expect(o.sources).toEqual({ vercel: 'ok', github: 'ok' })
    expect(o.totals).toEqual({ visits: 0, githubDownloads: 0, visitsPrevious: 0, visitsChangePct: null })
    expect([o.series, o.byOs, o.byCountry, o.byReferrer, o.downloads]).toEqual([[], [], [], [], []])
  })
  it('keeps GitHub data when Vercel fails', () => {
    const o = buildOverview(30, new Error('boom'), github)
    expect(o.sources).toEqual({ vercel: 'error', github: 'ok' })
    expect(o.totals).toMatchObject({ visits: 0, visitsPrevious: 0, visitsChangePct: null })
    expect(o.series).toEqual([])
    expect(o.totals.githubDownloads).toBe(56)
  })
  it('keeps Vercel data when GitHub fails', () => {
    const o = buildOverview(30, vercel, new Error('boom'))
    expect(o.sources).toEqual({ vercel: 'ok', github: 'error' })
    expect(o.totals).toMatchObject({ visits: 15, githubDownloads: 0 })
    expect(o.downloads).toEqual([])
  })
  it('reports a decrease, no change, and no percentage when the previous period is empty', () => {
    const prev = (n: number): VercelRaw => ({ ...vercel, previousSeries: [{ timestamp: '2026-10-01T00:00:00.000Z', visitors: n }] })
    expect(buildOverview(30, prev(20), github).totals.visitsChangePct).toBe(-25)
    expect(buildOverview(30, prev(15), github).totals.visitsChangePct).toBe(0)
    const none = buildOverview(30, prev(0), github).totals
    expect(none.visitsPrevious).toBe(0)
    expect(none.visitsChangePct).toBeNull()
  })
  it('falls back to pageviews and skips rows without a count', () => {
    const o = buildOverview(7, { ...vercel, byOs: [{ osName: 'Linux', pageviews: 3 }, { osName: 'X' }] }, github)
    expect(o.byOs).toEqual([{ name: 'Linux', visits: 3 }, { name: 'X', visits: 0 }])
  })
})

describe('fetchVercelStats', () => {
  afterEach(() => vi.useRealTimers())
  const capture = () => {
    const calls: { url: URL; auth: string }[] = []
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url: new URL(String(url)), auth: String((init.headers as Record<string, string>).Authorization) })
      return new Response(JSON.stringify({ data: [] }), { status: 200 })
    }) as unknown as typeof fetch
    return { calls, fake }
  }
  it('queries four dimensions plus the previous window with bearer auth and team id', async () => {
    const { calls, fake } = capture()
    await fetchVercelStats(30, { token: 'tok', projectId: 'prj_1', teamId: 'team_1' }, fake)
    expect(calls.map((c) => c.url.searchParams.get('by')).sort()).toEqual(['country', 'day', 'day', 'osName', 'referrerHostname'])
    expect(calls[0].url.searchParams.get('projectId')).toBe('prj_1')
    expect(calls[0].url.searchParams.get('teamId')).toBe('team_1')
    expect(calls.every((c) => c.auth === 'Bearer tok')).toBe(true)
  })
  it('asks for the current window and the equally long window before it', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-11-14T12:00:00.000Z')
    vi.setSystemTime(now)
    const { calls, fake } = capture()
    await fetchVercelStats(7, { token: 't', projectId: 'p' }, fake)
    const day = calls.filter((c) => c.url.searchParams.get('by') === 'day').map((c) => ({
      since: c.url.searchParams.get('since'), until: c.url.searchParams.get('until'), limit: c.url.searchParams.get('limit'),
    }))
    const D = 86_400_000
    expect(day).toContainEqual({ since: new Date(+now - 7 * D).toISOString(), until: now.toISOString(), limit: '8' })
    expect(day).toContainEqual({ since: new Date(+now - 14 * D).toISOString(), until: new Date(+now - 7 * D).toISOString(), limit: '8' })
  })
  it('requests enough daily rows to cover the whole range', async () => {
    const { calls, fake } = capture()
    await fetchVercelStats(90, { token: 't', projectId: 'p' }, fake)
    const limits = calls.filter((c) => c.url.searchParams.get('by') === 'day').map((c) => Number(c.url.searchParams.get('limit')))
    expect(limits.every((l) => l >= 90)).toBe(true)
  })
  it('throws on a non-2xx response', async () => {
    const fake = (async () => new Response('{}', { status: 403 })) as unknown as typeof fetch
    await expect(fetchVercelStats(7, { token: 't', projectId: 'p' }, fake)).rejects.toThrow(/403/)
  })
})

describe('fetchGithubDownloads', () => {
  it('maps release assets and skips drafts', async () => {
    const body = [
      { tag_name: 'v0.3.0', draft: false, assets: [{ name: 'a.exe', download_count: 4 }] },
      { tag_name: 'v0.4.0', draft: true, assets: [{ name: 'b.exe', download_count: 9 }] },
    ]
    const fake = (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
    expect(await fetchGithubDownloads({ owner: 'o', name: 'r' }, undefined, fake)).toEqual({
      assets: [{ version: '0.3.0', name: 'a.exe', downloadCount: 4 }],
    })
  })
  it('throws on a non-2xx response', async () => {
    const fake = (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch
    await expect(fetchGithubDownloads({ owner: 'o', name: 'r' }, 'tok', fake)).rejects.toThrow(/500/)
  })
})
