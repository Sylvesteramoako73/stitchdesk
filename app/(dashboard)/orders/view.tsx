'use client'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, LayoutList, Columns3, Zap, ChevronRight, Ruler, Scissors } from 'lucide-react'
import { OrderForm, type ClientOption, type StaffOption } from '@/components/orders/order-form'
import { updateOrderStatus } from '@/lib/actions/orders'
import {
  PIPELINE, STATUS_LABEL, STATUS_BADGE, STATUS_DOT, OPEN_STATUSES, todayISO, addDaysISO, dueLabel, daysUntil, nextStatus,
} from '@/lib/fashion/status'
import { formatCurrency, cn } from '@/lib/utils'
import type { Order, OrderStatus, CatalogueItem } from '@/lib/types'

type Filter = 'active' | 'week' | 'overdue' | 'ready' | 'unpaid' | 'collected' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active',    label: 'In progress' },
  { key: 'week',      label: 'Due this week' },
  { key: 'overdue',   label: 'Overdue' },
  { key: 'ready',     label: 'Ready' },
  { key: 'unpaid',    label: 'Balance owed' },
  { key: 'collected', label: 'Collected' },
  { key: 'all',       label: 'All' },
]

type Props = {
  orders: Order[]
  clients: ClientOption[]
  staff: StaffOption[]
  catalogue: CatalogueItem[]
  openNew: boolean
  defaultClientId?: string
  initialQuery: string
  initialFilter?: string
}

export function DueChip({ order }: { order: Order }) {
  if (order.status === 'collected' || order.status === 'cancelled') return null
  if (order.status === 'ready') return <span className="text-xs text-emerald-600 font-medium">Waiting for pickup</span>
  const d = daysUntil(order.dueDate)
  return (
    <span className={cn('text-xs font-medium', d < 0 ? 'text-red-600' : d <= 2 ? 'text-amber-600' : 'text-gray-500')}>
      {dueLabel(order.dueDate)}
    </span>
  )
}

export function OrdersView({ orders: initial, clients, staff, catalogue, openNew, defaultClientId, initialQuery, initialFilter }: Props) {
  const router = useRouter()
  const [orders, setOrders] = useState(initial)
  const [showForm, setShowForm] = useState(openNew)
  const [query, setQuery]   = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>(
    (FILTERS.some(f => f.key === initialFilter) ? initialFilter : initialQuery ? 'all' : 'active') as Filter
  )
  const [mode, setMode]     = useState<'list' | 'board'>('list')
  const [staffFilter, setStaffFilter] = useState('')
  const [, start] = useTransition()

  const today = todayISO()
  const week  = addDaysISO(today, 7)

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { active: 0, week: 0, overdue: 0, ready: 0, unpaid: 0, collected: 0, all: orders.length }
    for (const o of orders) {
      const open = OPEN_STATUSES.includes(o.status)
      if (open) c.active++
      if (open && o.dueDate >= today && o.dueDate <= week) c.week++
      if (open && o.dueDate < today) c.overdue++
      if (o.status === 'ready') c.ready++
      if (o.balance > 0 && o.status !== 'cancelled') c.unpaid++
      if (o.status === 'collected') c.collected++
    }
    return c
  }, [orders, today, week])

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim()
    return orders
      .filter(o => {
        const open = OPEN_STATUSES.includes(o.status)
        switch (filter) {
          case 'active':    return open
          case 'week':      return open && o.dueDate >= today && o.dueDate <= week
          case 'overdue':   return open && o.dueDate < today
          case 'ready':     return o.status === 'ready'
          case 'unpaid':    return o.balance > 0 && o.status !== 'cancelled'
          case 'collected': return o.status === 'collected'
          default:          return true
        }
      })
      .filter(o => !staffFilter || o.assignedTo === staffFilter)
      .filter(o => !q || [o.orderNumber, o.clientName, o.clientPhone, o.title, o.garmentType].some(v => (v ?? '').toLowerCase().includes(q)))
      .sort((a, b) =>
        filter === 'collected'
          ? (b.collectedAt ?? '').localeCompare(a.collectedAt ?? '')
          : Number(b.isRush) - Number(a.isRush) || a.dueDate.localeCompare(b.dueDate))
  }, [orders, filter, query, staffFilter, today, week])

  function advance(o: Order, to: OrderStatus) {
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: to } : x))
    start(async () => {
      try {
        const updated = await updateOrderStatus(o.id, to)
        setOrders(prev => prev.map(x => x.id === o.id ? updated : x))
      } catch {
        setOrders(prev => prev.map(x => x.id === o.id ? o : x))
      }
    })
  }

  const boardColumns: OrderStatus[] = ['received', 'cutting', 'sewing', 'fitting', 'finishing', 'ready']

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">
            {counts.active} in progress · {counts.ready} ready for pickup
            {counts.overdue > 0 && <span className="text-red-600 font-medium"> · {counts.overdue} overdue</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> New order</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn('shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors',
              filter === f.key
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300',
              f.key === 'overdue' && counts.overdue > 0 && filter !== f.key && 'text-red-600 border-red-200')}>
            {f.label} <span className="opacity-70 ml-0.5">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order, client, phone, style" className="form-input pl-9" />
        </div>
        {staff.length > 0 && (
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className="form-input w-auto">
            <option value="">Everyone</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div className="ml-auto flex rounded-xl bg-gray-100 dark:bg-white/5 p-0.5">
          {([['list', LayoutList, 'List'], ['board', Columns3, 'Board']] as const).map(([m, Icon, label]) => (
            <button key={m} onClick={() => setMode(m)} title={label}
              className={cn('h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold', mode === m ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500')}>
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'list' ? (
        visible.length === 0 ? (
          <EmptyState hasAny={orders.length > 0} onNew={() => setShowForm(true)} />
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
            {visible.map(o => {
              const next = nextStatus(o.status)
              return (
                <div key={o.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  {o.styleImages?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.styleImages[0]} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-white/10" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0"><Scissors className="h-5 w-5" /></div>
                  )}
                  <Link href={`/orders/${o.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{o.clientName}</span>
                      <span className="text-xs text-gray-400">{o.orderNumber}</span>
                      {o.isRush && <span className="badge badge-yellow !py-0 text-[10px]"><Zap className="h-3 w-3" />Rush</span>}
                      {!o.measurementId && OPEN_STATUSES.includes(o.status) && (
                        <span className="badge badge-red !py-0 text-[10px]" title="No measurements attached"><Ruler className="h-3 w-3" />No measurements</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{o.title} {o.quantity > 1 && `x${o.quantity}`}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <DueChip order={o} />
                      {o.assignedName && <span className="text-xs text-gray-400 hidden sm:inline">{o.assignedName}</span>}
                    </div>
                  </Link>
                  <div className="text-right shrink-0 hidden sm:block">
                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <p className={cn('text-xs mt-1', o.balance > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-emerald-600')}>
                      {o.balance > 0 ? `${formatCurrency(o.balance)} owed` : 'Paid in full'}
                    </p>
                  </div>
                  {next && o.status !== 'cancelled' ? (
                    <button onClick={() => advance(o, next)}
                      className="shrink-0 h-8 px-3 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/40 transition-colors"
                      title={`Move to ${STATUS_LABEL[next]}`}>
                      <span className="hidden md:inline">{STATUS_LABEL[next].replace(' for pickup', '')}</span>
                      <ChevronRight className="h-4 w-4 md:hidden" />
                    </button>
                  ) : <span className="w-8 shrink-0" />}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x">
          {boardColumns.map(col => {
            const items = orders
              .filter(o => o.status === col)
              .filter(o => !staffFilter || o.assignedTo === staffFilter)
              .filter(o => !query || [o.orderNumber, o.clientName, o.title].some(v => v.toLowerCase().includes(query.toLowerCase())))
            return (
              <div key={col} className="w-[260px] shrink-0 snap-start">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[col]}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{STATUS_LABEL[col]}</span>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.03] p-2">
                  {items.map(o => {
                    const i    = PIPELINE.indexOf(o.status)
                    const prev = i > 0 ? PIPELINE[i - 1] : null
                    const next = nextStatus(o.status)
                    return (
                      <div key={o.id} className="card !rounded-xl p-3 space-y-2">
                        <button onClick={() => router.push(`/orders/${o.id}`)} className="text-left w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm truncate">{o.clientName}</span>
                            {o.isRush && <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{o.orderNumber} · {o.title}</p>
                          <div className="mt-1"><DueChip order={o} /></div>
                        </button>
                        <div className="flex gap-1">
                          {prev && (
                            <button onClick={() => advance(o, prev)} className="h-7 px-2 rounded-lg text-[11px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200">Back</button>
                          )}
                          {next && (
                            <button onClick={() => advance(o, next)} className="flex-1 h-7 px-2 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100">
                              {STATUS_LABEL[next].replace(' for pickup', '')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <OrderForm
          clients={clients}
          staff={staff}
          catalogue={catalogue}
          defaultClientId={defaultClientId}
          onClose={() => { setShowForm(false); if (openNew) router.replace('/orders') }}
          onSaved={o => { setShowForm(false); router.push(`/orders/${o.id}?created=1`) }}
        />
      )}
    </div>
  )
}

function EmptyState({ hasAny, onNew }: { hasAny: boolean; onNew: () => void }) {
  return (
    <div className="card py-16 px-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-4"><Scissors className="h-6 w-6" /></div>
      <p className="font-semibold">{hasAny ? 'No orders match' : 'No orders yet'}</p>
      <p className="text-sm text-gray-500 mt-1 mb-5">{hasAny ? 'Try another filter or search.' : 'Record your first order and every job, deadline and balance lives in one place.'}</p>
      {!hasAny && <button onClick={onNew} className="btn-primary mx-auto"><Plus className="h-4 w-4" /> New order</button>}
    </div>
  )
}
