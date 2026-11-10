import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import { i18n } from './i18n'
import './style.css'

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
}, { threshold: 0.12 })

const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/')

// Admin code is a separate chunk and admin visits are not counted by Web Analytics.
const Root = isAdmin
  ? (await import('./admin/AdminApp.vue')).default
  : (await import('./App.vue')).default
if (!isAdmin) inject()

createApp(Root)
  .use(i18n)
  .directive('reveal', { mounted(el: HTMLElement) { el.classList.add('reveal'); io.observe(el) } })
  .mount('#app')
