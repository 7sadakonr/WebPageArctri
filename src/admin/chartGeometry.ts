export const CHART = { height: 200, padX: 8, padTop: 12, padBottom: 24 } as const

/** Horizontal position of point `i` of `count`, drawn in a chart `width` px wide. */
export function xAt(i: number, count: number, width: number): number {
  if (count <= 1) return width / 2
  return CHART.padX + (i / (count - 1)) * (width - 2 * CHART.padX)
}

/** Vertical position of `value` on a 0..max scale. */
export function yAt(value: number, max: number): number {
  return CHART.padTop + (1 - value / Math.max(1, max)) * (CHART.height - CHART.padTop - CHART.padBottom)
}

/** Index of the point nearest to a pointer at `clientX`, for a chart box starting at `boxLeft`. */
export function nearestIndex(clientX: number, boxLeft: number, boxWidth: number, count: number): number {
  if (count <= 1 || boxWidth <= 0) return 0
  const inner = boxWidth - 2 * CHART.padX
  const i = Math.round(((clientX - boxLeft - CHART.padX) / inner) * (count - 1))
  return Math.min(count - 1, Math.max(0, i))
}
