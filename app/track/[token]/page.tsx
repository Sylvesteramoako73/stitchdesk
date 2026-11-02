import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check, Phone, MessageCircle, MapPin, Calendar, Ruler } from 'lucide-react'
import { getPublicOrder } from '@/lib/tracking'
import { PIPELINE, STATUS_LABEL, STATUS_PUBLIC } from '@/lib/fashion/status'
import { whatsappLink } from '@/lib/fashion/messages'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const o = await getPublicOrder(params.token)
  return {
    title: o ? `Order ${o.orderNumber} · ${o.shop.name}` : 'Order not found',
    robots: { index: false, follow: false },
  }
}

function niceDate(iso: string) {
  return new Date((iso.length === 10 ? iso + 'T12:00:00Z' : iso)).toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function TrackPage({ params }: { params: { token: string } }) {
  const o = await getPublicOrder(params.token)
  if (!o) notFound()

  const steps   = PIPELINE
  const current = steps.indexOf(o.status)
  const reached = new Map(o.statusHistory.map(e => [e.status, e.at]))
  const cancelled = o.status === 'cancelled'

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 px-4 py-8 sm:py-14">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{o.shop.name}</p>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            {o.clientFirstName ? `Hello ${o.clientFirstName},` : 'Hello,'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{STATUS_PUBLIC[o.status]}.</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Order {o.orderNumber}</p>
              <p className="font-bold text-lg leading-tight mt-0.5">{o.title}</p>
              <p className="text-sm text-gray-500">{o.garmentType}{o.quantity > 1 ? ` x${o.quantity}` : ''}</p>
            </div>
            <span className={`badge ${cancelled ? 'badge-red' : o.status === 'ready' || o.status === 'collected' ? 'badge-green' : 'badge-blue'} shrink-0`}>
              {STATUS_LABEL[o.status]}
            </span>
          </div>

          {!cancelled && (
            <ol className="mt-6 space-y-0">
              {steps.map((s, i) => {
                const done = i < current
                const cur  = i === current
                const at   = reached.get(s)
                return (
                  <li key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={
                        'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ' +
                        (done ? 'bg-indigo-600 text-white' : cur ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950' : 'bg-gray-100 dark:bg-white/10 text-gray-400')
                      }>
                        {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      {i < steps.length - 1 && <span className={'w-0.5 flex-1 min-h-[22px] ' + (done ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-white/10')} />}
                    </div>
                    <div className="pb-4 -mt-0.5">
                      <p className={'text-sm ' + (cur ? 'font-bold' : done ? 'font-medium' : 'text-gray-400')}>{STATUS_LABEL[s]}</p>
                      {at && (done || cur) && <p className="text-xs text-gray-400">{niceDate(at)}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="card p-5 space-y-3 text-sm">
          {o.status !== 'collected' && !cancelled && (
            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-indigo-500" /><span><span className="text-gray-500">Expected ready:</span> <span className="font-semibold">{niceDate(o.dueDate)}</span></span></div>
          )}
          {o.fittingDate && o.status !== 'collected' && !cancelled && (
            <div className="flex items-center gap-3"><Ruler className="h-4 w-4 text-indigo-500" /><span><span className="text-gray-500">Fitting:</span> <span className="font-semibold">{niceDate(o.fittingDate)}</span></span></div>
          )}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span>{formatCurrency(o.total)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paid</span><span>{formatCurrency(o.amountPaid)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Balance</span><span>{o.balance > 0 ? formatCurrency(o.balance) : 'Fully paid'}</span></div>
          </div>
        </div>

        {(o.shop.phone || o.shop.whatsapp) && (
          <div className="grid grid-cols-2 gap-3">
            {o.shop.whatsapp && (
              <a href={whatsappLink(o.shop.whatsapp, `Hello, I am checking on order ${o.orderNumber}.`)} className="h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {o.shop.phone && (
              <a href={`tel:${o.shop.phone}`} className="h-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-semibold text-sm flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
          </div>
        )}
        {o.shop.address && <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{o.shop.address}</p>}

        <p className="text-center text-[11px] text-gray-400 pt-4">Powered by StitchDesk</p>
      </div>
    </main>
  )
}
