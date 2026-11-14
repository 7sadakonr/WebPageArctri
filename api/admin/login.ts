import { json, misconfigured } from '../_lib/http.js'
import { checkPassword, createSessionCookie } from '../_lib/session.js'

export async function POST(request: Request): Promise<Response> {
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!password) return misconfigured('ADMIN_PASSWORD')
  if (!secret) return misconfigured('ADMIN_SESSION_SECRET')
  let given = ''
  try {
    given = String(((await request.json()) as { password?: unknown }).password ?? '')
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
  if (!checkPassword(given, password)) return json({ error: 'Unauthorized' }, 401)
  return new Response(null, { status: 204, headers: { 'Set-Cookie': createSessionCookie(secret) } })
}
