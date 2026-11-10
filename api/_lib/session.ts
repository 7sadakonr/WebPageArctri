import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'arctri_admin'
const LIFETIME_MS = 12 * 3600_000

const digest = (s: string) => createHash('sha256').update(s).digest()
const sign = (exp: string, secret: string) => createHmac('sha256', secret).update(exp).digest('hex')

export function checkPassword(input: string, expected: string): boolean {
  if (!expected) return false
  return timingSafeEqual(digest(input), digest(expected))
}

export function createSessionCookie(secret: string, now = Date.now()): string {
  const exp = String(now + LIFETIME_MS)
  return `${COOKIE}=${exp}.${sign(exp, secret)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${LIFETIME_MS / 1000}`
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}

export function isAuthenticated(request: Request, secret: string, now = Date.now()): boolean {
  const raw = request.headers.get('cookie') ?? ''
  const part = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))
  const value = part?.slice(COOKIE.length + 1)
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || !/^\d+$/.test(exp)) return false
  const expected = Buffer.from(sign(exp, secret), 'hex')
  const given = Buffer.from(sig, 'hex')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  return Number(exp) > now
}
