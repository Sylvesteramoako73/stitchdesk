import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FEATURE_PAGES } from '@/lib/marketing/features'
import { pageMetadata } from '@/lib/marketing/site'
import { CTA } from '@/components/marketing/chrome'
import { Breadcrumbs, FeatureIcon, JsonLd } from '@/components/marketing/shared'

export const metadata: Metadata = pageMetadata({
  path: '/features',
  title: 'Features for Fashion Designers and Tailors | StitchDesk',
  description:
    'Measurement book, order tracking, deposits and balances, production board, job cards and WhatsApp messages. See everything StitchDesk does for your workshop.',
})

const MORE = [
  { title: 'Styles and prices', text: 'Keep your price list with photos, starting prices and usual turnaround, and fill new orders from it.' },
  { title: 'Expenses', text: 'Record fabric, rent, wages and utilities to see where the money goes each month.' },
  { title: 'Multiple branches', text: 'Run several shops from one account, each with its own team and orders.' },
  { title: 'Apprentice tracking', text: 'Follow apprentices, mentors, attendance and skill sign offs through to graduation.' },
  { title: 'Receipts and job cards', text: 'Download a receipt for the client and a job card for the workshop on any order.' },
  { title: 'Works on any phone', text: 'Runs in the browser on Android, iPhone and laptop, and installs to your home screen.' },
]

export default function FeaturesPage() {
  return (
    <>
      <JsonLd breadcrumbs={[{ name: 'Features', path: '/features' }]} />
      <section className="pt-12 pb-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs trail={[{ name: 'Features', path: '/features' }]} />
          <div className="max-w-3xl mb-12">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
              Software features for fashion designers and tailors
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              StitchDesk brings measurements, orders, deadlines, payments and your team into one system that works on your phone.
              Start with the part of your workshop that takes the most time today.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_PAGES.map(f => (
              <Link key={f.slug} href={`/features/${f.slug}`}
                className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                <FeatureIcon name={f.icon} />
                <h2 className="font-semibold text-gray-900 mt-4 mb-2">{f.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
                  Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
            <Link href="/pricing" className="group rounded-2xl p-6 bg-indigo-600 text-white flex flex-col justify-between hover:bg-indigo-700 transition-colors">
              <div>
                <p className="text-indigo-100 text-xs font-semibold uppercase tracking-widest mb-2">Plans from</p>
                <p className="text-4xl font-bold">GHS 150</p>
                <p className="text-indigo-100 text-sm mt-1">a month, after a 14 day free trial</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-6">
                Compare plans <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Also included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MORE.map(m => (
              <div key={m.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{m.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-8">Some features depend on your plan. <Link href="/pricing" className="font-semibold text-indigo-700 hover:underline">See what each plan includes</Link>.</p>
        </div>
      </section>
      <CTA />
    </>
  )
}
