'use client'
import { useState, useTransition } from 'react'
import { X, Plus, Loader2, Check, Trash2 } from 'lucide-react'
import { saveMeasurement } from '@/lib/actions/measurements'
import { fieldsFor } from '@/lib/fashion/measurements'
import { todayISO } from '@/lib/fashion/status'
import { cn } from '@/lib/utils'
import type { Measurement, MeasurementUnit } from '@/lib/types'

type Props = {
  clientId: string
  clientName: string
  defaultGender: 'female' | 'male'
  defaultUnit: MeasurementUnit
  existing?: Measurement          // edit
  copyFrom?: Measurement          // start a new set from an older one
  onClose: () => void
  onSaved: (m: Measurement) => void
}

export function MeasurementForm({ clientId, clientName, defaultGender, defaultUnit, existing, copyFrom, onClose, onSaved }: Props) {
  const base = existing ?? copyFrom
  const [gender, setGender] = useState<'female' | 'male'>(base?.gender ?? defaultGender)
  const [unit, setUnit]     = useState<MeasurementUnit>(base?.unit ?? defaultUnit)
  const [label, setLabel]   = useState(existing?.label ?? (copyFrom ? `${copyFrom.label} (updated)` : 'Standard'))
  const [takenAt, setTakenAt] = useState(existing?.takenAt ?? todayISO())
  const [notes, setNotes]   = useState(base?.notes ?? '')
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(base?.values ?? {}).map(([k, v]) => [k, String(v)]))
  )
  const [custom, setCustom] = useState<{ name: string; value: string }[]>(
    (base?.custom ?? []).map(c => ({ name: c.name, value: String(c.value) }))
  )
  const [error, setError]   = useState<string | null>(null)
  const [pending, start]    = useTransition()

  const filled = Object.values(values).filter(v => Number(v) > 0).length + custom.filter(c => c.name && Number(c.value) > 0).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (filled === 0) { setError('Enter at least one measurement'); return }
    const numeric = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, Number(v)]).filter(([, v]) => (v as number) > 0)
    ) as Record<string, number>
    start(async () => {
      try {
        const saved = await saveMeasurement({
          clientId, label: label.trim() || 'Standard', gender, unit, values: numeric,
          custom: custom.filter(c => c.name.trim() && Number(c.value) > 0).map(c => ({ name: c.name.trim(), value: Number(c.value) })),
          notes: notes || null, takenAt,
        }, existing?.id)
        onSaved(saved)
      } catch (err: any) {
        setError(err?.message?.replace(/^.*?Error: /, '') ?? 'Could not save')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-3xl max-h-[94vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold">{existing ? 'Edit measurements' : 'Take measurements'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{clientName} · fill in only what you measured</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 p-0 justify-center" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <form id="measure-form" onSubmit={submit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="form-label">Name this set</label>
              <input value={label} onChange={e => setLabel(e.target.value)} className="form-input" placeholder="e.g. Standard, Wedding, After pregnancy" />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="form-label">Date taken</label>
              <input type="date" value={takenAt} onChange={e => setTakenAt(e.target.value)} className="form-input" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Body</label>
              <div className="grid grid-cols-2 gap-2">
                {(['female', 'male'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={cn('h-9 rounded-xl border text-sm font-semibold', gender === g ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 dark:border-white/10 text-gray-500')}>
                    {g === 'female' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="form-label">Unit</label>
              <div className="grid grid-cols-2 gap-2">
                {(['in', 'cm'] as const).map(u => (
                  <button key={u} type="button" onClick={() => setUnit(u)}
                    className={cn('h-9 rounded-xl border text-sm font-semibold', unit === u ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 dark:border-white/10 text-gray-500')}>
                    {u === 'in' ? 'Inches' : 'Centimetres'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {fieldsFor(gender).map(group => (
            <section key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{group.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {group.fields.map(fd => (
                  <div key={fd.key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate" title={fd.hint ?? fd.label}>
                      {fd.label}{fd.hint && <span className="text-gray-400 font-normal"> · {fd.hint}</span>}
                    </label>
                    <div className="relative">
                      <input
                        inputMode="decimal" type="number" step="0.25" min={0}
                        value={values[fd.key] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [fd.key]: e.target.value }))}
                        className="form-input pr-9 tabular-nums"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Extra measurements</h3>
            <div className="space-y-2">
              {custom.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input value={c.name} onChange={e => setCustom(cs => cs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. Back width" className="form-input flex-1" />
                  <input inputMode="decimal" type="number" step="0.25" min={0} value={c.value} onChange={e => setCustom(cs => cs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="form-input w-28" />
                  <button type="button" onClick={() => setCustom(cs => cs.filter((_, j) => j !== i))} className="btn-ghost h-9 w-9 p-0 justify-center text-gray-400" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setCustom(cs => [...cs, { name: '', value: '' }])} className="btn-ghost text-indigo-600 -ml-3"><Plus className="h-4 w-4" /> Add a measurement</button>
            </div>
          </section>

          <div>
            <label className="form-label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="form-input h-auto py-2" placeholder="Posture, preferred fit, anything to remember" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-2.5">{error}</p>}
        </form>

        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-white/10">
          <span className="text-xs text-gray-500">{filled} measurement{filled === 1 ? '' : 's'}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" form="measure-form" disabled={pending} className="btn-primary">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
