import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/marketing/site'
import { Nav, Footer } from '@/components/marketing/chrome'
import { LinkTracker } from '@/components/marketing/link-tracker'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'StitchDesk | Software for Fashion Designers and Tailors',
  description: 'Orders, measurements, deadlines and balances for fashion designers and tailors in Ghana and West Africa.',
  // Google Search Console ownership for https://stitchdeskapp.online/
  verification: { google: 'VVkRQ9XJMczfv8b4HftFueSM5fIH-vG6dId3QsifV2M' },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans bg-white text-gray-900">
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <LinkTracker />
    </div>
  )
}
