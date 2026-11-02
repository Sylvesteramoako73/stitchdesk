'use client'
import { useState, useTransition, useEffect } from 'react'
import { Plus, Trash2, Loader2, Download, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { createExpense, deleteExpense, getExpenses, getPLReport } from '@/lib/actions/expenses'
import { formatCurrency, cn } from '@/lib/utils'
import type { Expense, ExpenseCategory } from '@/lib/actions/expenses'
import type { Location } from '@/lib/actions/locations'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent',        label: 'Rent & Premises' },
  { value: 'fabric',      label: 'Fabric' },
  { value: 'supplies',    label: 'Threads, lining and notions' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'wages',       label: 'Wages & Salaries' },
  { value: 'equipment',   label: 'Equipment' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other',       label: 'Other' },
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent:        'bg-purple-100 text-purple-700',
  fabric:      'bg-pink-100 text-pink-700',
  supplies:    'bg-blue-100 text-blue-700',
  utilities:   'bg-yellow-100 text-yellow-700',
  wages:       'bg-green-100 text-green-700',
  equipment:   'bg-orange-100 text-orange-700',
  marketing:   'bg-pink-100 text-pink-700',
  maintenance: 'bg-gray-100 text-gray-700',
  other:       'bg-gray-100 text-gray-600',
}

const EMPTY_FORM = {
  category: 'fabric' as ExpenseCategory,
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  locationId: '',
}

function exportCSV(expenses: Expense[]) {
  const rows = [
    ['Date', 'Category', 'Description', 'Amount'],
    ...expenses.map(e => [e.date, CATEGORIES.find(c => c.value === e.category)?.label ?? e.category, e.description, e.amount]),
  ]
  const csv  = rows.map(r => r.map(String).map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click()
  URL.revokeObjectURL(url)
}

export function ExpensesView({ expenses: initial, currentMonth, locations }: { expenses: Expense[]; currentMonth: string; locations: Location[] }) {
  const [tab, setTab]           = useState<'expenses' | 'pl'>('expenses')
  const [expenses, setExpenses] = useState(initial)
  const [month, setMonth]       = useState(currentMonth)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [, startTransition]     = useTransition()

  const total       = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory  = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc }, {} as Record<string, number>)
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  async function handleMonthChange(m: string) {
    setMonth(m)
    startTransition(async () => {
      const data = await getExpenses({ month: m })
      setExpenses(data)
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const created = await createExpense({ ...form, amount: Number(form.amount), locationId: form.locationId || null })
    setExpenses(prev => [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Fabric, rent, wages and everything else the workshop spends</p>
        </div>
        {tab === 'expenses' && (
          <div className="flex gap-2">
            <button onClick={() => exportCSV(expenses)} className="btn-secondary">
              <Download className="h-5 w-5" /> Export
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-5 w-5" /> Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('expenses')}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'expenses' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
        >
          <Download className="h-4 w-4" /> Expenses
        </button>
        <button
          onClick={() => setTab('pl')}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'pl' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
        >
          <BarChart3 className="h-4 w-4" /> P&amp;L Report
        </button>
      </div>

      {tab === 'pl' && <PLReport month={month} onMonthChange={handleMonthChange} />}

      {tab === 'expenses' && (
      <div className="space-y-5">
      {/* Month picker */}
      <div>
        <input
          type="month"
          value={month}
          onChange={e => handleMonthChange(e.target.value)}
          className="form-input w-44"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-box">
          <p className="text-xs text-gray-500 mb-2">Total This Month</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(total)}</p>
        </div>
        <div className="stat-box">
          <p className="text-xs text-gray-500 mb-2">Transactions</p>
          <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
        </div>
        <div className="stat-box">
          <p className="text-xs text-gray-500 mb-2">Top Category</p>
          <p className="text-2xl font-semibold text-gray-900 truncate">
            {topCategory ? CATEGORIES.find(c => c.value === topCategory[0])?.label ?? topCategory[0] : '—'}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Expense</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                className="form-input w-full"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount (₵) *</label>
              <input
                type="number" required min={0} step={0.01}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="form-label">Description *</label>
              <input
                required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly rent payment"
                className="form-input w-full"
              />
            </div>
            {locations.length > 0 && (
              <div>
                <label className="form-label">Branch</label>
                <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))} className="form-input w-full">
                  <option value="">All branches</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date" required value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="form-input w-full"
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Breakdown by Category</h3>
          <div className="space-y-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{CATEGORIES.find(c => c.value === cat)?.label ?? cat}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(amt)} ({Math.round(amt / total * 100)}%)</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 dark:bg-gray-100 rounded-full" style={{ width: `${Math.round(amt / total * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses list */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Description</th>{locations.length > 0 && <th>Branch</th>}<th className="text-right">Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id}>
                <td className="text-gray-500 font-mono text-xs">{exp.date}</td>
                <td>
                  <span className={`badge text-xs ${CATEGORY_COLORS[exp.category]}`}>
                    {CATEGORIES.find(c => c.value === exp.category)?.label ?? exp.category}
                  </span>
                </td>
                <td className="text-gray-700">{exp.description}</td>
                {locations.length > 0 && <td className="text-xs text-gray-500">{exp.locationName ?? '—'}</td>}
                <td className="text-right font-semibold text-gray-900">{formatCurrency(exp.amount)}</td>
                <td className="text-right">
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="btn-ghost h-8 w-8 p-0 justify-center text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500">No expenses recorded for this month.</div>
        )}
      </div>
      </div>
      )}
    </div>
  )
}

// ─── P&L Report component ──────────────────────────────────────────────────

type PLData = NonNullable<Awaited<ReturnType<typeof getPLReport>>>

function PLReport({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const [data, setData]     = useState<PLData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(m: string) {
    setLoading(true)
    const d = await getPLReport(m)
    setData(d)
    setLoading(false)
  }

  useEffect(() => { load(month) }, [month])

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading P&amp;L…</div>
  if (!data)   return null

  const { totalRevenue, totalExpenses, netProfit, margin, expByCategory, weeks } = data
  const profitColor = netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const ProfitIcon  = netProfit > 0 ? TrendingUp : netProfit < 0 ? TrendingDown : Minus

  return (
    <div className="space-y-5">
      {/* Month picker */}
      <input type="month" value={month} onChange={e => onMonthChange(e.target.value)} className="form-input w-44" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Revenue',   value: formatCurrency(totalRevenue),  color: 'text-indigo-600 dark:text-indigo-400', sub: `${data.aptCount} paid apts` },
          { label: 'Expenses',  value: formatCurrency(totalExpenses), color: 'text-red-500 dark:text-red-400',   sub: `${data.expCount} entries` },
          { label: 'Net Profit',value: formatCurrency(netProfit),     color: profitColor,                        sub: `${margin}% margin` },
          { label: 'Margin',    value: `${margin}%`,                  color: profitColor,                        sub: netProfit >= 0 ? 'Profitable' : 'Loss' },
        ].map(s => (
          <div key={s.label} className="stat-box">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* P&L statement */}
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" /> Profit &amp; Loss Statement
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 font-medium text-indigo-700 dark:text-indigo-400">
            <span>Total Revenue</span><span>{formatCurrency(totalRevenue)}</span>
          </div>
          {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between text-gray-600 dark:text-gray-400 pl-4">
              <span>{CATEGORIES.find(c => c.value === cat)?.label ?? cat}</span>
              <span className="text-red-500">({formatCurrency(amt)})</span>
            </div>
          ))}
          <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 font-medium text-red-600 dark:text-red-400">
            <span>Total Expenses</span><span>({formatCurrency(totalExpenses)})</span>
          </div>
          <div className={cn('flex justify-between py-2 border-t-2 border-gray-300 dark:border-gray-600 font-bold text-base', profitColor)}>
            <span className="flex items-center gap-1"><ProfitIcon className="h-4 w-4" /> Net Profit</span>
            <span>{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Weekly chart (bar) */}
      {weeks.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-4">Weekly Breakdown</h3>
          <div className="flex items-end gap-2 h-32">
            {weeks.map(w => {
              const max    = Math.max(...weeks.map(x => Math.max(x.revenue, x.expenses)), 1)
              const revH   = Math.round((w.revenue  / max) * 100)
              const expH   = Math.round((w.expenses / max) * 100)
              return (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-28">
                    <div className="flex-1 bg-indigo-400 dark:bg-indigo-500 rounded-t transition-all" style={{ height: `${revH}%` }} title={`Revenue: ${formatCurrency(w.revenue)}`} />
                    <div className="flex-1 bg-red-300 dark:bg-red-500 rounded-t transition-all" style={{ height: `${expH}%` }} title={`Expenses: ${formatCurrency(w.expenses)}`} />
                  </div>
                  <span className="text-[10px] text-gray-400">{w.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-indigo-400" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-300" /> Expenses</span>
          </div>
        </div>
      )}
    </div>
  )
}
