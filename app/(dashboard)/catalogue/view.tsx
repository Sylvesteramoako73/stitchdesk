'use client'
import { useMemo, useState, useTransition } from 'react'
import { Plus, X, Loader2, Check, Shirt, Clock, Trash2, Search } from 'lucide-react'
import { saveCatalogueItem, deleteCatalogueItem } from '@/lib/actions/catalogue'
import { GARMENT_TYPES } from '@/lib/fashion/measurements'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatCurrency, cn } from '@/lib/utils'
import type { CatalogueItem } from '@/lib/types'

const EMPTY = { name: '', category: 'Kaba and slit', description: '', priceFrom: 0, typicalDays: 14, imageUrl: '' }

export function CatalogueView({ items: initial, canEdit }: { items: CatalogueItem[]; canEdit: boolean }) {
  const [items, setItems]   = useState(initial)
  const [editing, setEditing] = useState<CatalogueItem | 'new' | null>(null)
  const [form, setForm]     = useState(EMPTY)
  const [cat, setCat]       = useState('All')
  const [q, setQ]           = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [pending, start]    = useTransition()

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category)))], [items])
  const visible = items.filter(i => (cat === 'All' || i.category === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase())))

  function open(item: CatalogueItem | 'new') {
    setError(null)
    setEditing(item)
    setForm(item === 'new' ? EMPTY : {
      name: item.name, category: item.category, description: item.description ?? '',
      priceFrom: item.priceFrom, typicalDays: item.typicalDays, imageUrl: item.imageUrl ?? '',
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      try {
        const saved = await saveCatalogueItem(
          { ...form, priceFrom: Number(form.priceFrom), typicalDays: Number(form.typicalDays), description: form.description || null, imageUrl: form.imageUrl || null },
          editing !== 'new' && editing ? editing.id : undefined,
        )
        setItems(prev => [...prev.filter(i => i.id !== saved.id), saved].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)))
        setEditing(null)
      } catch (err: any) { setError(err?.message?.replace(/^.*?Error: /, '') ?? 'Could not save') }
    })
  }

  function remove() {
    if (!editing || editing === 'new' || !confirm(`Remove ${editing.name} from your price list?`)) return
    const id = editing.id
    start(async () => {
      await deleteCatalogueItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      setEditing(null)
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Styles and prices</h1>
          <p className="page-subtitle">Your price list. Pick from it when creating an order to fill in price and ready date.</p>
        </div>
        {canEdit && <button onClick={() => open('new')} className="btn-primary"><Plus className="h-4 w-4" /> Add style</button>}
      </div>

      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search styles" className="form-input pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={cn('shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold border',
                  cat === c ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300')}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card py-16 text-center px-6">
          <Shirt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold">Your price list is empty</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Add the styles you sew most, with a starting price and how long they usually take.</p>
          {canEdit && <button onClick={() => open('new')} className="btn-primary mx-auto"><Plus className="h-4 w-4" /> Add your first style</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(i => (
            <button key={i.id} onClick={() => canEdit && open(i)} className={cn('card overflow-hidden text-left', canEdit && 'hover:-translate-y-0.5 transition-transform')}>
              <div className="aspect-[4/5] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 flex items-center justify-center">
                {i.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" />
                  : <Shirt className="h-10 w-10 text-indigo-200 dark:text-indigo-800" />}
              </div>
              <div className="p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{i.category}</p>
                <p className="font-semibold truncate">{i.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">from {formatCurrency(i.priceFrom)}</span>
                  {i.typicalDays > 0 && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{i.typicalDays}d</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-3 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold">{editing === 'new' ? 'Add style' : 'Edit style'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost h-8 w-8 p-0 justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div><label className="form-label">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Off shoulder kaba" /></div>
            <div>
              <label className="form-label">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="form-input">
                {GARMENT_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Price from (GHS)</label><input type="number" min={0} required value={form.priceFrom} onChange={e => setForm(f => ({ ...f, priceFrom: e.target.value as any }))} className="form-input" /></div>
              <div><label className="form-label">Usual days</label><input type="number" min={0} value={form.typicalDays} onChange={e => setForm(f => ({ ...f, typicalDays: e.target.value as any }))} className="form-input" /></div>
            </div>
            <div><label className="form-label">Description</label><textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input h-auto py-2" /></div>
            <div>
              <label className="form-label">Photo</label>
              <ImageUpload value={form.imageUrl ? [form.imageUrl] : []} onChange={v => setForm(f => ({ ...f, imageUrl: v[v.length - 1] ?? '' }))} folder="catalogue" max={1} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3 pt-1">
              {editing !== 'new' && <button type="button" onClick={remove} className="btn-ghost text-gray-400 hover:!text-red-600 hover:!bg-red-50"><Trash2 className="h-4 w-4" /></button>}
              <div className="flex-1" />
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
