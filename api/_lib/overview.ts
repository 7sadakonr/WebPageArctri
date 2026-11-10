import type { GithubRaw, Overview, Platform, Range, VercelRaw, VercelRow } from './types'

const count = (r: VercelRow): number => Number(r.visitors ?? r.pageviews ?? 0) || 0
const label = (r: VercelRow, key: string): string => String(r[key] ?? 'Unknown')

function platformOf(name: string): Platform {
  if (/Setup.*x64\.exe$/i.test(name)) return 'windows'
  if (/arm64\.dmg$/i.test(name)) return 'mac-arm'
  if (/x64\.dmg$/i.test(name)) return 'mac-intel'
  return 'other'
}

export function buildOverview(range: Range, vercel: VercelRaw | Error, github: GithubRaw | Error): Overview {
  const v = vercel instanceof Error ? null : vercel
  const g = github instanceof Error ? null : github
  const series = (v?.series ?? []).map((r) => ({ date: String(r.timestamp ?? '').slice(0, 10), visits: count(r) }))
  const downloads = (g?.assets ?? []).map((a) => ({ version: a.version, platform: platformOf(a.name), githubCount: a.downloadCount }))
  return {
    range,
    sources: { vercel: v ? 'ok' : 'error', github: g ? 'ok' : 'error' },
    totals: {
      visits: series.reduce((s, p) => s + p.visits, 0),
      githubDownloads: downloads.reduce((s, d) => s + d.githubCount, 0),
    },
    series,
    byOs: (v?.byOs ?? []).map((r) => ({ name: label(r, 'osName'), visits: count(r) })),
    byCountry: (v?.byCountry ?? []).map((r) => ({ code: label(r, 'country'), visits: count(r) })),
    byReferrer: (v?.byReferrer ?? []).map((r) => ({ host: label(r, 'referrerHostname'), visits: count(r) })),
    downloads,
  }
}
