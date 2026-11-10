export type Range = 7 | 30 | 90
export type Platform = 'windows' | 'mac-arm' | 'mac-intel' | 'other'
export type SourceStatus = 'ok' | 'error'

export interface Overview {
  range: Range
  sources: { vercel: SourceStatus; github: SourceStatus }
  totals: { visits: number; githubDownloads: number }
  series: { date: string; visits: number }[]
  byOs: { name: string; visits: number }[]
  byCountry: { code: string; visits: number }[]
  byReferrer: { host: string; visits: number }[]
  downloads: { version: string; platform: Platform; githubCount: number }[]
}

/** A row of Vercel's visits/aggregate `data`: the grouped dimension plus counts. */
export type VercelRow = Record<string, string | number | undefined>
export interface VercelRaw {
  series: VercelRow[]
  byOs: VercelRow[]
  byCountry: VercelRow[]
  byReferrer: VercelRow[]
}

export interface GithubAsset { version: string; name: string; downloadCount: number }
export interface GithubRaw { assets: GithubAsset[] }
