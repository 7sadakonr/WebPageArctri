import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, buildSitemapXml, DEFAULT_SITE_URL, injectHead, resolveSiteUrl } from './seo'

describe('resolveSiteUrl', () => {
  it('prefers SITE_URL and strips a trailing slash or path', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://arctri.dev/' })).toBe('https://arctri.dev')
    expect(resolveSiteUrl({ SITE_URL: ' https://Arctri.dev/some/path ' })).toBe('https://arctri.dev')
  })
  it('falls back to the Vercel production domain, then to the default', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'arctri-website.vercel.app' })).toBe('https://arctri-website.vercel.app')
    expect(resolveSiteUrl({})).toBe(DEFAULT_SITE_URL)
    expect(resolveSiteUrl({ SITE_URL: '' })).toBe(DEFAULT_SITE_URL)
  })
  it('rejects a value that is not an http(s) URL instead of emitting a broken canonical', () => {
    expect(() => resolveSiteUrl({ SITE_URL: 'ftp://x.test' })).toThrow(/SITE_URL/)
    expect(() => resolveSiteUrl({ SITE_URL: 'not a url' })).toThrow(/SITE_URL/)
  })
})

describe('injectHead', () => {
  it('replaces every placeholder with the site URL', () => {
    const html = '<link rel="canonical" href="__SITE_URL__/"><meta property="og:image" content="__SITE_URL__/icon.png"><p>keep</p>'
    expect(injectHead(html, 'https://a.test')).toBe('<link rel="canonical" href="https://a.test/"><meta property="og:image" content="https://a.test/icon.png"><p>keep</p>')
  })
  it('leaves html without placeholders untouched', () => expect(injectHead('<p>x</p>', 'https://a.test')).toBe('<p>x</p>'))
})

describe('buildRobotsTxt', () => {
  it('blocks admin and api and points at the sitemap', () => {
    const t = buildRobotsTxt('https://a.test')
    expect(t).toContain('User-agent: *')
    expect(t).toContain('Disallow: /admin')
    expect(t).toContain('Disallow: /api/')
    expect(t).toContain('Sitemap: https://a.test/sitemap.xml')
  })
})

describe('buildSitemapXml', () => {
  it('lists the home page with a lastmod date', () => {
    const x = buildSitemapXml('https://a.test', '2026-11-15')
    expect(x).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(x).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(x).toContain('<loc>https://a.test/</loc>')
    expect(x).toContain('<lastmod>2026-11-15</lastmod>')
    expect(x).not.toContain('/admin')
  })
})
