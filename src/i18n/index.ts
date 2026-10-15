import { createI18n } from 'vue-i18n'
import en from './en'
import th from './th'

// The site always opens in English. Visitors can switch to Thai with the TH button;
// the choice lasts for the current visit only.
const initial = 'en'

export const i18n = createI18n({
  legacy: false,
  locale: initial,
  fallbackLocale: 'en',
  messages: { en, th },
})

export function setLocale(l: 'en' | 'th') {
  i18n.global.locale.value = l
  document.documentElement.lang = l
}

document.documentElement.lang = initial
