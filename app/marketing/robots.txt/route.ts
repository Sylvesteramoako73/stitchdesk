import { SITE_URL } from '@/lib/marketing/site'

export const dynamic = 'force-static'

// Served at stitchdeskapp.online/robots.txt (the middleware rewrites marketing paths into /marketing)
export function GET() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
