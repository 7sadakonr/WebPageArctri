import { createI18n } from 'vue-i18n'
import en from './en'
import th from './th'

const saved = localStorage.getItem('locale')
const initial = saved ?? (navigator.language.toLowerCase().startsWith('th') ? 'th' : 'en')

export const i18n = createI18n({
  legacy: false,
  locale: initial,
  fallbackLocale: 'en',
  messages: { en, th },
})

export function setLocale(l: 'en' | 'th') {
  i18n.global.locale.value = l
  localStorage.setItem('locale', l)
  document.documentElement.lang = l
}

document.documentElement.lang = initial
