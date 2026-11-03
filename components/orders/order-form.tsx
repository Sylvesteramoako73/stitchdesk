'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { X, Loader2, Check, UserPlus, Users, Ruler, Zap } from 'lucide-react'
import { createOrder, updateOrder } from '@/lib/actions/orders'
import { getMeasurements } from '@/lib/actions/measurements'
import { GARMENT_TYPES } from '@/lib/fashion/measurements'
import { addDaysISO, todayISO } from '@/lib/fashion/status'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatCurrency, cn } from '@/lib/utils'
import type { Order, Measurement, CatalogueItem, PaymentMethod } from '@/lib/types'

export type ClientOption = { id: string; name: string; phone: string }
export type StaffOption  = { id: string; name: string }

type Props = {
  clients: ClientOption[]
  staff: StaffOption[]
  catalogue: CatalogueItem[]
  order?: Order                 // present when editing
  defaultClientId?: string
  onClose: () => void
  onSaved: (order: Order) => void
}

export function OrderForm({ clients, staff, catalogue, order, defaultClientId, onClose, onSaved }: Props) {
  const editing = !!order
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [clientMode, setClientMode] = useState<'existing' | 'new'>(clients.length === 0 && !editing ? 'new' : 'existing')
  const [clientId, setClientId]     = useState(order?.clientId ?? defaultClientId ?? '')
  const [clientQuery, setClientQuery] = useState('')
  const [newClient, setNewClient]   = useState({ name: '', phone: '' })

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loadingMeas, setLoadingMeas]   = useState(false)

  const [f, setF] = useState({
    title:         order?.title ?? '',
    garmentType:   order?.garmentType ?? 'Kaba and slit',
    quantity:      order?.quantity ?? 1,
    styleNotes:    order?.styleNotes ?? '',
    styleImages:   order?.styleImages ?? [] as string[],
    fabricSource:  order?.fabricSource ?? 'client' as 'client' | 'shop',
    fabricNotes:   order?.fabricNotes ?? '',
    // Empty rather than 0 on a new order, so typing 500 does not give 0500
    price:         order?.price ?? ('' as number | ''),
    discount:      order?.discount ?? ('' as number | ''),
    isRush:        order?.isRush ?? false,
    dueDate:       order?.dueDate ?? addDaysISO(todayISO(), 14),
    fittingDate:   order?.fittingDate ?? '',
    assignedTo:    order?.assignedTo ?? '',
    measurementId: order?.measurementId ?? '',
    depositAmount: '' as number | '',
    depositMethod: 'momo' as PaymentMethod,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(prev => ({ ...prev, [k]: v }))

  // Load the chosen client's measurements, and pick the latest by default
  useEffect(() => {
    if (clientMode !== 'existing' || !clientId) { setMeasurements([]); return }
    let alive = true
    setLoadingMeas(true)
    getMeasurements(clientId).then(ms => {
      if (!alive) return
      setMeasurements(ms)
      setLoadingMeas(false)
      if (!editing && ms[0]) setF(prev => ({ ...prev, measurementId: prev.measurementId || ms[0].id }))
    })
    return () => { alive = false }
  }, [clientId, clientMode, editing])

  const filteredClients = useMemo(() => {
    const q = clientQuery.toLowerCase().trim()
    if (!q) return clients.slice(0, 50)
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))).slice(0, 50)
  }, [clients, clientQuery])

  const selectedClient = clients.find(c => c.id === clientId)
  const total   = Math.max(0, Number(f.price) - Number(f.discount))
  const balance = Math.max(0, total - (editing ? order!.amountPaid : Number(f.depositAmount)))

  function applyCatalogue(id: string) {
    const item = catalogue.find(c => c.id === id)
    if (!item) return
    setF(prev => ({
      ...prev,
      title:       prev.title || item.name,
      garmentType: GARMENT_TYPES.includes(item.category) ? item.category : prev.garmentType,
      price:       prev.price || item.priceFrom,
      dueDate:     item.typicalDays ? addDaysISO(todayISO(), item.typicalDays) : prev.dueDate,
      styleImages: item.imageUrl && !prev.styleImages.includes(item.imageUrl) ? [...prev.styleImages, item.imageUrl] : prev.styleImages,
    }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const common = {
      title:         f.title.trim() || f.garmentType,
      garmentType:   f.garmentType,
      quantity:      Number(f.quantity) || 1,
      styleNotes:    f.styleNotes || null,
      styleImages:   f.styleImages,
      fabricSource:  f.fabricSource,
      fabricNotes:   f.fabricNotes || null,
      price:         Number(f.price) || 0,
      discount:      Number(f.discount) || 0,
      isRush:        f.isRush,
      dueDate:       f.dueDate,
      fittingDate:   f.fittingDate || null,
      assignedTo:    f.assignedTo || null,
      measurementId: f.measurementId || null,
    }
    start(async () => {
      try {
        const saved = editing
          ? await updateOrder(order!.id, common)
          : await createOrder({
              ...common,
              clientId:  clientMode === 'existing' ? clientId : '',
              newClient: clientMode === 'new' ? newClient : undefined,
              deposit:   Number(f.depositAmount) > 0 ? { amount: Number(f.depositAmount), method: f.depositMethod } : undefined,
            })
        onSaved(saved)
      } catch (err: any) {
        setError(err?.message?.replace(/^.*?Error: /, '') ?? 'Could not save the order')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[94vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold">{editing ? `Edit order ${order!.orderNumber}` : 'New order'}</h2>
            {!editing && <p className="text-xs text-gray-500 mt-0.5">Takes under a minute. You can add details later.</p>}
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0 justify-center" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <form id="order-form" onSubmit={submit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Client */}
          {!editing ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Client</h3>
                <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-0.5 text-xs font-semibold">
                  <button type="button" onClick={() => setClientMode('existing')}
                    className={cn('px-3 py-1.5 rounded-lg flex items-center gap-1.5', clientMode === 'existing' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500')}>
                    <Users className="h-3.5 w-3.5" /> Existing
                  </button>
                  <button type="button" onClick={() => setClientMode('new')}
                    className={cn('px-3 py-1.5 rounded-lg flex items-center gap-1.5', clientMode === 'new' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500')}>
                    <UserPlus className="h-3.5 w-3.5" /> New client
                  </button>
                </div>
              </div>

              {clientMode === 'existing' ? (
                selectedClient ? (
                  <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-800 px-4 py-3">
                    <div>
                      <p className="font-semibold">{selectedClient.name}</p>
                      <p className="text-xs text-gray-500">{selectedClient.phone}</p>
                    </div>
                    <button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => { setClientId(''); set('measurementId', '') }}>Change</button>
                  </div>
                ) : (
                  <div>
                    <input autoFocus value={clientQuery} onChange={e => setClientQuery(e.target.value)} placeholder="Search by name or phone" className="form-input" />
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/10 divide-y divide-gray-50 dark:divide-white/5">
                      {filteredClients.length === 0 && (
                        <button type="button" onClick={() => { setClientMode('new'); setNewClient(n => ({ ...n, name: clientQuery })) }} className="w-full text-left px-4 py-3 text-sm text-indigo-600 font-medium">
                          No match. Add &ldquo;{clientQuery}&rdquo; as a new client
                        </button>
                      )}
                      {filteredClients.map(c => (
                        <button type="button" key={c.id} onClick={() => setClientId(c.id)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between">
                          <span className="font-medium">{c.name}</span><span className="text-xs text-gray-500">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="form-label">Full name</label><input required value={newClient.name} onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))} className="form-input" placeholder="e.g. Akosua Mensah" /></div>
                  <div><label className="form-label">Phone</label><input required value={newClient.phone} onChange={e => setNewClient(n => ({ ...n, phone: e.target.value }))} className="form-input" placeholder="024 123 4567" inputMode="tel" /></div>
                  <p className="sm:col-span-2 text-xs text-gray-500">Take their measurements from the client page after saving, or attach them later.</p>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm"><span className="text-gray-500">Client:</span> <span className="font-semibold">{order!.clientName}</span></div>
          )}

          {/* Garment */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">What are we making?</h3>
              {catalogue.length > 0 && !editing && (
                <select defaultValue="" onChange={e => applyCatalogue(e.target.value)} className="form-input w-auto text-xs h-8">
                  <option value="" disabled>Fill from price list</option>
                  {catalogue.map(c => <option key={c.id} value={c.id}>{c.name} · {formatCurrency(c.priceFrom)}</option>)}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="form-label">Style</label>
                <select value={f.garmentType} onChange={e => set('garmentType', e.target.value)} className="form-input">
                  {GARMENT_TYPES.map(g => <option key={g}>{g}</option>)}
                  {!GARMENT_TYPES.includes(f.garmentType) && <option>{f.garmentType}</option>}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Quantity</label>
                <input type="number" min={1} value={f.quantity} onChange={e => set('quantity', Number(e.target.value))} className="form-input" />
              </div>
              <label className="col-span-2 sm:col-span-1 flex items-end">
                <span className={cn('h-9 w-full rounded-xl border px-3 flex items-center gap-2 text-sm font-semibold cursor-pointer select-none transition-colors',
                  f.isRush ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-white/10 text-gray-500')}>
                  <input type="checkbox" className="sr-only" checked={f.isRush} onChange={e => set('isRush', e.target.checked)} />
                  <Zap className="h-4 w-4" /> Rush job
                </span>
              </label>
              <div className="col-span-2 sm:col-span-4">
                <label className="form-label">Description</label>
                <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Kente kaba and slit for engagement" className="form-input" />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className="form-label">Style notes</label>
                <textarea value={f.styleNotes} onChange={e => set('styleNotes', e.target.value)} rows={3} className="form-input h-auto py-2" placeholder="Neckline, sleeves, lining, buttons, anything the tailor needs to know" />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className="form-label">Style photos</label>
                <ImageUpload value={f.styleImages} onChange={v => set('styleImages', v)} folder="orders" label="Add style" />
              </div>
            </div>
          </section>

          {/* Fabric and measurements */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold">Fabric and measurements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Fabric</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['client', 'shop'] as const).map(src => (
                    <button type="button" key={src} onClick={() => set('fabricSource', src)}
                      className={cn('h-9 rounded-xl border text-sm font-semibold transition-colors',
                        f.fabricSource === src ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 dark:border-white/10 text-gray-500')}>
                      {src === 'client' ? 'Client brought' : 'We supply'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Fabric notes</label>
                <input value={f.fabricNotes} onChange={e => set('fabricNotes', e.target.value)} className="form-input" placeholder="e.g. 6 yards Woodin, blue and gold" />
              </div>
              {(editing || clientMode === 'existing') && (
                <div className="sm:col-span-2">
                  <label className="form-label flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" /> Measurements</label>
                  {loadingMeas ? (
                    <div className="h-9 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                  ) : measurements.length ? (
                    <select value={f.measurementId} onChange={e => set('measurementId', e.target.value)} className="form-input">
                      <option value="">None attached</option>
                      {measurements.map(m => <option key={m.id} value={m.id}>{m.label} · taken {new Date(m.takenAt + 'T12:00:00Z').toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500 rounded-xl bg-gray-50 dark:bg-white/5 px-3 py-2.5">
                      {clientId || editing ? 'No measurements saved for this client yet. Add them from the client page and attach them here later.' : 'Choose a client first.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Dates and team */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold">Dates and team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="form-label">Ready by</label><input type="date" required value={f.dueDate} onChange={e => set('dueDate', e.target.value)} className="form-input" /></div>
              <div><label className="form-label">Fitting date</label><input type="date" value={f.fittingDate} onChange={e => set('fittingDate', e.target.value)} className="form-input" /></div>
              <div>
                <label className="form-label">Assigned to</label>
                <select value={f.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="form-input">
                  <option value="">Not assigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Money */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold">Price and payment</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="form-label">Price (GHS)</label><input type="number" min={0} step="0.01" required value={f.price} onChange={e => set('price', e.target.value as any)} className="form-input" /></div>
              <div><label className="form-label">Discount</label><input type="number" min={0} step="0.01" value={f.discount} onChange={e => set('discount', e.target.value as any)} className="form-input" /></div>
              {!editing && (
                <>
                  <div><label className="form-label">Deposit paid</label><input type="number" min={0} step="0.01" value={f.depositAmount} onChange={e => set('depositAmount', e.target.value as any)} className="form-input" /></div>
                  <div>
                    <label className="form-label">Paid by</label>
                    <select value={f.depositMethod} onChange={e => set('depositMethod', e.target.value as PaymentMethod)} className="form-input">
                      <option value="momo">Mobile Money</option><option value="cash">Cash</option>
                      <option value="bank_transfer">Bank transfer</option><option value="card">Card</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm">
              <span className="text-gray-500">Total {formatCurrency(total)}</span>
              <span className="font-bold">Balance {formatCurrency(balance)}</span>
            </div>
          </section>

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-2.5">{error}</p>}
        </form>

        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            form="order-form"
            disabled={pending || (!editing && clientMode === 'existing' && !clientId)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Create order'}
          </button>
        </div>
      </div>
    </div>
  )
}
