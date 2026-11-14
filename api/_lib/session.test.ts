import { describe, expect, it } from 'vitest'
import { checkPassword, clearSessionCookie, createSessionCookie, isAuthenticated } from './session'

const SECRET = 'test-secret'
const reqWith = (cookie?: string) => new Request('https://x.test/api', { headers: cookie ? { cookie } : {} })
const cookieValue = (setCookie: string) => setCookie.split(';')[0]

describe('checkPassword', () => {
  it('accepts a matching password', () => expect(checkPassword('hunter2', 'hunter2')).toBe(true))
  it('rejects a different-length password without throwing', () => expect(checkPassword('hunter', 'hunter2')).toBe(false))
  it('rejects a non-ASCII mismatch without throwing', () => expect(checkPassword('รหัสผ่าน', 'hunter2')).toBe(false))
  it('rejects an empty expected password', () => expect(checkPassword('', '')).toBe(false))
})

describe('session cookie', () => {
  it('sets the required attributes', () => {
    const c = createSessionCookie(SECRET)
    for (const a of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=43200']) expect(c).toContain(a)
  })
  it('authenticates a fresh cookie', () => {
    expect(isAuthenticated(reqWith(cookieValue(createSessionCookie(SECRET))), SECRET)).toBe(true)
  })
  it('rejects a tampered signature', () => {
    const v = cookieValue(createSessionCookie(SECRET))
    expect(isAuthenticated(reqWith(v.slice(0, -1) + (v.endsWith('0') ? '1' : '0')), SECRET)).toBe(false)
  })
  it('rejects a cookie signed with another secret', () => {
    expect(isAuthenticated(reqWith(cookieValue(createSessionCookie('other'))), SECRET)).toBe(false)
  })
  it('rejects malformed and missing cookies', () => {
    expect(isAuthenticated(reqWith('arctri_admin=garbage'), SECRET)).toBe(false)
    expect(isAuthenticated(reqWith('arctri_admin='), SECRET)).toBe(false)
    expect(isAuthenticated(reqWith(), SECRET)).toBe(false)
  })
  it('rejects an expired cookie', () => {
    const now = 1_000_000_000_000
    const v = cookieValue(createSessionCookie(SECRET, now))
    expect(isAuthenticated(reqWith(v), SECRET, now + 12 * 3600_000 + 1)).toBe(false)
    expect(isAuthenticated(reqWith(v), SECRET, now + 12 * 3600_000 - 1000)).toBe(true)
  })
  it('clears the cookie', () => expect(clearSessionCookie()).toContain('Max-Age=0'))
})
