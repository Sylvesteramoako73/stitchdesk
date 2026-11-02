import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Ruler, Scissors, Wallet, MessageCircle, Users, Shirt, ArrowRight, Check, NotebookPen, PhoneCall, CalendarX, Coins,
} from 'lucide-react'
import { APP_URL, pageMetadata } from '@/lib/marketing/site'
import { softwareApplicationLd } from '@/lib/marketing/plans'
import { CTA } from '@/components/marketing/chrome'
import { Pricing } from '@/components/marketing/pricing'
import { FAQ } from '@/components/marketing/faq'
import { JsonLd } from '@/components/marketing/shared'

export const metadata: Metadata = pageMetadata({
  path: '/',
  title: 'Software for Fashion Designers and Tailors in Ghana | StitchDesk',
  description:
    'Save client measurements, track every order from cutting to pickup, record deposits and balances, and send clients a tracking link on WhatsApp. 14 day free trial, from GHS 99.',
})

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-indigo-50 to-white" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 lg:pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Built for fashion designers and tailors in Ghana
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-indigo-950 leading-[1.05] tracking-tight">
            Every order on time.<br /><span className="text-blue-600">Every cedi accounted for.</span>
          </h1>
          <p className="text-lg text-gray-600 mt-6 leading-relaxed max-w-2xl mx-auto">
            StitchDesk keeps your clients’ measurements, your orders and deadlines, and every deposit and balance in one place on your phone. Clients follow their own order with a tracking link, so you can get back to sewing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href={`${APP_URL}/signup`}
              className="flex items-center justify-center gap-2 h-12 px-6 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-900/20">
              Start 14 day free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/features"
              className="flex items-center justify-center gap-2 h-12 px-6 bg-white hover:bg-gray-50 text-indigo-900 font-semibold rounded-xl text-sm transition-colors border border-gray-200">
              See how it works
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">No card needed. From GHS 99 a month after your trial.</p>
        </div>

        <div className="relative mt-14 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-indigo-900/10 overflow-hidden bg-white">
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 px-3" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /><span className="h-2.5 w-2.5 rounded-full bg-gray-300" /><span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            </div>
            <Image src="/images/app-dashboard.png" alt="StitchDesk dashboard showing orders in progress, overdue orders, orders ready for pickup and money owed"
              width={1440} height={900} priority className="w-full h-auto" />
          </div>
          <div className="hidden md:block absolute -bottom-10 -right-6 w-[220px] rounded-[28px] border-[6px] border-indigo-950 shadow-2xl overflow-hidden bg-white">
            <Image src="/images/app-track.png" alt="Client tracking page on a phone" width={390} height={844} className="w-full h-auto" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Pains() {
  const pains = [
    { Icon: NotebookPen, title: 'Measurements in a notebook', text: 'Pages get lost, numbers get smudged, and the book is never where the client is.' },
    { Icon: CalendarX, title: 'The December rush', text: 'Forty orders, one memory. Something always slips until the client is at the door.' },
    { Icon: Coins, title: 'Who paid what?', text: 'Deposits by MoMo, balances in cash, and no single place that adds it all up.' },
    { Icon: PhoneCall, title: '“Is my dress ready?”', text: 'The same call, ten times a day, while you are trying to finish the dress.' },
  ]
  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Sound familiar?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-indigo-950">Great designers, buried in admin</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pains.map(p => (
            <div key={p.title} className="rounded-2xl p-6 bg-gray-50 border border-gray-100">
              <p.Icon className="h-6 w-6 text-indigo-700 mb-4" aria-hidden="true" />
              <h3 className="font-semibold text-indigo-950 mb-1.5">{p.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  { Icon: Ruler,         title: 'Measurement book',      text: 'Female and male sheets, inches or centimetres, several dated sets per client, and your own extra fields.', href: '/features/client-measurements' },
  { Icon: Scissors,      title: 'Order tracking',        text: 'Received, cutting, sewing, fitting, ready, collected. Overdue and due this week always in view.', href: '/features/order-tracking' },
  { Icon: Wallet,        title: 'Deposits and balances', text: 'Record the deposit and every part payment by MoMo, cash, bank or card. Print receipts in cedis.', href: '/features/deposits-and-balances' },
  { Icon: MessageCircle, title: 'WhatsApp in one tap',   text: 'Confirmation, fitting reminder, ready for pickup and balance messages written for you.', href: '/features/whatsapp-messages' },
  { Icon: Users,         title: 'Workshop and team',     text: 'Production board, job cards with measurements, staff logins, apprentices and commission.', href: '/features/job-cards-and-production' },
  { Icon: Shirt,         title: 'Styles and prices',     text: 'Your price list with photos and usual turnaround. Pick a style and the order fills itself.', href: '/features' },
]

function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">One place for the whole workshop</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-indigo-950">Everything from tape measure to pickup</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <Link key={f.title} href={f.href} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4"><f.Icon className="h-5 w-5" aria-hidden="true" /></div>
              <h3 className="font-semibold text-indigo-950 mb-2 flex items-center gap-1.5">{f.title}<ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" /></h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  const rows = [
    {
      eyebrow: 'Measure once',
      title: 'Measurements that follow the order',
      text: 'Take measurements on your phone at the table. They are saved to the client, attached to each new order, and printed on the job card for whoever is sewing.',
      img: '/images/app-measure.png', alt: 'Taking client measurements in StitchDesk',
    },
    {
      eyebrow: 'Stay on top of the money',
      title: 'Deposit, payments and balance on every order',
      text: 'Record the deposit when you take the order and each payment after it. The balance shows on the order, the client and your dashboard, and your client gets a proper receipt.',
      img: '/images/app-order.png', alt: 'StitchDesk order page with payments and balance',
    },
  ]
  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto space-y-20">
        {rows.map((r, i) => (
          <div key={r.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">{r.eyebrow}</p>
              <h2 className="text-3xl font-bold text-indigo-950 mb-4">{r.title}</h2>
              <p className="text-gray-600 leading-relaxed">{r.text}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 shadow-xl shadow-indigo-900/5 overflow-hidden">
              <Image src={r.img} alt={r.alt} width={1440} height={900} className="w-full h-auto" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Founding() {
  const points = [
    { title: 'Free for 14 days', text: 'Add your clients and real orders before you pay anything.' },
    { title: 'Help shape StitchDesk', text: 'Tell us what your workshop needs. Our first designers decide what we build next.' },
    { title: 'Support on WhatsApp', text: 'Message the people who build StitchDesk while you set up.' },
  ]
  return (
    <section className="py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Early access</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-indigo-950">Become a founding designer</h2>
        <p className="text-gray-600 mt-3 max-w-xl mx-auto">StitchDesk is new, and we are welcoming our first fashion designers and tailors in Ghana.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 text-left">
          {points.map(p => (
            <div key={p.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4"><Check className="h-4 w-4" aria-hidden="true" /></div>
              <h3 className="font-semibold text-indigo-950 mb-1.5">{p.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <Link href={`${APP_URL}/signup`} className="inline-flex items-center gap-2 h-12 px-6 mt-10 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-colors">
          Start as a founding designer <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="font-sans bg-white text-gray-900">
      <JsonLd items={[softwareApplicationLd]} />
      <Hero />
      <Pains />
      <Features />
      <Showcase />
      <Founding />
      <Pricing />
      <FAQ limit={6} />
      <CTA />
    </div>
  )
}
