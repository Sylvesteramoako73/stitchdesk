import { SITE_URL } from '@/lib/marketing/site'
import { FEATURE_PAGES } from '@/lib/marketing/features'
import { getPosts } from '@/lib/marketing/blog'

export const dynamic = 'force-static'

/** Date the static marketing pages were last meaningfully updated */
const PAGES_UPDATED = '2026-10-27'

// Served at stitchdeskapp.online/sitemap.xml
export function GET() {
  const pages = [
    { path: '/', lastmod: PAGES_UPDATED },
    { path: '/features', lastmod: PAGES_UPDATED },
    ...FEATURE_PAGES.map(f => ({ path: `/features/${f.slug}`, lastmod: PAGES_UPDATED })),
    { path: '/pricing', lastmod: PAGES_UPDATED },
    { path: '/faq', lastmod: PAGES_UPDATED },
    { path: '/blog', lastmod: PAGES_UPDATED },
    ...getPosts().map(p => ({ path: `/blog/${p.slug}`, lastmod: p.updated ?? p.date })),
  ]
  const urls = pages
    .map(p => `  <url>\n    <loc>${p.path === '/' ? `${SITE_URL}/` : SITE_URL + p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
