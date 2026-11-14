import type { Plugin } from 'vite'

export const DEFAULT_SITE_URL = 'https://arctri-website.vercel.app'
const PLACEHOLDER = '__SITE_URL__'

/** Origin (scheme + host) of the public site: SITE_URL, else Vercel's production domain, else the default. */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  const raw = env.SITE_URL?.trim()
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const candidate = raw || (vercel ? `https://${vercel}` : DEFAULT_SITE_URL)
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${candidate}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`SITE_URL must be http(s): ${candidate}`)
  return url.origin
}

export const injectHead = (html: string, siteUrl: string): string => html.replaceAll(PLACEHOLDER, siteUrl)

export const buildRobotsTxt = (siteUrl: string): string =>
  `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`

export const buildSitemapXml = (siteUrl: string, lastmod: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n</urlset>\n`

export function seoPlugin(env: Record<string, string | undefined> = process.env): Plugin {
  const siteUrl = resolveSiteUrl(env)
  return {
    name: 'arctri-seo',
    transformIndexHtml: (html) => injectHead(html, siteUrl),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(siteUrl) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemapXml(siteUrl, new Date().toISOString().slice(0, 10)) })
    },
  }
}
