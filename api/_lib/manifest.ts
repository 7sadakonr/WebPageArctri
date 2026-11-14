import type { ManifestRaw } from './types'

export const DEFAULT_MANIFEST_URL = 'https://c6msr6ovuqmhahef.public.blob.vercel-storage.com/latest.json'

export async function fetchManifest(url: string, fetchImpl: typeof fetch = fetch): Promise<ManifestRaw> {
  const res = await fetchImpl(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`Manifest ${res.status}`)
  const body = (await res.json()) as { version?: unknown }
  return { version: typeof body.version === 'string' ? body.version : null }
}
