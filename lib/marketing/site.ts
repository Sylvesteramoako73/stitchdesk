import type { Metadata } from 'next'

export const SITE_URL = 'https://stitchdeskapp.online'
export const APP_URL = 'https://app.stitchdeskapp.online'
export const SITE_NAME = 'StitchDesk'
export const CONTACT_EMAIL = 'hello@stitchdeskapp.online'
export const DEFAULT_IMAGE = '/images/og.png'

export type JsonLd = Record<string, unknown>

export const canonical = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

/** Full metadata for a marketing page: title, description, canonical, Open Graph and Twitter */
export function pageMetadata(opts: {
  path: string
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  published?: string
}): Metadata {
  const url = canonical(opts.path)
  const image = opts.image ?? DEFAULT_IMAGE
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: opts.type ?? 'website',
      url,
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      locale: 'en_GH',
      images: [{ url: image }],
      ...(opts.published ? { publishedTime: opts.published } : {}),
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, images: [image] },
  }
}

export const organizationLd: JsonLd = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.png`,
  email: CONTACT_EMAIL,
  areaServed: ['Ghana', 'West Africa'],
}

export const websiteLd: JsonLd = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'en-GH',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

export function breadcrumbLd(trail: { name: string; path: string }[]): JsonLd {
  const items = [{ name: 'Home', path: '/' }, ...trail]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: canonical(c.path) })),
  }
}
