import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/marketing/site'
import { softwareApplicationLd } from '@/lib/marketing/plans'
import { FAQS } from '@/lib/marketing/faqs'
import { CTA } from '@/components/marketing/chrome'
import { Pricing } from '@/components/marketing/pricing'
import { JsonLd } from '@/components/marketing/shared'

export const metadata: Metadata = pageMetadata({
  path: '/pricing',
  title: 'Fashion Designer Software Pricing from GHS 99 a Month | StitchDesk',
  description:
    'Simple pricing in cedis: Starter GHS 99, Pro GHS 199 and Fashion House GHS 399 a month. Every plan starts with a 14 day free trial, no card needed.',
})

const QUESTIONS = ['How much does StitchDesk cost?', 'Do I need a credit card to start?', 'What payment methods do you accept for my subscription?']

export default function PricingPage() {
  const items = FAQS.filter(f => QUESTIONS.includes(f.q))
  return (
    <>
      <JsonLd breadcrumbs={[{ name: 'Pricing', path: '/pricing' }]} items={[softwareApplicationLd]} />
      <Pricing asPage />
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Pricing questions</h2>
          <div className="space-y-4">
            {items.map(f => (
              <div key={f.q} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-8">
            Not sure which plan fits? <Link href="/features" className="font-semibold text-indigo-700 hover:underline">See every feature</Link> or
            email <a href="mailto:hello@stitchdeskapp.online" className="font-semibold text-indigo-700 hover:underline">hello@stitchdeskapp.online</a>.
          </p>
        </div>
      </section>
      <CTA />
    </>
  )
}
