import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PLANS } from '@/lib/marketing/plans'
import { APP_URL } from '@/lib/marketing/site'
import { Breadcrumbs } from './shared'

export function Pricing({ asPage = false }: { asPage?: boolean }) {
  const Heading = asPage ? 'h1' : 'h2'
  const PlanHeading = asPage ? 'h2' : 'h3'
  return (
    <section id="pricing" className={`${asPage ? 'pt-12 pb-24' : 'py-24'} px-4 sm:px-6 bg-white`}>
      <div className="max-w-5xl mx-auto">
        {asPage && <Breadcrumbs trail={[{ name: 'Pricing', path: '/pricing' }]} />}
        <div className="text-center mb-14">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-3">Simple pricing</p>
          <Heading className="text-3xl sm:text-4xl font-bold text-gray-900">
            {asPage ? 'Fashion designer software pricing in cedis' : 'Pay as you grow'}
          </Heading>
          <p className="text-gray-500 mt-3">All plans include a 14 day free trial. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(p => (
            <div key={p.name} className={`rounded-2xl p-7 border ${p.highlight ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-gray-200 shadow-sm'}`}>
              {p.highlight && <span className="inline-block text-xs font-semibold text-indigo-600 bg-white px-2.5 py-1 rounded-full mb-4">Most popular</span>}
              <PlanHeading className={`font-bold text-lg mb-1 ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.name}</PlanHeading>
              <p className={`text-xs mb-5 ${p.highlight ? 'text-indigo-100' : 'text-gray-500'}`}>{p.desc}</p>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>GHS {p.price}</span>
                <span className={`text-sm ml-1 ${p.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>/mo</span>
              </div>
              <ul className="space-y-2.5 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? 'text-indigo-200' : 'text-indigo-600'}`} aria-hidden="true" />
                    <span className={p.highlight ? 'text-indigo-50' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={`${APP_URL}/signup`}
                className={`flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-semibold transition-colors ${p.highlight ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                Start free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
