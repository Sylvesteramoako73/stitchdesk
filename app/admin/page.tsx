'use client'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

type Overview = {
  mrr:            number
  activeCount:    number
  trialingCount:  number
  pastDueCount:   number
  cancelledCount: number
  totalTenants:   number
  newThisMonth:   number
  signupGrowth:   number
  conversionRate: number
  planBreakdown:  Record<string, { count: number; mrr: number }>
  recentSignups:  { name: string; plan: string; status: string; createdAt: string }[]
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  active:    { label: 'Active',    color: 'text-green-400 bg-green-400/10',  icon: CheckCircle   },
  trialing:  { label: 'Trialing',  color: 'text-amber-400 bg-amber-400/10',  icon: Clock         },
  past_due:  { label: 'Past due',  color: 'text-red-400 bg-red-400/10',      icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-500/10',    icon: XCircle       },
}

const PLAN_PRICE: Record<string, number> = { starter: 150, pro: 350, enterprise: 700 }

function KPI({ label, value, sub, up }: { label: string; value: string | number; sub?: string; up?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub !== undefined && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${up === true ? 'text-green-400' : up === false ? 'text-red-400' : 'text-gray-500'}`}>
          {up === true  && <TrendingUp  className="h-3 w-3" />}
          {up === false && <TrendingDown className="h-3 w-3" />}
          {sub}
        </p>
      )}
    </div>
  )
}

export default function AdminOverviewPage() {
  const [data, setData]     = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/overview')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Monthly Recurring Revenue" value={loading ? '—' : `GHS ${(data?.mrr ?? 0).toLocaleString()}`}
          sub={`${data?.activeCount ?? 0} paying tenants`} />
        <KPI label="Total Tenants"    value={loading ? '—' : (data?.totalTenants ?? 0)}
          sub={`+${data?.newThisMonth ?? 0} this month`} up={(data?.signupGrowth ?? 0) >= 0} />
        <KPI label="New This Month"   value={loading ? '—' : (data?.newThisMonth ?? 0)}
          sub={`${(data?.signupGrowth ?? 0) >= 0 ? '+' : ''}${data?.signupGrowth ?? 0}% vs last month`}
          up={(data?.signupGrowth ?? 0) >= 0} />
        <KPI label="Trial Conversion" value={loading ? '—' : `${data?.conversionRate ?? 0}%`}
          sub={`${data?.activeCount ?? 0} converted`} up={(data?.conversionRate ?? 0) >= 30} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Account Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Active',    count: data?.activeCount    ?? 0, bar: 'bg-green-500' },
              { label: 'Trialing',  count: data?.trialingCount  ?? 0, bar: 'bg-amber-500' },
              { label: 'Past due',  count: data?.pastDueCount   ?? 0, bar: 'bg-red-500'   },
              { label: 'Cancelled', count: data?.cancelledCount ?? 0, bar: 'bg-gray-600'  },
            ].map(s => {
              const total = data?.totalTenants ?? 1
              const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-white font-medium">{loading ? '—' : s.count}
                      <span className="text-gray-600 ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue by plan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Revenue by Plan</h3>
          <div className="space-y-4">
            {['starter', 'pro', 'enterprise'].map(plan => {
              const d     = data?.planBreakdown?.[plan]
              const price = PLAN_PRICE[plan]
              return (
                <div key={plan} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{plan}</p>
                    <p className="text-xs text-gray-500 mt-0.5">GHS {price}/mo · {loading ? '—' : (d?.count ?? 0)} tenants</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">GHS {loading ? '—' : (d?.mrr ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-600">MRR</p>
                  </div>
                </div>
              )
            })}
            <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-300">Total MRR</p>
              <p className="text-xl font-bold text-white">GHS {loading ? '—' : (data?.mrr ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Signups</h3>
          <a href="/admin/tenants" className="text-xs text-gray-500 hover:text-white transition-colors">View all →</a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !(data?.recentSignups?.length) ? (
          <p className="text-center py-12 text-gray-600 text-sm">No signups yet.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {(data.recentSignups ?? []).map((s, i) => {
              const cfg  = STATUS_CFG[s.status] ?? STATUS_CFG.cancelled
              const Icon = cfg.icon
              return (
                <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                      {(s.name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.createdAt?.split('T')[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 capitalize">{s.plan}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
