import Link from 'next/link'
import { AlertTriangle, CalendarClock, PackageCheck, Wallet, Plus, Ruler, Scissors, ArrowRight, Zap, UserPlus, Shirt } from 'lucide-react'
import { getDashboardData } from '@/lib/actions/orders'
import { getSessionUser } from '@/lib/auth'
import { getSalonSettings } from '@/lib/actions/settings'
import { PIPELINE, STATUS_LABEL, STATUS_DOT, dueLabel, PAYMENT_LABEL } from '@/lib/fashion/status'
import { formatCurrency, getGreeting } from '@/lib/utils'
import type { Order } from '@/lib/types'

function OrderRow({ o, tone }: { o: Order; tone?: 'red' | 'amber' | 'green' }) {
  return (
    <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate flex items-center gap-1.5">
          {o.isRush && <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />}{o.clientName}
        </p>
        <p className="text-xs text-gray-500 truncate">{o.orderNumber} · {o.title}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={
          tone === 'red' ? 'text-xs font-semibold text-red-600' :
          tone === 'amber' ? 'text-xs font-semibold text-amber-600' :
          tone === 'green' ? 'text-xs font-semibold text-emerald-600' : 'text-xs text-gray-500'
        }>
          {tone === 'green' ? (o.balance > 0 ? `${formatCurrency(o.balance)} to collect` : 'Paid') : dueLabel(o.dueDate)}
        </p>
        <p className="text-[11px] text-gray-400">{STATUS_LABEL[o.status]}</p>
      </div>
    </Link>
  )
}

function Panel({ title, href, count, children, empty }: { title: string; href: string; count: number; children: React.ReactNode; empty: string }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-sm font-bold">{title} <span className="text-gray-400 font-medium">{count}</span></h2>
        <Link href={href} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
      </div>
      {count === 0 ? <p className="text-sm text-gray-400 px-2 py-6 text-center">{empty}</p> : <div>{children}</div>}
    </section>
  )
}

export default async function DashboardPage() {
  const [data, user, settings] = await Promise.all([getDashboardData(), getSessionUser(), getSalonSettings()])
  const firstName = user?.name?.split(' ')[0] ?? ''
  const isNew = data.totalOrders === 0

  const stats = [
    { label: 'In progress', value: String(data.activeCount), sub: `${data.dueThisWeek} due this week`, Icon: Scissors, href: '/orders', tint: 'from-indigo-500 to-blue-600' },
    { label: 'Overdue', value: String(data.overdueCount), sub: data.overdueCount ? 'Needs attention' : 'All on time', Icon: AlertTriangle, href: '/orders?filter=overdue', tint: data.overdueCount ? 'from-rose-500 to-red-600' : 'from-slate-400 to-slate-500' },
    { label: 'Ready for pickup', value: String(data.readyCount), sub: 'Waiting for clients', Icon: PackageCheck, href: '/orders?filter=ready', tint: 'from-emerald-500 to-teal-600' },
    { label: 'Owed to you', value: formatCurrency(data.outstanding), sub: `${formatCurrency(data.paymentsThisMonth)} received this month`, Icon: Wallet, href: '/orders?filter=unpaid', tint: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gray-500">{getGreeting()}{firstName && `, ${firstName}`}</p>
          <h1 className="page-title mt-1">{settings.salonName || 'Your workshop'}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/clients" className="btn-secondary"><Ruler className="h-4 w-4" /> Measure a client</Link>
          <Link href="/orders?new=1" className="btn-primary"><Plus className="h-4 w-4" /> New order</Link>
        </div>
      </div>

      {isNew && (
        <section className="card p-5 sm:p-6 bg-gradient-to-br from-indigo-600 to-blue-700 !border-0 text-white">
          <h2 className="text-lg font-bold text-white">Welcome to StitchDesk</h2>
          <p className="text-sm text-indigo-100 mt-1 mb-4">Three steps and your workshop is running from here.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { n: 1, t: 'Add your price list', d: 'Styles you sew and what they cost', href: '/catalogue', Icon: Shirt },
              { n: 2, t: 'Add a client and measure', d: 'Measurements saved for every order', href: '/clients', Icon: UserPlus },
              { n: 3, t: 'Record your first order', d: 'Deposit, ready date, tracking link', href: '/orders?new=1', Icon: Scissors },
            ].map(s => (
              <Link key={s.n} href={s.href} className="rounded-2xl bg-white/10 hover:bg-white/15 transition-colors p-4 flex gap-3">
                <span className="h-8 w-8 rounded-xl bg-white text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">{s.n}</span>
                <span><span className="block font-semibold text-sm">{s.t}</span><span className="block text-xs text-indigo-100 mt-0.5">{s.d}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="card p-4 sm:p-5 hover:-translate-y-0.5 transition-transform">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.tint} text-white flex items-center justify-center mb-3`}><s.Icon className="h-4 w-4" /></div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-2xl font-black tracking-tight mt-0.5">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Workshop pipeline */}
      {!isNew && (
        <section className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Workshop</h2>
            <Link href="/orders" className="text-xs font-semibold text-indigo-600">Open board</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PIPELINE.filter(s => s !== 'collected').map(s => (
              <div key={s} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} /><span className="text-[11px] font-semibold text-gray-500 truncate">{STATUS_LABEL[s].replace(' for pickup', '')}</span></div>
                <p className="text-xl font-black mt-0.5">{data.stageCounts[s] ?? 0}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Panel title="Overdue" href="/orders?filter=overdue" count={data.overdueCount} empty="Nothing overdue. Well done.">
          {data.overdue.map(o => <OrderRow key={o.id} o={o} tone="red" />)}
        </Panel>
        <Panel title="Due this week" href="/orders?filter=week" count={data.dueThisWeek} empty="Nothing due in the next 7 days.">
          {data.dueSoon.map(o => <OrderRow key={o.id} o={o} tone="amber" />)}
        </Panel>
        <Panel title="Ready for pickup" href="/orders?filter=ready" count={data.readyCount} empty="No finished orders waiting.">
          {data.ready.map(o => <OrderRow key={o.id} o={o} tone="green" />)}
        </Panel>
      </div>

      {!isNew && (
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
          <section className="card p-4 sm:p-5">
            <h2 className="text-sm font-bold mb-2 px-2 flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-gray-400" /> Fittings in the next 3 days</h2>
            {data.fittingsSoon.length === 0 ? <p className="text-sm text-gray-400 px-2 py-6 text-center">No fittings booked.</p> : data.fittingsSoon.map(o => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                <span className="text-sm"><span className="font-semibold">{o.clientName}</span> <span className="text-gray-500">· {o.title}</span></span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{new Date(o.fittingDate + 'T12:00:00Z').toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </Link>
            ))}
          </section>
          <section className="card p-4 sm:p-5">
            <h2 className="text-sm font-bold mb-2 px-2 flex items-center gap-1.5"><Wallet className="h-4 w-4 text-gray-400" /> Recent payments</h2>
            {data.recentPayments.length === 0 ? <p className="text-sm text-gray-400 px-2 py-6 text-center">No payments yet.</p> : data.recentPayments.map((p, i) => (
              <Link key={i} href={`/orders/${p.orderId}`} className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                <span className="text-sm"><span className="font-semibold">{p.clientName}</span> <span className="text-gray-500">· {p.orderNumber} · {PAYMENT_LABEL[p.method]}</span></span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
              </Link>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
