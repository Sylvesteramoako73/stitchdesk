'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, UserCheck, Settings, X, LogOut,
  Receipt, MapPin, Sun, Moon, GraduationCap, ClipboardList, Shirt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'
import type { Role } from '@/lib/actions/users'

type NavItem = { href: string; label: string; icon: any; roles: Role[] }

const nav: NavItem[] = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard, roles: ['owner', 'manager', 'staff'] },
  { href: '/orders',      label: 'Orders',      icon: ClipboardList,   roles: ['owner', 'manager', 'staff'] },
  { href: '/clients',     label: 'Clients',     icon: Users,           roles: ['owner', 'manager', 'staff'] },
  { href: '/catalogue',   label: 'Styles and prices', icon: Shirt,     roles: ['owner', 'manager', 'staff'] },
  { href: '/staff',       label: 'Staff',       icon: UserCheck,       roles: ['owner', 'manager'] },
  { href: '/apprentices', label: 'Apprentices', icon: GraduationCap,   roles: ['owner', 'manager', 'staff'] },
  { href: '/expenses',    label: 'Expenses',    icon: Receipt,         roles: ['owner', 'manager'] },
  { href: '/locations',   label: 'Branches',    icon: MapPin,          roles: ['owner'] },
  { href: '/settings',    label: 'Settings',    icon: Settings,        roles: ['owner'] },
]

const NAV_GROUPS = [
  { label: null,      hrefs: ['/', '/orders', '/clients', '/catalogue'] },
  { label: 'Team',    hrefs: ['/staff', '/apprentices'] },
  { label: 'Finance', hrefs: ['/expenses'] },
  { label: 'Account', hrefs: ['/locations', '/settings'] },
]

const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', manager: 'Manager', staff: 'Staff' }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface SidebarProps {
  user: { uid: string; name: string; email: string | null; role: Role }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useTheme()
  const [open, setOpen]         = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // The menu button lives in the top bar on small screens
  useEffect(() => {
    const openNav = () => setOpen(true)
    window.addEventListener('stitchdesk:open-nav', openNav)
    return () => window.removeEventListener('stitchdesk:open-nav', openNav)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/login')
  }

  const visibleNav = nav.filter(item => item.roles.includes(user.role))

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    const Icon   = item.icon
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
          active
            ? 'bg-indigo-500/10 text-indigo-300'
            : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] bg-indigo-400 rounded-r-full" />
        )}
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="StitchDesk"
            width={153}
            height={36}
            className="h-9 w-auto object-contain brightness-0 invert"
            priority
          />
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-500 hover:text-gray-200 cursor-pointer transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.hrefs
            .map(h => visibleNav.find(n => n.href === h))
            .filter(Boolean) as NavItem[]
          if (items.length === 0) return null
          return (
            <div key={gi} className={gi > 0 ? 'pt-4' : ''}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(item => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
            {user ? getInitials(user.name) : '…'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-200 truncate">{user?.name ?? '…'}</p>
            <p className="text-[11px] text-gray-600">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-[220px] z-50',
        'transition-transform duration-200 -translate-x-full lg:translate-x-0',
        open && 'translate-x-0'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
