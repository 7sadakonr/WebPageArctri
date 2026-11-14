import { describe, expect, it } from 'vitest'
import { formatChange } from './formatChange'

describe('formatChange', () => {
  it('marks an increase with an up arrow', () => expect(formatChange(12)).toBe('▲ 12%'))
  it('marks a decrease with a down arrow and no minus sign', () => expect(formatChange(-5)).toBe('▼ 5%'))
  it('shows no arrow for no change', () => expect(formatChange(0)).toBe('0%'))
  it('shows a dash when there is nothing to compare', () => expect(formatChange(null)).toBe('—'))
})
