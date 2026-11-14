import { clearSessionCookie } from '../_lib/session.js'

export async function POST(): Promise<Response> {
  return new Response(null, { status: 204, headers: { 'Set-Cookie': clearSessionCookie() } })
}
