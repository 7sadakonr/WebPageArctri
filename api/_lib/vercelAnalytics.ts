import type { Range, VercelRaw, VercelRow } from './types'

export interface VercelEnv { token: string; projectId: string; teamId?: string }

const DAY = 86_400_000

export async function fetchVercelStats(range: Range, env: VercelEnv, fetchImpl: typeof fetch = fetch): Promise<VercelRaw> {
  const now = Date.now()
  const query = async (by: string, from = now - range * DAY, to = now): Promise<VercelRow[]> => {
    const q = new URLSearchParams({ projectId: env.projectId, by, since: new Date(from).toISOString(), until: new Date(to).toISOString(), limit: by === 'day' ? String(range + 1) : '50' })
    if (env.teamId) q.set('teamId', env.teamId)
    const res = await fetchImpl(`https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${q}`, {
      headers: { Authorization: `Bearer ${env.token}` },
    })
    if (!res.ok) throw new Error(`Vercel analytics ${res.status}`)
    return ((await res.json()) as { data?: VercelRow[] }).data ?? []
  }
  const [series, previousSeries, byOs, byCountry, byReferrer] = await Promise.all([
    query('day'), query('day', now - 2 * range * DAY, now - range * DAY),
    query('osName'), query('country'), query('referrerHostname'),
  ])
  return { series, previousSeries, byOs, byCountry, byReferrer }
}
