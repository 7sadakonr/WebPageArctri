import type { GithubRaw } from './types'

interface GhRelease { tag_name: string; draft: boolean; assets: { name: string; download_count: number }[] }

export async function fetchGithubDownloads(
  repo: { owner: string; name: string },
  token?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GithubRaw> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'arctri-website-admin' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchImpl(`https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=30`, { headers })
  if (!res.ok) throw new Error(`GitHub releases ${res.status}`)
  const releases = (await res.json()) as GhRelease[]
  const published = releases.filter((r) => !r.draft)
  return {
    latestTag: published[0]?.tag_name.replace(/^v/, '') ?? null,
    assets: published
      .flatMap((r) => r.assets.map((a) => ({ version: r.tag_name.replace(/^v/, ''), name: a.name, downloadCount: a.download_count }))),
  }
}
