import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './style.css'

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
}, { threshold: 0.12 })

createApp(App)
  .use(i18n)
  .directive('reveal', { mounted(el: HTMLElement) { el.classList.add('reveal'); io.observe(el) } })
  .mount('#app')
