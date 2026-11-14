import { describe, expect, it } from 'vitest'
import { CHART, nearestIndex, xAt, yAt } from './chartGeometry'

describe('chart geometry', () => {
  it('spreads points between the side paddings for any width', () => {
    expect(xAt(0, 3, 300)).toBe(CHART.padX)
    expect(xAt(2, 3, 300)).toBe(300 - CHART.padX)
    expect(xAt(1, 3, 300)).toBe(150)
    expect(xAt(0, 3, 600)).toBe(CHART.padX)
    expect(xAt(2, 3, 600)).toBe(600 - CHART.padX)
  })
  it('centres a single point', () => expect(xAt(0, 1, 300)).toBe(150))
  it('maps the maximum to the top padding and zero to the bottom', () => {
    expect(yAt(10, 10)).toBe(CHART.padTop)
    expect(yAt(0, 10)).toBe(CHART.height - CHART.padBottom)
  })
  it('finds the nearest point from a pointer position', () => {
    expect(nearestIndex(150, 0, 300, 3)).toBe(1)
    expect(nearestIndex(0, 0, 300, 3)).toBe(0)
    expect(nearestIndex(300, 0, 300, 3)).toBe(2)
    expect(nearestIndex(250, 100, 300, 3)).toBe(1) // box starts at x=100
  })
  it('clamps pointers outside the chart and handles degenerate input', () => {
    expect(nearestIndex(-50, 0, 300, 3)).toBe(0)
    expect(nearestIndex(900, 0, 300, 3)).toBe(2)
    expect(nearestIndex(10, 0, 300, 1)).toBe(0)
    expect(nearestIndex(10, 0, 0, 3)).toBe(0)
  })
})
