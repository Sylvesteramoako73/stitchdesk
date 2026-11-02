import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendMessage } from '@/lib/services/messaging'
import { fittingReminderMessage } from '@/lib/fashion/messages'
import { todayISO, addDaysISO, OPEN_STATUSES } from '@/lib/fashion/status'

// Runs once a day (see vercel.json). Protected with: Authorization: Bearer <CRON_SECRET>
//  1. Sends fitting reminders for tomorrow's fittings, for businesses that switched on automatic messages
//  2. Drops an in app notification for orders due tomorrow and orders that just became overdue
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today    = todayISO()
  const tomorrow = addDaysISO(today, 1)
  const yesterday = addDaysISO(today, -1)
  const summary  = { reminders: 0, failed: 0, notifications: 0 }

  const [fittingSnap, dueSnap, overdueSnap] = await Promise.all([
    adminDb.collection('orders').where('fittingDate', '==', tomorrow).get(),
    adminDb.collection('orders').where('dueDate', '==', tomorrow).get(),
    adminDb.collection('orders').where('dueDate', '==', yesterday).get(),
  ])

  const settingsCache = new Map<string, FirebaseFirestore.DocumentData>()
  async function settingsFor(tenantId: string) {
    if (!settingsCache.has(tenantId)) {
      settingsCache.set(tenantId, (await adminDb.collection('settings').doc(tenantId).get()).data() ?? {})
    }
    return settingsCache.get(tenantId)!
  }

  // 1. Fitting reminders
  for (const d of fittingSnap.docs) {
    const o = d.data()
    if (!OPEN_STATUSES.includes(o.status) || o.fittingReminderSentFor === tomorrow) continue
    const s = await settingsFor(o.tenantId)
    const channel = s.autoMessages as 'sms' | 'whatsapp' | 'off' | undefined
    if (!channel || channel === 'off' || !o.clientPhone) continue
    const text = fittingReminderMessage(o as any, { salonName: s.salonName ?? 'our shop', phone: s.phone })
    const res  = await sendMessage(channel, o.clientPhone, text)
    if (res.success) {
      summary.reminders++
      await d.ref.update({ fittingReminderSentFor: tomorrow })
    } else summary.failed++
  }

  // 2. In app notifications for the team
  const batch = adminDb.batch()
  const now = new Date().toISOString()
  for (const d of dueSnap.docs) {
    const o = d.data()
    if (!OPEN_STATUSES.includes(o.status)) continue
    batch.set(adminDb.collection('notifications').doc(), {
      tenantId: o.tenantId, type: 'status_change', read: false, createdAt: now,
      title: `Due tomorrow: ${o.orderNumber}`, body: `${o.clientName} · ${o.title}`, link: `/orders/${d.id}`,
    })
    summary.notifications++
  }
  for (const d of overdueSnap.docs) {
    const o = d.data()
    if (!OPEN_STATUSES.includes(o.status)) continue
    batch.set(adminDb.collection('notifications').doc(), {
      tenantId: o.tenantId, type: 'status_change', read: false, createdAt: now,
      title: `Overdue: ${o.orderNumber}`, body: `${o.clientName} · ${o.title} was due yesterday`, link: `/orders/${d.id}`,
    })
    summary.notifications++
  }
  if (summary.notifications) await batch.commit()

  console.log('[CRON]', summary)
  return NextResponse.json(summary)
}
