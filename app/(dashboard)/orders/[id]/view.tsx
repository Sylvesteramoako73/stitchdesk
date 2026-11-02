'use client'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, Zap, Check, Loader2, MessageCircle, FileText, ClipboardList, Link2, Trash2,
  Ruler, Calendar, User, Wallet, Ban, CheckCircle2, X, Phone,
} from 'lucide-react'
import { OrderForm, type StaffOption } from '@/components/orders/order-form'
import { updateOrderStatus, recordPayment, removePayment, deleteOrder } from '@/lib/actions/orders'
import { PIPELINE, STATUS_LABEL, STATUS_BADGE, PAYMENT_LABEL, nextStatus, dueLabel, daysUntil } from '@/lib/fashion/status'
import { measurementRows } from '@/lib/fashion/measurements'
import {
  orderConfirmationMessage, readyMessage, fittingReminderMessage, balanceReminderMessage, whatsappLink, trackingUrl,
} from '@/lib/fashion/messages'
import { formatCurrency, cn } from '@/lib/utils'
import type { Order, OrderStatus, PaymentMethod, CatalogueItem } from '@/lib/types'

type Shop = { name: string; phone: string; address: string }

function fmtDate(iso: string | null, withTime = false) {
  if (!iso) return 'Not set'
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso)
  return withTime
    ? d.toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function OrderDetailView({ order: initial, staff, catalogue, shop, justCreated, canManage }: {
  order: Order; staff: StaffOption[]; catalogue: CatalogueItem[]; shop: Shop; justCreated: boolean; canManage: boolean
}) {
  const router = useRouter()
  const [order, setOrder]     = useState(initial)
  const [editing, setEditing] = useState(false)
  const [showCreated, setShowCreated] = useState(justCreated)
  const [pending, start]      = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const [origin, setOrigin]   = useState('')
  const [pay, setPay]         = useState({ amount: '', method: 'momo' as PaymentMethod, note: '' })
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => { setOrigin(window.location.origin) }, [])
  useEffect(() => { if (justCreated) router.replace(`/orders/${initial.id}`, { scroll: false }) }, [justCreated, initial.id, router])

  const shopInfo = { salonName: shop.name || 'our shop', phone: shop.phone }
  const link     = trackingUrl(order.trackingToken, origin)
  const next     = nextStatus(order.status)
  const total    = order.price - (order.discount ?? 0)
  const closed   = order.status === 'collected' || order.status === 'cancelled'

  function run(fn: () => Promise<Order>) {
    setError(null)
    start(async () => {
      try { setOrder(await fn()) }
      catch (e: any) { setError(e?.message?.replace(/^.*?Error: /, '') ?? 'Something went wrong') }
    })
  }

  function setStatus(s: OrderStatus) {
    if (s === 'cancelled' && !confirm('Cancel this order? You can still see it under All orders.')) return
    run(() => updateOrderStatus(order.id, s))
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(pay.amount)
    if (!amount) return
    run(async () => {
      const o = await recordPayment(order.id, { amount, method: pay.method, note: pay.note || undefined })
      setPay({ amount: '', method: pay.method, note: '' })
      return o
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  async function pdf(kind: 'receipt' | 'job') {
    const m = await import('@/lib/pdf')
    if (kind === 'receipt') await m.downloadOrderReceipt(order, shop, link)
    else await m.downloadJobCard(order, shop)
  }

  const messages = [
    { key: 'confirm', label: 'Order confirmation', text: orderConfirmationMessage(order, shopInfo, origin) },
    ...(order.fittingDate && !closed ? [{ key: 'fitting', label: 'Fitting reminder', text: fittingReminderMessage(order, shopInfo, origin) }] : []),
    ...(order.status === 'ready' || order.status === 'finishing' ? [{ key: 'ready', label: 'Ready for pickup', text: readyMessage(order, shopInfo, origin) }] : []),
    ...(order.balance > 0 ? [{ key: 'balance', label: 'Balance reminder', text: balanceReminderMessage(order, shopInfo, origin) }] : []),
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>

      {showCreated && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-4 sm:px-5 py-4 flex items-center gap-3 flex-wrap">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm flex-1 min-w-[200px]"><span className="font-semibold">Order {order.orderNumber} saved.</span> Send {order.clientName.split(' ')[0]} a confirmation with their tracking link.</p>
          <a href={whatsappLink(order.clientPhone, messages[0].text)} target="_blank" rel="noreferrer" className="btn-primary !bg-none !bg-emerald-600 !shadow-none">
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </a>
          <button onClick={() => setShowCreated(false)} className="btn-ghost h-8 w-8 p-0 justify-center" aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{order.title}</h1>
            {order.isRush && <span className="badge badge-yellow"><Zap className="h-3 w-3" /> Rush</span>}
          </div>
          <p className="page-subtitle">
            {order.orderNumber} · <Link href={`/clients/${order.clientId}`} className="font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600">{order.clientName}</Link>
            {' · '}<a href={`tel:${order.clientPhone}`} className="hover:text-indigo-600">{order.clientPhone}</a>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!closed && <button onClick={() => setEditing(true)} className="btn-secondary"><Edit2 className="h-4 w-4" /> Edit</button>}
          <button onClick={() => pdf('job')} className="btn-secondary" title="Printable card with measurements for the workshop"><ClipboardList className="h-4 w-4" /> Job card</button>
          <button onClick={() => pdf('receipt')} className="btn-secondary"><FileText className="h-4 w-4" /> Receipt</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-4 sm:p-5">
        {order.status === 'cancelled' ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="badge badge-red">Cancelled</span>
            <button onClick={() => setStatus('received')} className="btn-secondary">Reopen order</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {PIPELINE.map((s, i) => {
                const idx  = PIPELINE.indexOf(order.status)
                const done = i < idx
                const cur  = i === idx
                return (
                  <button key={s} onClick={() => setStatus(s)} disabled={pending}
                    className="flex-1 min-w-[78px] group text-left" title={`Set to ${STATUS_LABEL[s]}`}>
                    <div className={cn('h-1.5 rounded-full transition-colors', done || cur ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-white/10 group-hover:bg-indigo-200')} />
                    <p className={cn('mt-2 text-[11px] font-semibold flex items-center gap-1', cur ? 'text-indigo-700 dark:text-indigo-300' : done ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400')}>
                      {done && <Check className="h-3 w-3" />}{STATUS_LABEL[s].replace(' for pickup', '')}
                    </p>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
              <div className="text-sm">
                <span className={`badge ${STATUS_BADGE[order.status]} mr-2`}>{STATUS_LABEL[order.status]}</span>
                {!closed && order.status !== 'ready' && (
                  <span className={cn('font-medium', daysUntil(order.dueDate) < 0 ? 'text-red-600' : 'text-gray-500')}>{dueLabel(order.dueDate)}</span>
                )}
              </div>
              <div className="flex gap-2">
                {!closed && canManage && (
                  <button onClick={() => setStatus('cancelled')} className="btn-ghost text-gray-500"><Ban className="h-4 w-4" /> Cancel</button>
                )}
                {next && (
                  <button onClick={() => setStatus(next)} disabled={pending} className="btn-primary">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {next === 'collected' ? 'Mark as collected' : `Move to ${STATUS_LABEL[next].toLowerCase()}`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Left */}
        <div className="space-y-5">
          <section className="card p-5 space-y-4">
            <h2 className="text-sm font-bold">Style</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><dt className="text-xs text-gray-500">Style</dt><dd className="font-medium">{order.garmentType}</dd></div>
              <div><dt className="text-xs text-gray-500">Quantity</dt><dd className="font-medium">{order.quantity}</dd></div>
              <div><dt className="text-xs text-gray-500">Fabric</dt><dd className="font-medium">{order.fabricSource === 'shop' ? 'We supply' : 'Client brought'}</dd></div>
            </dl>
            {order.fabricNotes && <p className="text-sm"><span className="text-gray-500">Fabric notes:</span> {order.fabricNotes}</p>}
            <div>
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{order.styleNotes || <span className="text-gray-400">No style notes yet.</span>}</p>
            </div>
            {order.styleImages?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {order.styleImages.map(url => (
                  <button key={url} onClick={() => setLightbox(url)} className="h-24 w-24 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Style" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5"><Ruler className="h-4 w-4 text-gray-400" /> Measurements</h2>
              {order.measurement && <span className="text-xs text-gray-500">{order.measurement.label} · {order.measurement.unit === 'cm' ? 'cm' : 'inches'}</span>}
            </div>
            {order.measurement ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                  {measurementRows(order.measurement).map(([label, v]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-white/5 text-sm">
                      <span className="text-gray-500">{label}</span><span className="font-semibold tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
                {order.measurement.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{order.measurement.notes}</p>}
              </>
            ) : (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <span>No measurements attached yet.</span>
                <div className="flex gap-2">
                  <Link href={`/clients/${order.clientId}?measure=1`} className="font-semibold underline underline-offset-2">Take measurements</Link>
                  {!closed && <button onClick={() => setEditing(true)} className="font-semibold underline underline-offset-2">Attach saved</button>}
                </div>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold mb-3">History</h2>
            <ol className="relative border-l border-gray-200 dark:border-white/10 ml-1.5 space-y-3">
              {[...(order.statusHistory ?? [])].reverse().map((e, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-white dark:ring-[#111115]" />
                  <p className="text-sm"><span className="font-medium">{STATUS_LABEL[e.status]}</span> <span className="text-gray-500">by {e.by}</span></p>
                  <p className="text-xs text-gray-400">{fmtDate(e.at, true)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold flex items-center gap-1.5 mb-3"><Wallet className="h-4 w-4 text-gray-400" /> Payment</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span>{formatCurrency(order.price)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-emerald-600">{formatCurrency(order.amountPaid)}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/10 text-base font-bold">
                <span>Balance</span><span className={order.balance > 0 ? '' : 'text-emerald-600'}>{order.balance > 0 ? formatCurrency(order.balance) : 'Paid'}</span>
              </div>
              {total > 0 && (
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (order.amountPaid / total) * 100)}%` }} />
                </div>
              )}
            </div>

            {order.payments?.length > 0 && (
              <ul className="mt-4 space-y-2">
                {order.payments.map(p => (
                  <li key={p.id} className="flex items-center justify-between text-sm group">
                    <div>
                      <p className="font-medium">{formatCurrency(p.amount)} <span className="text-gray-400 font-normal">· {PAYMENT_LABEL[p.method]}</span></p>
                      <p className="text-xs text-gray-400">{fmtDate(p.paidAt, true)}{p.note ? ` · ${p.note}` : ''}</p>
                    </div>
                    {canManage && (
                      <button onClick={() => confirm('Remove this payment?') && run(() => removePayment(order.id, p.id))}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1" title="Remove payment">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {order.balance > 0 && order.status !== 'cancelled' && (
              <form onSubmit={submitPayment} className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-2">
                <p className="form-label">Record a payment</p>
                <div className="flex gap-2">
                  <input type="number" min={0} step="0.01" max={order.balance} value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="form-input" />
                  <select value={pay.method} onChange={e => setPay(p => ({ ...p, method: e.target.value as PaymentMethod }))} className="form-input w-auto">
                    <option value="momo">MoMo</option><option value="cash">Cash</option><option value="bank_transfer">Bank</option><option value="card">Card</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPay(p => ({ ...p, amount: String(order.balance) }))} className="btn-secondary flex-1 justify-center text-xs">Full balance</button>
                  <button type="submit" disabled={pending || !Number(pay.amount)} className="btn-primary flex-1 justify-center disabled:opacity-50">Save</button>
                </div>
              </form>
            )}
          </section>

          <section className="card p-5 space-y-3 text-sm">
            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Ready by</p><p className="font-medium">{fmtDate(order.dueDate)}</p></div></div>
            <div className="flex items-center gap-3"><Ruler className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Fitting</p><p className="font-medium">{fmtDate(order.fittingDate)}</p></div></div>
            <div className="flex items-center gap-3"><User className="h-4 w-4 text-gray-400" /><div><p className="text-xs text-gray-500">Assigned to</p><p className="font-medium">{order.assignedName ?? 'Not assigned'}</p></div></div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold flex items-center gap-1.5 mb-1"><MessageCircle className="h-4 w-4 text-gray-400" /> Message {order.clientName.split(' ')[0]}</h2>
            <p className="text-xs text-gray-500 mb-3">Opens WhatsApp with the message written for you.</p>
            <div className="space-y-2">
              {messages.map(m => (
                <a key={m.key} href={whatsappLink(order.clientPhone, m.text)} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors">
                  {m.label} <MessageCircle className="h-4 w-4 text-emerald-600" />
                </a>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={copyLink} className="btn-secondary flex-1 justify-center text-xs">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />} {copied ? 'Copied' : 'Copy tracking link'}
                </button>
                <a href={`tel:${order.clientPhone}`} className="btn-secondary justify-center text-xs"><Phone className="h-4 w-4" /> Call</a>
              </div>
            </div>
          </section>

          {canManage && (
            <button
              onClick={() => {
                if (!confirm(`Delete order ${order.orderNumber} for good? This cannot be undone.`)) return
                start(async () => { await deleteOrder(order.id); router.push('/orders') })
              }}
              className="w-full text-xs text-gray-400 hover:text-red-600 py-2"
            >
              Delete this order
            </button>
          )}
        </div>
      </div>

      {editing && (
        <OrderForm
          clients={[{ id: order.clientId, name: order.clientName, phone: order.clientPhone }]}
          staff={staff}
          catalogue={catalogue}
          order={order}
          onClose={() => setEditing(false)}
          onSaved={o => { setOrder(o); setEditing(false) }}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Style" className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
