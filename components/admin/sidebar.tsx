'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, ExternalLink } from 'lucide-react'

const NAV = [
  { href: '/admin',         label: 'Overview',  icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants',   icon: Users           },
]

export function AdminSidebar() {
  const pathname = usePathname()

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    window.location.href = '/admin-login'
  }

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shrink-0">
          <span className="text-gray-900 font-bold text-xs">G</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-none">StitchDesk</p>
          <p className="text-xs text-red-400 font-semibold mt-0.5">ADMIN</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-0.5">
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Open App
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
