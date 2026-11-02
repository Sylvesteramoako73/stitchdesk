'use client'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter, RefreshCw, Trash2 } from 'lucide-react'

type Tenant = {
  id:                 string
  name:               string
  salonName:          string
  ownerEmail:         string | null
  ownerName:          string | null
  phone:              string | null
  whatsappNumber:     string | null
  plan:               string
  subscriptionStatus: string
  trialEndsAt:        string
  createdAt:          string
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  active:    { label: 'Active',    bg: 'bg-green-400/10',  text: 'text-green-400',  icon: CheckCircle   },
  trialing:  { label: 'Trialing',  bg: 'bg-amber-400/10',  text: 'text-amber-400',  icon: Clock         },
  past_due:  { label: 'Past due',  bg: 'bg-red-400/10',    text: 'text-red-400',    icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-500/10',   text: 'text-gray-500',   icon: XCircle       },
}

const PLAN_PRICE: Record<string, number> = { starter: 150, pro: 350, enterprise: 700 }

export default function TenantsPage() {
  const [tenants, setTenants]   = useState<Tenant[]>([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/tenants')
    if (res.ok) {
      const { tenants } = await res.json()
      setTenants(tenants ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: string, extra?: Record<string, string>) {
    setActing(id)
    await fetch(`/api/admin/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionStatus: status, ...extra }),
    })
    await load()
    setActing(null)
  }

  async function extendTrial(t: Tenant) {
    const base = new Date(t.trialEndsAt) > new Date() ? new Date(t.trialEndsAt) : new Date()
    base.setDate(base.getDate() + 14)
    await setStatus(t.id, 'trialing', { trialEndsAt: base.toISOString().split('T')[0] })
  }

  async function deleteTenant(t: Tenant) {
    const confirmed = window.confirm(
      `Permanently delete "${t.salonName || t.name}"?\n\nThis will remove all their data, staff, orders, and login account. This cannot be undone.`
    )
    if (!confirmed) return
    setActing(t.id)
    await fetch(`/api/admin/tenants/${t.id}`, { method: 'DELETE' })
    await load()
    setActing(null)
  }

  const now      = new Date()
  const filtered = tenants.filter(t => {
    const matchStatus = statusFilter === 'all' || t.subscriptionStatus === statusFilter
    const q           = search.toLowerCase()
    const matchSearch = !q ||
      (t.salonName      ?? '').toLowerCase().includes(q) ||
      (t.ownerEmail     ?? '').toLowerCase().includes(q) ||
      (t.ownerName      ?? '').toLowerCase().includes(q) ||
      (t.phone          ?? '').includes(q) ||
      (t.whatsappNumber ?? '').includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tenants.length} registered businesses</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search business or owner"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-500"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 bg-gray-900 border border-gray-700 rounded-lg">
          <Filter className="h-3.5 w-3.5" /> {filtered.length} shown
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading tenants…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-24 text-gray-600 text-sm">
            {search || statusFilter !== 'all' ? 'No tenants match your filter.' : 'No tenants yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Business</th>
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Owner</th>
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Plan</th>
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Trial / MRR</th>
                  <th className="text-left px-6 py-3.5 text-xs text-gray-600 uppercase tracking-wider font-medium">Joined</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map(t => {
                  const daysLeft  = Math.ceil((new Date(t.trialEndsAt).getTime() - now.getTime()) / 86400000)
                  const mrr       = t.subscriptionStatus === 'active' ? (PLAN_PRICE[t.plan] ?? 0) : 0
                  const cfg       = STATUS_CFG[t.subscriptionStatus] ?? STATUS_CFG.cancelled
                  const Icon      = cfg.icon
                  return (
                    <tr key={t.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{t.salonName || t.name}</p>
                        <p className="text-xs text-gray-600 font-mono mt-0.5">{t.id.slice(0, 10)}…</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">{t.ownerName ?? '—'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{t.ownerEmail ?? '—'}</p>
                        {t.phone && (
                          <p className="text-xs text-gray-500 mt-0.5">📞 {t.phone}</p>
                        )}
                        {t.whatsappNumber && (
                          <p className="text-xs text-gray-500 mt-0.5">💬 {t.whatsappNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-400 text-sm">{t.plan}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {t.subscriptionStatus === 'trialing' ? (
                          <span className={`text-sm font-medium ${daysLeft > 3 ? 'text-amber-400' : daysLeft > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                          </span>
                        ) : mrr > 0 ? (
                          <span className="text-sm font-medium text-green-400">GHS {mrr}/mo</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {t.createdAt?.split('T')[0] ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        {acting === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.subscriptionStatus !== 'active' && (
                              <button onClick={() => setStatus(t.id, 'active')}
                                className="px-2.5 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
                                Activate
                              </button>
                            )}
                            <button onClick={() => extendTrial(t)}
                              className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors">
                              +14d trial
                            </button>
                            {t.subscriptionStatus !== 'cancelled' && (
                              <button onClick={() => setStatus(t.id, 'cancelled')}
                                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-red-700 text-gray-400 hover:text-white rounded-lg transition-colors">
                                Suspend
                              </button>
                            )}
                            <button onClick={() => deleteTenant(t)}
                              title="Delete account permanently"
                              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
