'use client'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Loader2, X, Check, Users, ChevronRight } from 'lucide-react'
import { createClient, type ClientWithStats } from '@/lib/actions/clients'
import { formatCurrency, getInitials, cn } from '@/lib/utils'

type Sort = 'name' | 'recent' | 'owed'

export function ClientsView({ clients }: { clients: ClientWithStats[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<Sort>('name')
  const [owingOnly, setOwingOnly] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]     = useState({ name: '', phone: '', gender: '' as '' | 'female' | 'male', address: '', notes: '' })
  const [error, setError]   = useState<string | null>(null)
  const [pending, start]    = useTransition()

  const totalOwed = clients.reduce((s, c) => s + c.balanceOwed, 0)

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clients
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      .filter(c => !owingOnly || c.balanceOwed > 0)
      .sort((a, b) =>
        sort === 'owed'   ? b.balanceOwed - a.balanceOwed :
        sort === 'recent' ? (b.lastVisitAt ?? b.createdAt).localeCompare(a.lastVisitAt ?? a.createdAt) :
        a.name.localeCompare(b.name))
  }, [clients, search, sort, owingOnly])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const c = await createClient(form)
        router.push(`/clients/${c.id}?measure=1`)
      } catch (err: any) {
        setError(err?.message?.includes('phone') ? 'Check the phone number' : 'Could not save the client')
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} clients{totalOwed > 0 && <> · {formatCurrency(totalOwed)} owed on open orders</>}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add client</button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone" className="form-input pl-9" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="form-input w-auto">
          <option value="name">A to Z</option><option value="recent">Most recent</option><option value="owed">Most owed</option>
        </select>
        <button onClick={() => setOwingOnly(v => !v)}
          className={cn('h-9 px-3.5 rounded-xl text-xs font-semibold border', owingOnly ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40' : 'border-gray-200 dark:border-white/10 text-gray-500')}>
          Owing only
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="card py-16 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold">{clients.length ? 'No clients match' : 'No clients yet'}</p>
          <p className="text-sm text-gray-500 mt-1">{clients.length ? 'Try a different search.' : 'Add a client, take their measurements, and they are ready for every future order.'}</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
          {visible.map(c => (
            <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <div className="text-right text-xs hidden sm:block">
                <p className="text-gray-700 dark:text-gray-300 font-medium">{c.orderCount} order{c.orderCount === 1 ? '' : 's'}</p>
                {c.openOrders > 0 && <p className="text-gray-500">{c.openOrders} in progress</p>}
              </div>
              <div className="w-24 text-right">
                {c.balanceOwed > 0
                  ? <span className="text-sm font-semibold text-amber-600">{formatCurrency(c.balanceOwed)}</span>
                  : <span className="text-xs text-gray-400">Nothing owed</span>}
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold">New client</h2>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost h-8 w-8 p-0 justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div><label className="form-label">Full name</label><input autoFocus required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Akosua Mensah" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Phone</label><input required inputMode="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="024 123 4567" /></div>
              <div>
                <label className="form-label">Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))} className="form-input">
                  <option value="">Not set</option><option value="female">Female</option><option value="male">Male</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Address or area</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" placeholder="e.g. Anaji, Takoradi" /></div>
            <div><label className="form-label">Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="form-input" /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save and measure</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
