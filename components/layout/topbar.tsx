'use client'
import { useEffect, useState, useCallback } from 'react'
import { Bell, Plus, ExternalLink, Search, Menu } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LocationSwitcher } from '@/components/layout/location-switcher'
import { PushNotificationButton } from '@/components/push-notifications'

type Notification = {
  id: string; title: string; body: string; read: boolean
  createdAt: string; link?: string; type: string
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function Topbar({ userName }: { userName: string }) {
  const [notifOpen, setNotifOpen]   = useState(false)
  const [notifications, setNotifs]  = useState<Notification[]>([])

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifs(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  const unread = notifications.filter(n => !n.read).length

  async function handleOpen() {
    setNotifOpen(true)
    if (unread > 0) {
      await fetch('/api/notifications', { method: 'POST' })
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5 gap-4">
      <button
        onClick={() => window.dispatchEvent(new Event('stitchdesk:open-nav'))}
        className="lg:hidden h-9 w-9 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="StitchDesk" className="sm:hidden h-6 w-auto dark:brightness-0 dark:invert" />

      {/* Search */}
      <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 h-9 px-4 bg-gray-100 dark:bg-white/5 rounded-full">
        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search orders or clients..."
          onKeyDown={e => {
            const q = (e.target as HTMLInputElement).value.trim()
            if (e.key === 'Enter' && q) window.location.href = `/orders?q=${encodeURIComponent(q)}`
          }}
          className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <LocationSwitcher />
        <PushNotificationButton />

        {/* Quick actions */}
        <Link href="/orders?new=1"
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-full transition-all shadow-sm shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> New order
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleOpen}
            className="relative h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
                  {notifications.length > 0 && (
                    <Link href="/orders" onClick={() => setNotifOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">View all</Link>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={cn('px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer', !n.read && 'bg-blue-50/40 dark:bg-blue-900/20')}
                        onClick={() => { setNotifOpen(false); if (n.link) window.location.href = n.link }}
                      >
                        <div className="flex gap-2.5">
                          {!n.read && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                          <div className={cn(!n.read ? '' : 'pl-4')}>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {n.link && <ExternalLink className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30 ring-2 ring-white/10">
          {userName ? getInitials(userName) : '…'}
        </div>
      </div>
    </header>
  )
}
