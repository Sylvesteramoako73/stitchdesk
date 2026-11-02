import { NextRequest, NextResponse } from 'next/server'

// Marketing domain, rewritten to /marketing pages with no auth.
// Override with NEXT_PUBLIC_MARKETING_HOSTS="example.com,www.example.com" if the domain changes.
const MARKETING_HOSTS = new Set(
  (process.env.NEXT_PUBLIC_MARKETING_HOSTS ?? 'stitchdeskapp.online,www.stitchdeskapp.online')
    .split(',').map(h => h.trim()).filter(Boolean)
)

// Public routes on the app domain that never require a session.
// /track is the client facing order tracking page.
const PUBLIC = ['/login', '/signup', '/admin-login', '/api/auth', '/track', '/admin', '/api/admin']

function isPublic(pathname: string) {
  return PUBLIC.some(p => pathname.startsWith(p))
}

// Files served from /public that never contain private data
function isPublicAsset(pathname: string) {
  return (
    pathname === '/logo.png' ||
    pathname === '/logo-mark.png' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/apple-touch-icon.png' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/')
  )
}

function route(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  const { pathname, hostname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || isPublicAsset(pathname)) {
    return NextResponse.next()
  }

  // ── Marketing domain: rewrite into /marketing ────────────────────────────
  if (MARKETING_HOSTS.has(hostname)) {
    if (pathname.startsWith('/marketing') || pathname.startsWith('/track')) return NextResponse.next()
    const url = req.nextUrl.clone()
    url.pathname = pathname === '/' ? '/marketing' : `/marketing${pathname}`
    return NextResponse.rewrite(url)
  }

  // API routes do their own auth
  if (pathname.startsWith('/api')) return NextResponse.next()

  // Marketing pages reached directly on the app domain
  if (pathname.startsWith('/marketing')) return NextResponse.next()

  // Signed in users skip login and signup
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isPublic(pathname)) return NextResponse.next()

  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  return NextResponse.next()
}

/**
 * Only the marketing site should appear in Google. The app and the private
 * order tracking pages get noindex.
 */
export function middleware(req: NextRequest) {
  const res = route(req)
  const { hostname, pathname } = req.nextUrl
  if (!MARKETING_HOSTS.has(hostname) || pathname.startsWith('/track')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
