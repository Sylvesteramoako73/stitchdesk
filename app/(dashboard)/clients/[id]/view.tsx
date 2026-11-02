'use client'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, MessageCircle, Ruler, Plus, Edit2, Copy, Trash2, Check, X, Loader2, Scissors, MapPin, Mail,
} from 'lucide-react'
import { MeasurementForm } from '@/components/clients/measurement-form'
import { deleteMeasurement } from '@/lib/actions/measurements'
import { updateClient } from '@/lib/actions/clients'
import { measurementRows } from '@/lib/fashion/measurements'
import { STATUS_LABEL, STATUS_BADGE, OPEN_STATUSES } from '@/lib/fashion/status'
import { whatsappLink } from '@/lib/fashion/messages'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import type { Client, Measurement, Order, MeasurementUnit } from '@/lib/types'

function nice(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ClientProfileView({ client: initial, measurements: initialM, orders, defaultUnit, openMeasure }: {
  client: Client; measurements: Measurement[]; orders: Order[]; defaultUnit: MeasurementUnit; openMeasure: boolean
}) {
  const router = useRouter()
  const [client, setClient] = useState(initial)
  const [measurements, setMeasurements] = useState(initialM)
  const [selected, setSelected] = useState<string | null>(initialM[0]?.id ?? null)
  const [form, setForm] = useState<{ mode: 'new' | 'edit' | 'copy'; m?: Measurement } | null>(openMeasure ? { mode: initialM[0] ? 'copy' : 'new', m: initialM[0] } : null)
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({ name: client.name, phone: client.phone, email: client.email ?? '', address: client.address ?? '', notes: client.notes ?? '', gender: client.gender ?? '' })
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (openMeasure) router.replace(`/clients/${client.id}`, { scroll: false }) }, [openMeasure, client.id, router])

  const current = measurements.find(m => m.id === selected) ?? measurements[0]
  const openOrders  = orders.filter(o => OPEN_STATUSES.includes(o.status) || o.status === 'ready')
  const owed        = openOrders.reduce((s, o) => s + o.balance, 0)
  const lifetime    = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.price - (o.discount ?? 0), 0)

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const updated = await updateClient(client.id, { ...edit, gender: edit.gender as any })
        setClient(updated); setEditing(false)
      } catch (err: any) { setError(err?.message?.replace(/^.*?Error: /, '') ?? 'Could not save') }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <ArrowLeft className="h-4 w-4" /> Clients
      </Link>

      {/* Header */}
      <div className="card p-5 flex items-center gap-4 flex-wrap">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
          {getInitials(client.name)}
        </div>
        <div className="flex-1 min-w-[180px]">
          <h1 className="text-xl font-black tracking-tight">{client.name}</h1>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-500 mt-0.5">
            <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-indigo-600"><Phone className="h-3.5 w-3.5" />{client.phone}</a>
            {client.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.email}</span>}
            {client.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{client.address}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={whatsappLink(client.phone, `Hello ${client.name.split(' ')[0]}, `)} target="_blank" rel="noreferrer" className="btn-secondary"><MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp</a>
          <button onClick={() => setEditing(true)} className="btn-secondary"><Edit2 className="h-4 w-4" /> Edit</button>
          <Link href={`/orders?client=${client.id}`} className="btn-primary"><Plus className="h-4 w-4" /> New order</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-box"><p>Orders</p><p>{orders.length}</p></div>
        <div className="stat-box"><p>Owes</p><p className={owed > 0 ? '!text-amber-600' : ''}>{formatCurrency(owed)}</p></div>
        <div className="stat-box"><p>Lifetime</p><p>{formatCurrency(lifetime)}</p></div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5">
        {/* Measurements */}
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-bold flex items-center gap-2"><Ruler className="h-4 w-4 text-gray-400" /> Measurements</h2>
            <button onClick={() => setForm({ mode: current ? 'copy' : 'new', m: current })} className="btn-primary">
              <Plus className="h-4 w-4" /> {current ? 'Measure again' : 'Take measurements'}
            </button>
          </div>

          {measurements.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 py-10 text-center">
              <Ruler className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="font-medium">No measurements yet</p>
              <p className="text-sm text-gray-500 mt-1">Save them once and never measure from scratch again.</p>
            </div>
          ) : (
            <>
              {measurements.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {measurements.map(m => (
                    <button key={m.id} onClick={() => setSelected(m.id)}
                      className={cn('shrink-0 rounded-xl border px-3 py-1.5 text-left',
                        current?.id === m.id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : 'border-gray-200 dark:border-white/10')}>
                      <p className="text-xs font-semibold">{m.label}</p>
                      <p className="text-[11px] text-gray-500">{nice(m.takenAt)}</p>
                    </button>
                  ))}
                </div>
              )}
              {current && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2 flex-wrap gap-2">
                    <span>{current.label} · {current.gender === 'male' ? 'Male' : 'Female'} · {current.unit === 'cm' ? 'centimetres' : 'inches'} · taken {nice(current.takenAt)}{current.takenBy ? ` by ${current.takenBy}` : ''}</span>
                    <span className="flex gap-1">
                      <button onClick={() => setForm({ mode: 'edit', m: current })} className="btn-ghost h-7 px-2 text-xs"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => setForm({ mode: 'copy', m: current })} className="btn-ghost h-7 px-2 text-xs" title="Start a new set from this one"><Copy className="h-3.5 w-3.5" /> Copy</button>
                      <button
                        onClick={() => {
                          if (!confirm(`Delete the "${current.label}" measurements?`)) return
                          start(async () => {
                            await deleteMeasurement(current.id)
                            setMeasurements(ms => ms.filter(x => x.id !== current.id))
                            setSelected(null)
                          })
                        }}
                        className="btn-ghost h-7 px-2 text-xs hover:!text-red-600 hover:!bg-red-50"
                      ><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5">
                    {measurementRows(current).map(([label, v]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-50 dark:border-white/5 text-sm">
                        <span className="text-gray-500">{label}</span><span className="font-semibold tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                  {current.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 rounded-xl bg-gray-50 dark:bg-white/5 px-3 py-2">{current.notes}</p>}
                </>
              )}
            </>
          )}
        </section>

        {/* Orders */}
        <section className="card p-5">
          <h2 className="font-bold mb-3">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5 -mx-2">
              {orders.map(o => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0"><Scissors className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.title}</p>
                      <p className="text-xs text-gray-500">{o.orderNumber} · due {nice(o.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${STATUS_BADGE[o.status]} text-[10px]`}>{STATUS_LABEL[o.status]}</span>
                      {o.balance > 0 && o.status !== 'cancelled' && <p className="text-[11px] text-gray-500 mt-0.5">{formatCurrency(o.balance)} owed</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <p className="form-label">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </section>
      </div>

      {form && (
        <MeasurementForm
          clientId={client.id}
          clientName={client.name}
          defaultGender={client.gender ?? 'female'}
          defaultUnit={defaultUnit}
          existing={form.mode === 'edit' ? form.m : undefined}
          copyFrom={form.mode === 'copy' ? form.m : undefined}
          onClose={() => setForm(null)}
          onSaved={m => {
            setMeasurements(ms => [m, ...ms.filter(x => x.id !== m.id)].sort((a, b) => b.takenAt.localeCompare(a.takenAt)))
            setSelected(m.id)
            setForm(null)
            if (!client.gender) setClient(c => ({ ...c, gender: m.gender }))
          }}
        />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setEditing(false)}>
          <form onSubmit={saveEdit} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold">Edit client</h2>
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost h-8 w-8 p-0 justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div><label className="form-label">Name</label><input required value={edit.name} onChange={e => setEdit(f => ({ ...f, name: e.target.value }))} className="form-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Phone</label><input required value={edit.phone} onChange={e => setEdit(f => ({ ...f, phone: e.target.value }))} className="form-input" /></div>
              <div>
                <label className="form-label">Gender</label>
                <select value={edit.gender} onChange={e => setEdit(f => ({ ...f, gender: e.target.value }))} className="form-input">
                  <option value="">Not set</option><option value="female">Female</option><option value="male">Male</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Email</label><input type="email" value={edit.email} onChange={e => setEdit(f => ({ ...f, email: e.target.value }))} className="form-input" /></div>
            <div><label className="form-label">Address or area</label><input value={edit.address} onChange={e => setEdit(f => ({ ...f, address: e.target.value }))} className="form-input" /></div>
            <div><label className="form-label">Notes</label><textarea rows={3} value={edit.notes} onChange={e => setEdit(f => ({ ...f, notes: e.target.value }))} className="form-input h-auto py-2" /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
