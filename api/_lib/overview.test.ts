import { describe, expect, it } from 'vitest'
import { buildOverview } from './overview'
import { fetchVercelStats } from './vercelAnalytics'
import { fetchGithubDownloads } from './githubReleases'
import type { GithubRaw, VercelRaw } from './types'

const vercel: VercelRaw = {
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
    expect(o.totals).toEqual({ visits: 15, githubDownloads: 56 })
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
    const empty: VercelRaw = { series: [], byOs: [], byCountry: [], byReferrer: [] }
    const o = buildOverview(7, empty, { assets: [] })
    expect(o.sources).toEqual({ vercel: 'ok', github: 'ok' })
    expect(o.totals).toEqual({ visits: 0, githubDownloads: 0 })
    expect([o.series, o.byOs, o.byCountry, o.byReferrer, o.downloads]).toEqual([[], [], [], [], []])
  })
  it('keeps GitHub data when Vercel fails', () => {
    const o = buildOverview(30, new Error('boom'), github)
    expect(o.sources).toEqual({ vercel: 'error', github: 'ok' })
    expect(o.totals.visits).toBe(0)
    expect(o.series).toEqual([])
    expect(o.totals.githubDownloads).toBe(56)
  })
  it('keeps Vercel data when GitHub fails', () => {
    const o = buildOverview(30, vercel, new Error('boom'))
    expect(o.sources).toEqual({ vercel: 'ok', github: 'error' })
    expect(o.totals).toEqual({ visits: 15, githubDownloads: 0 })
    expect(o.downloads).toEqual([])
  })
  it('falls back to pageviews and skips rows without a count', () => {
    const o = buildOverview(7, { ...vercel, byOs: [{ osName: 'Linux', pageviews: 3 }, { osName: 'X' }] }, github)
    expect(o.byOs).toEqual([{ name: 'Linux', visits: 3 }, { name: 'X', visits: 0 }])
  })
})

describe('fetchVercelStats', () => {
  it('queries four dimensions with bearer auth and team id', async () => {
    const urls: string[] = []
    const headers: string[] = []
    const fake = (async (url: string, init: RequestInit) => {
      urls.push(String(url)); headers.push(String((init.headers as Record<string, string>).Authorization))
      return new Response(JSON.stringify({ data: [] }), { status: 200 })
    }) as unknown as typeof fetch
    await fetchVercelStats(30, { token: 'tok', projectId: 'prj_1', teamId: 'team_1' }, fake)
    const bys = urls.map((u) => new URL(u).searchParams.get('by')).sort()
    expect(bys).toEqual(['country', 'day', 'osName', 'referrerHostname'])
    expect(new URL(urls[0]).searchParams.get('projectId')).toBe('prj_1')
    expect(new URL(urls[0]).searchParams.get('teamId')).toBe('team_1')
    expect(headers.every((h) => h === 'Bearer tok')).toBe(true)
  })
  it('requests enough daily rows to cover the whole range', async () => {
    const limits: Record<string, number> = {}
    const fake = (async (url: string) => {
      const u = new URL(url)
      limits[u.searchParams.get('by')!] = Number(u.searchParams.get('limit'))
      return new Response(JSON.stringify({ data: [] }), { status: 200 })
    }) as unknown as typeof fetch
    await fetchVercelStats(90, { token: 't', projectId: 'p' }, fake)
    expect(limits.day).toBeGreaterThanOrEqual(90)
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
