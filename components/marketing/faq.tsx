import Link from 'next/link'
import { FAQS } from '@/lib/marketing/faqs'
import { Breadcrumbs } from './shared'

export function FAQ({ limit, asPage = false }: { limit?: number; asPage?: boolean }) {
  const items = limit ? FAQS.slice(0, limit) : FAQS
  const Heading = asPage ? 'h1' : 'h2'
  return (
    <section id="faq" className={`${asPage ? 'pt-12 pb-24' : 'py-24'} px-4 sm:px-6 bg-gray-50`}>
      <div className="max-w-2xl mx-auto">
        {asPage && <Breadcrumbs trail={[{ name: 'FAQ', path: '/faq' }]} />}
        <div className="text-center mb-12">
          <Heading className="text-3xl font-bold text-gray-900">Frequently asked questions</Heading>
          {asPage && <p className="text-gray-500 mt-3">Everything designers usually ask before starting with StitchDesk.</p>}
        </div>
        <div className="space-y-4">
          {items.map(f => (
            <div key={f.q} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        {limit && (
          <p className="text-center mt-8">
            <Link href="/faq" className="text-sm font-semibold text-indigo-700 hover:underline">See all {FAQS.length} questions</Link>
          </p>
        )}
      </div>
    </section>
  )
}
