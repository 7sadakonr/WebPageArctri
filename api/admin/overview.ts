import { fetchGithubDownloads } from '../_lib/githubReleases.js'
import { json, misconfigured } from '../_lib/http.js'
import { buildOverview } from '../_lib/overview.js'
import { isAuthenticated } from '../_lib/session.js'
import type { Range } from '../_lib/types.js'
import { fetchVercelStats } from '../_lib/vercelAnalytics.js'

const REPO = { owner: '7sadakonr', name: 'Arctri' }
const RANGES = new Set<number>([7, 30, 90])
const asError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)))

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return misconfigured('ADMIN_SESSION_SECRET')
  if (!isAuthenticated(request, secret)) return json({ error: 'Unauthorized' }, 401)

  const range = Number(new URL(request.url).searchParams.get('range'))
  if (!RANGES.has(range)) return json({ error: 'Invalid range' }, 400)

  const token = process.env.VERCEL_ACCESS_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const vercel = token && projectId
    ? fetchVercelStats(range as Range, { token, projectId, teamId: process.env.VERCEL_TEAM_ID }).catch(asError)
    : Promise.resolve(new Error('Vercel analytics env not configured'))
  const github = fetchGithubDownloads(REPO, process.env.GITHUB_TOKEN).catch(asError)

  const [v, g] = await Promise.all([vercel, github])
  if (v instanceof Error) console.error('[admin] vercel source failed:', v.message)
  if (g instanceof Error) console.error('[admin] github source failed:', g.message)
  return json(buildOverview(range as Range, v, g), 200, { 'Cache-Control': 'private, max-age=300' })
}
