'use client'

import { useEffect } from 'react'

type Gtag = (...args: unknown[]) => void

/** Sends GA4 events for clicks into the app: begin_trial for sign up links, login for sign in. No personal data is sent. */
export function LinkTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href*="app.stitchdeskapp.online"]') as HTMLAnchorElement | null
      if (!link) return
      const gtag = (window as unknown as { gtag?: Gtag }).gtag
      if (typeof gtag !== 'function') return
      const params = {
        link_text: (link.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
        page_path: window.location.pathname,
      }
      if (link.href.includes('/signup')) gtag('event', 'begin_trial', params)
      else if (link.href.includes('/login')) gtag('event', 'login_click', params)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
