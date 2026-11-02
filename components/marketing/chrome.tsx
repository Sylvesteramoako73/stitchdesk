import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Scissors } from 'lucide-react'
import { APP_URL, CONTACT_EMAIL } from '@/lib/marketing/site'
import { FEATURE_PAGES } from '@/lib/marketing/features'

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
]

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="StitchDesk home">
          <Image src="/logo.png" alt="StitchDesk" width={162} height={40} className="h-10 w-auto object-contain" priority />
        </Link>
        <nav aria-label="Main" className="hidden md:flex items-center gap-7 text-sm text-gray-600">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="hover:text-gray-900 transition-colors">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href={`${APP_URL}/login`} className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link href={`${APP_URL}/signup`}
            className="flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Start free trial
          </Link>
        </div>
      </div>
      <nav aria-label="Main mobile" className="md:hidden border-t border-gray-100 overflow-x-auto">
        <div className="flex gap-5 px-4 h-10 items-center text-sm text-gray-600 whitespace-nowrap">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="hover:text-gray-900">{n.label}</Link>
          ))}
        </div>
      </nav>
    </header>
  )
}

export function CTA() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900">
      <div className="relative max-w-2xl mx-auto text-center">
        <Scissors className="h-10 w-10 text-indigo-300 mx-auto mb-6" aria-hidden="true" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready for a calmer December?</h2>
        <p className="text-indigo-100 mb-8 leading-relaxed">Join the first fashion designers in Ghana running their orders, measurements and balances in one place.</p>
        <Link href={`${APP_URL}/signup`}
          className="inline-flex items-center gap-2 h-12 px-8 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg">
          Start your free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="text-indigo-200 text-xs mt-4">14 days free. No card needed. Cancel anytime.</p>
      </div>
    </section>
  )
}

export function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'All features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Sign up', href: `${APP_URL}/signup` },
        { label: 'Sign in', href: `${APP_URL}/login` },
      ],
    },
    {
      title: 'Features',
      links: FEATURE_PAGES.map(f => ({ label: f.name, href: `/features/${f.slug}` })),
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'FAQ', href: '/faq' },
        { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
  ]
  return (
    <footer className="bg-slate-900 px-4 sm:px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-slate-700">
          <div className="max-w-xs">
            <Image src="/logo.png" alt="StitchDesk" width={146} height={36} className="h-9 w-auto object-contain brightness-0 invert mb-4" />
            <p className="text-slate-400 text-sm leading-relaxed">Workshop software for fashion designers and tailors in Ghana and West Africa.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            {columns.map(col => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-white font-semibold mb-3">{col.title}</p>
                <ul className="space-y-2 text-slate-400">
                  {col.links.map(l => (
                    <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-xs text-center mt-8" suppressHydrationWarning>© {new Date().getFullYear()} StitchDesk. All rights reserved.</p>
      </div>
    </footer>
  )
}
