// Server only helper for the public order tracking page.
// Not a server action: it is only imported by a server component.
import { adminDb } from '@/lib/firebase-admin'
import type { OrderStatus, OrderStatusEvent } from '@/lib/types'

export type PublicOrder = {
  orderNumber: string
  clientFirstName: string
  title: string
  garmentType: string
  quantity: number
  status: OrderStatus
  statusHistory: OrderStatusEvent[]
  dueDate: string
  fittingDate: string | null
  total: number
  amountPaid: number
  balance: number
  shop: { name: string; phone: string; whatsapp: string; address: string }
}

export async function getPublicOrder(token: string): Promise<PublicOrder | null> {
  if (!token || token.length < 10 || token.length > 40 || !/^[A-Za-z0-9_-]+$/.test(token)) return null
  const snap = await adminDb.collection('orders').where('trackingToken', '==', token).limit(1).get()
  if (snap.empty) return null
  const o = snap.docs[0].data()
  const s = (await adminDb.collection('settings').doc(o.tenantId).get()).data() ?? {}
  return {
    orderNumber:     o.orderNumber,
    clientFirstName: String(o.clientName ?? '').trim().split(/\s+/)[0] ?? '',
    title:           o.title,
    garmentType:     o.garmentType,
    quantity:        o.quantity ?? 1,
    status:          o.status,
    statusHistory:   (o.statusHistory ?? []).map((e: any) => ({ status: e.status, at: e.at, by: '' })),
    dueDate:         o.dueDate,
    fittingDate:     o.fittingDate ?? null,
    total:           (o.price ?? 0) - (o.discount ?? 0),
    amountPaid:      o.amountPaid ?? 0,
    balance:         o.balance ?? 0,
    shop: {
      name:     s.salonName ?? 'Your designer',
      phone:    s.phone ?? '',
      whatsapp: s.whatsappNumber ?? s.phone ?? '',
      address:  s.address ?? '',
    },
  }
}
