import { describe, expect, it } from 'vitest'
import { regionName } from './regionName'

describe('regionName', () => {
  it('translates a valid region code', () => expect(regionName('TH', 'en')).toBe('Thailand'))
  it('falls back to the raw value for non-region strings instead of throwing', () => {
    expect(regionName('Unknown', 'en')).toBe('Unknown')
    expect(regionName('', 'en')).toBe('')
  })
  it('falls back to the code for an unsupported locale', () => expect(regionName('TH', 'not_a_locale')).toBe('TH'))
})
