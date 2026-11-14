import type { GithubRaw, ManifestRaw, Overview, Platform, Range, VercelRaw, VercelRow } from './types'

const count = (r: VercelRow): number => Number(r.visitors ?? r.pageviews ?? 0) || 0
const label = (r: VercelRow, key: string): string => String(r[key] ?? 'Unknown')

function platformOf(name: string): Platform {
  if (/Setup.*x64\.exe$/i.test(name)) return 'windows'
  if (/arm64\.dmg$/i.test(name)) return 'mac-arm'
  if (/x64\.dmg$/i.test(name)) return 'mac-intel'
  return 'other'
}

const bare = (v: string | null | undefined): string | null => (v ? v.replace(/^v/, '') : null)

export function buildOverview(range: Range, vercel: VercelRaw | Error, github: GithubRaw | Error, manifest: ManifestRaw | Error): Overview {
  const v = vercel instanceof Error ? null : vercel
  const g = github instanceof Error ? null : github
  const m = manifest instanceof Error ? null : manifest
  const website = bare(m?.version)
  const latest = bare(g?.latestTag)
  const series = (v?.series ?? []).map((r) => ({ date: String(r.timestamp ?? '').slice(0, 10), visits: count(r) }))
  const visitsPrevious = (v?.previousSeries ?? []).reduce((sum, r) => sum + count(r), 0)
  const visits = series.reduce((sum, p) => sum + p.visits, 0)
  const downloads = (g?.assets ?? []).map((a) => ({ version: a.version, platform: platformOf(a.name), githubCount: a.downloadCount }))
  return {
    range,
    sources: { vercel: v ? 'ok' : 'error', github: g ? 'ok' : 'error', manifest: m ? 'ok' : 'error' },
    totals: {
      visits,
      githubDownloads: downloads.reduce((s, d) => s + d.githubCount, 0),
      visitsPrevious,
      visitsChangePct: v && visitsPrevious > 0 ? Math.round(((visits - visitsPrevious) / visitsPrevious) * 100) : null,
    },
    series,
    byOs: (v?.byOs ?? []).map((r) => ({ name: label(r, 'osName'), visits: count(r) })),
    byCountry: (v?.byCountry ?? []).map((r) => ({ code: label(r, 'country'), visits: count(r) })),
    byReferrer: (v?.byReferrer ?? []).map((r) => ({ host: label(r, 'referrerHostname'), visits: count(r) })),
    downloads,
    sync: { website, github: latest, status: website && latest ? (website === latest ? 'in-sync' : 'behind') : 'unknown' },
  }
}
