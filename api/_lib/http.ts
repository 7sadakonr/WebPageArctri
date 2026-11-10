export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

/** Generic 500 for a missing env var; the variable name is logged, never returned. */
export function misconfigured(name: string): Response {
  console.error(`[admin] missing environment variable: ${name}`)
  return json({ error: 'Server misconfigured' }, 500)
}
