export type OS = 'windows' | 'mac' | 'other'

export function detectOS(): OS {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'windows'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac'
  return 'other'
}

export const osLabel: Record<OS, string> = { windows: 'Windows', mac: 'macOS', other: 'Windows' }
