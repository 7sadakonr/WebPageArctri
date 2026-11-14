/** Text for a percentage change: an arrow plus the magnitude, never colour alone. */
export function formatChange(pct: number | null): string {
  if (pct === null) return '—'
  if (pct > 0) return `▲ ${pct}%`
  if (pct < 0) return `▼ ${Math.abs(pct)}%`
  return '0%'
}
