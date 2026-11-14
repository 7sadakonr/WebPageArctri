import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { seoPlugin } from './vite/seo'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), seoPlugin({ ...loadEnv(mode, process.cwd(), ''), ...process.env })],
}))
