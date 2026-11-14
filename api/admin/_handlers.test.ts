import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as login } from './login'
import { POST as logout } from './logout'
import { GET as overview } from './overview'

const env = { ADMIN_PASSWORD: 'pw', ADMIN_SESSION_SECRET: 'sec', VERCEL_ACCESS_TOKEN: 't', VERCEL_PROJECT_ID: 'prj' }
const post = (body: unknown) => new Request('https://x.test/api/admin/login', { method: 'POST', body: JSON.stringify(body) })

async function sessionCookie(): Promise<string> {
  const res = await login(post({ password: 'pw' }))
  return res.headers.get('set-cookie')!.split(';')[0]
}
const get = (query: string, cookie?: string) =>
  new Request(`https://x.test/api/admin/overview${query}`, { headers: cookie ? { cookie } : {} })

function mockUpstreams(opts: { vercel?: number; github?: number } = {}) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url).includes('api.vercel.com')) {
      return new Response(JSON.stringify({ data: [{ timestamp: '2026-11-01T00:00:00.000Z', visitors: 4 }] }), { status: opts.vercel ?? 200 })
    }
    return new Response(JSON.stringify([{ tag_name: 'v1.0.0', draft: false, assets: [{ name: 'A-Setup-x64.exe', download_count: 2 }] }]), { status: opts.github ?? 200 })
  }))
}

beforeEach(() => {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('login / logout', () => {
  it('rejects a wrong password', async () => expect((await login(post({ password: 'nope' }))).status).toBe(401))
  it('rejects a malformed body', async () => expect((await login(new Request('https://x.test', { method: 'POST', body: 'x' }))).status).toBe(401))
  it('accepts the right password and sets a cookie', async () => {
    const res = await login(post({ password: 'pw' }))
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toContain('HttpOnly')
  })
  it('logout clears the cookie', async () => {
    const res = await logout()
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })
  it('returns 500 without leaking the variable name when secrets are missing', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
    const res = await login(post({ password: 'pw' }))
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('ADMIN_SESSION_SECRET')
  })
})

describe('overview', () => {
  it('401 without a cookie', async () => { mockUpstreams(); expect((await overview(get('?range=7'))).status).toBe(401) })
  it('400 for an invalid range', async () => {
    mockUpstreams()
    expect((await overview(get('?range=14', await sessionCookie()))).status).toBe(400)
    expect((await overview(get('', await sessionCookie()))).status).toBe(400)
  })
  it('200 with both sources, private cache header', async () => {
    mockUpstreams()
    const res = await overview(get('?range=30', await sessionCookie()))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, max-age=300')
    const body = await res.json()
    expect(body.sources).toEqual({ vercel: 'ok', github: 'ok' })
    expect(body.totals).toEqual({ visits: 4, githubDownloads: 2, visitsPrevious: 4, visitsChangePct: 0 })
  })
  it('200 with sources.vercel=error when Vercel fails', async () => {
    mockUpstreams({ vercel: 500 })
    const res = await overview(get('?range=7', await sessionCookie()))
    expect(res.status).toBe(200)
    expect((await res.json()).sources).toEqual({ vercel: 'error', github: 'ok' })
  })
  it('treats a rejected Vercel token as a source error, not a failure', async () => {
    mockUpstreams({ vercel: 401 })
    const res = await overview(get('?range=7', await sessionCookie()))
    expect(res.status).toBe(200)
    expect((await res.json()).sources.vercel).toBe('error')
  })
  it('500 when the session secret is missing', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
    expect((await overview(get('?range=7'))).status).toBe(500)
  })
})
