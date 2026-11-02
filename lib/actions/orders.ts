'use server'
import { randomBytes, randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminDb, docData } from '@/lib/firebase-admin'
import { getTenantId, requireTenant, getOwnedDoc, getEffectiveLocationId } from '@/lib/auth'
import { OPEN_STATUSES, PIPELINE, todayISO, addDaysISO } from '@/lib/fashion/status'
import type { Order, OrderStatus, OrderPayment, Measurement, PaymentMethod } from '@/lib/types'

const col = () => adminDb.collection('orders')

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
const phone   = z.string().min(7).max(20).regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number')
const method  = z.enum(['cash', 'momo', 'bank_transfer', 'card'])
const STATUSES = ['received', 'cutting', 'sewing', 'fitting', 'finishing', 'ready', 'collected', 'cancelled'] as const

const OrderFields = z.object({
  title:         z.string().min(1).max(120).trim(),
  garmentType:   z.string().min(1).max(60).trim(),
  quantity:      z.number().int().min(1).max(500),
  styleNotes:    z.string().max(2000).nullable().optional(),
  styleImages:   z.array(z.string().url().max(1000)).max(8).optional(),
  fabricSource:  z.enum(['client', 'shop']),
  fabricNotes:   z.string().max(500).nullable().optional(),
  price:         z.number().min(0).max(1_000_000),
  discount:      z.number().min(0).max(1_000_000).optional(),
  isRush:        z.boolean().optional(),
  dueDate:       isoDate,
  fittingDate:   isoDate.nullable().optional().or(z.literal('')),
  assignedTo:    z.string().max(128).nullable().optional().or(z.literal('')),
  measurementId: z.string().max(128).nullable().optional().or(z.literal('')),
})

const CreateOrderSchema = OrderFields.extend({
  clientId:  z.string().max(128).optional().or(z.literal('')),
  newClient: z.object({ name: z.string().min(1).max(100).trim(), phone }).optional(),
  deposit:   z.object({ amount: z.number().min(0).max(1_000_000), method }).optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderInput = z.infer<typeof OrderFields>

function money(n: number) {
  return Math.round(n * 100) / 100
}

function totals(price: number, discount: number, payments: OrderPayment[]) {
  const amountPaid = money(payments.reduce((s, p) => s + p.amount, 0))
  const balance    = money(Math.max(0, price - discount - amountPaid))
  return { amountPaid, balance }
}

function revalidateOrder(id?: string, clientId?: string) {
  revalidatePath('/')
  revalidatePath('/orders')
  if (id) revalidatePath(`/orders/${id}`)
  if (clientId) revalidatePath(`/clients/${clientId}`)
}

async function nextOrderNumber(tenantId: string): Promise<string> {
  const ref = adminDb.collection('counters').doc(tenantId)
  const seq = await adminDb.runTransaction(async tx => {
    const snap = await tx.get(ref)
    const n    = ((snap.data()?.orderSeq as number) ?? 0) + 1
    tx.set(ref, { orderSeq: n, tenantId }, { merge: true })
    return n
  })
  return `SD-${String(seq).padStart(4, '0')}`
}

async function resolveStaff(tenantId: string, staffId?: string | null) {
  if (!staffId) return { assignedTo: null, assignedName: null }
  const { snap } = await getOwnedDoc('staff', staffId, tenantId)
  return { assignedTo: staffId, assignedName: (snap.data()?.name as string) ?? null }
}

async function resolveMeasurement(tenantId: string, clientId: string, measurementId?: string | null) {
  if (!measurementId) return { measurementId: null, measurement: null }
  const { snap } = await getOwnedDoc('measurements', measurementId, tenantId)
  const m = snap.data() as Measurement
  if (m.clientId !== clientId) throw new Error('That measurement belongs to another client')
  return {
    measurementId,
    measurement: { label: m.label, gender: m.gender, unit: m.unit, values: m.values, custom: m.custom ?? [], notes: m.notes ?? null },
  }
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getOrders(opts: { clientId?: string; includeClosed?: boolean } = {}): Promise<Order[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  let q: FirebaseFirestore.Query = col().where('tenantId', '==', tenantId)
  if (opts.clientId) q = q.where('clientId', '==', opts.clientId)
  const snap = await q.get()

  const locationId = opts.clientId ? null : await getEffectiveLocationId()
  return snap.docs
    .map(d => docData(d) as Order)
    .filter(o => !locationId || !o.locationId || o.locationId === locationId)
    .filter(o => opts.includeClosed !== false || OPEN_STATUSES.includes(o.status) || o.status === 'ready')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.orderNumber.localeCompare(b.orderNumber))
}

export async function getOrder(id: string): Promise<Order | null> {
  const tenantId = await getTenantId()
  if (!tenantId) return null
  try {
    const { snap } = await getOwnedDoc('orders', id, tenantId)
    return docData(snap) as Order
  } catch {
    return null
  }
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { user, tenantId } = await requireTenant()
  const data = CreateOrderSchema.parse(input)
  const now  = new Date().toISOString()

  // Client: existing or created on the spot
  let clientId   = data.clientId || ''
  let clientName = ''
  let clientPhone = ''
  if (clientId) {
    const { snap } = await getOwnedDoc('clients', clientId, tenantId)
    clientName  = snap.data()?.name ?? ''
    clientPhone = snap.data()?.phone ?? ''
  } else if (data.newClient) {
    const ref = adminDb.collection('clients').doc()
    await ref.set({
      tenantId, name: data.newClient.name, phone: data.newClient.phone, email: null, gender: null,
      dateOfBirth: null, address: null, notes: null, tags: '', loyaltyPoints: 0, loyaltyTier: 'Bronze',
      totalVisits: 0, totalSpent: 0, preferredStaff: null, lastVisitAt: null, isActive: true,
      createdAt: now, updatedAt: now,
    })
    clientId    = ref.id
    clientName  = data.newClient.name
    clientPhone = data.newClient.phone
  } else {
    throw new Error('Choose a client or add a new one')
  }

  const discount = data.discount ?? 0
  if (discount > data.price) throw new Error('Discount cannot be more than the price')

  const [staff, meas, orderNumber] = await Promise.all([
    resolveStaff(tenantId, data.assignedTo || null),
    resolveMeasurement(tenantId, clientId, data.measurementId || null),
    nextOrderNumber(tenantId),
  ])

  const payments: OrderPayment[] = []
  if (data.deposit && data.deposit.amount > 0) {
    if (data.deposit.amount > data.price - discount) throw new Error('Deposit is more than the order total')
    payments.push({
      id: randomUUID(), amount: money(data.deposit.amount), method: data.deposit.method,
      note: 'Deposit', paidAt: now, recordedBy: user.name,
    })
  }

  const ref = col().doc()
  const doc: Omit<Order, 'id'> & { tenantId: string } = {
    tenantId,
    orderNumber,
    trackingToken: randomBytes(9).toString('base64url'),
    clientId, clientName, clientPhone,
    title:        data.title,
    garmentType:  data.garmentType,
    quantity:     data.quantity,
    styleNotes:   data.styleNotes || null,
    styleImages:  data.styleImages ?? [],
    fabricSource: data.fabricSource,
    fabricNotes:  data.fabricNotes || null,
    price:        money(data.price),
    discount:     money(discount),
    payments,
    ...totals(data.price, discount, payments),
    status:        'received',
    statusHistory: [{ status: 'received', at: now, by: user.name }],
    isRush:        data.isRush ?? false,
    dueDate:       data.dueDate,
    fittingDate:   data.fittingDate || null,
    ...staff,
    ...meas,
    locationId:    (await getEffectiveLocationId()) ?? null,
    collectedAt:   null,
    createdBy:     user.name,
    createdAt:     now,
    updatedAt:     now,
  }
  await ref.set(doc)
  await adminDb.collection('clients').doc(clientId).update({ lastVisitAt: now, updatedAt: now })

  revalidateOrder(ref.id, clientId)
  revalidatePath('/clients')
  const { tenantId: _t, ...order } = doc
  return { id: ref.id, ...order }
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  const { tenantId } = await requireTenant()
  const data = OrderFields.parse(input)
  const { ref, snap } = await getOwnedDoc('orders', id, tenantId)
  const current = snap.data() as Order

  const discount = data.discount ?? 0
  if (discount > data.price) throw new Error('Discount cannot be more than the price')
  if (current.amountPaid > data.price - discount) throw new Error('The client has already paid more than this new total')

  const [staff, meas] = await Promise.all([
    resolveStaff(tenantId, data.assignedTo || null),
    data.measurementId === current.measurementId
      ? { measurementId: current.measurementId, measurement: current.measurement }
      : resolveMeasurement(tenantId, current.clientId, data.measurementId || null),
  ])

  await ref.update({
    title:        data.title,
    garmentType:  data.garmentType,
    quantity:     data.quantity,
    styleNotes:   data.styleNotes || null,
    styleImages:  data.styleImages ?? current.styleImages ?? [],
    fabricSource: data.fabricSource,
    fabricNotes:  data.fabricNotes || null,
    price:        money(data.price),
    discount:     money(discount),
    ...totals(data.price, discount, current.payments ?? []),
    isRush:       data.isRush ?? false,
    dueDate:      data.dueDate,
    fittingDate:  data.fittingDate || null,
    ...staff,
    ...meas,
    updatedAt:    new Date().toISOString(),
  })
  revalidateOrder(id, current.clientId)
  return docData(await ref.get()) as Order
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { user, tenantId } = await requireTenant()
  if (!(STATUSES as readonly string[]).includes(status)) throw new Error('Unknown status')
  const { ref, snap } = await getOwnedDoc('orders', id, tenantId)
  const current = snap.data() as Order
  if (current.status === status) return docData(snap) as Order

  const now = new Date().toISOString()
  await ref.update({
    status,
    statusHistory: [...(current.statusHistory ?? []), { status, at: now, by: user.name }],
    collectedAt:   status === 'collected' ? now : current.collectedAt ?? null,
    updatedAt:     now,
  })

  if (status === 'collected') {
    // Lifetime value on the client record
    const clientRef = adminDb.collection('clients').doc(current.clientId)
    const c = (await clientRef.get()).data()
    if (c?.tenantId === tenantId) {
      await clientRef.update({
        totalVisits: (c.totalVisits ?? 0) + 1,
        totalSpent:  money((c.totalSpent ?? 0) + current.price - (current.discount ?? 0)),
        lastVisitAt: now,
        updatedAt:   now,
      })
    }
  }

  if (status === 'ready') await autoNotifyReady(tenantId, { ...current, id })

  revalidateOrder(id, current.clientId)
  return docData(await ref.get()) as Order
}

export async function recordPayment(id: string, input: { amount: number; method: PaymentMethod; note?: string }): Promise<Order> {
  const { user, tenantId } = await requireTenant()
  const data = z.object({ amount: z.number().positive().max(1_000_000), method, note: z.string().max(200).optional() }).parse(input)
  const { ref, snap } = await getOwnedDoc('orders', id, tenantId)
  const current = snap.data() as Order

  if (money(data.amount) > current.balance) {
    throw new Error(`That is more than the balance of GHS ${current.balance.toFixed(2)}`)
  }
  const payments = [...(current.payments ?? []), {
    id: randomUUID(), amount: money(data.amount), method: data.method,
    note: data.note || null, paidAt: new Date().toISOString(), recordedBy: user.name,
  }]
  await ref.update({ payments, ...totals(current.price, current.discount ?? 0, payments), updatedAt: new Date().toISOString() })
  revalidateOrder(id, current.clientId)
  return docData(await ref.get()) as Order
}

export async function removePayment(id: string, paymentId: string): Promise<Order> {
  const { user, tenantId } = await requireTenant()
  if (user.role === 'staff') throw new Error('Only owners and managers can remove payments')
  const { ref, snap } = await getOwnedDoc('orders', id, tenantId)
  const current  = snap.data() as Order
  const payments = (current.payments ?? []).filter(p => p.id !== paymentId)
  await ref.update({ payments, ...totals(current.price, current.discount ?? 0, payments), updatedAt: new Date().toISOString() })
  revalidateOrder(id, current.clientId)
  return docData(await ref.get()) as Order
}

export async function deleteOrder(id: string) {
  const { user, tenantId } = await requireTenant()
  if (user.role === 'staff') throw new Error('Only owners and managers can delete orders')
  const { ref, snap } = await getOwnedDoc('orders', id, tenantId)
  await ref.delete()
  revalidateOrder(undefined, snap.data()?.clientId)
}

// ─── Automatic "ready" message ────────────────────────────────────────────────

async function autoNotifyReady(tenantId: string, order: Order) {
  try {
    const settings = (await adminDb.collection('settings').doc(tenantId).get()).data() ?? {}
    const channel  = settings.autoMessages as 'sms' | 'whatsapp' | 'off' | undefined
    if (!channel || channel === 'off' || !order.clientPhone) return
    const { readyMessage }  = await import('@/lib/fashion/messages')
    const { sendMessage }   = await import('@/lib/services/messaging')
    const text = readyMessage(order, { salonName: settings.salonName ?? 'our shop', phone: settings.phone })
    await sendMessage(channel, order.clientPhone, text)
  } catch (err) {
    console.error('[orders] ready message failed', err)
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type DashboardData = {
  activeCount: number
  dueThisWeek: number
  overdueCount: number
  readyCount: number
  outstanding: number
  collectedThisMonth: number
  paymentsThisMonth: number
  stageCounts: Record<OrderStatus, number>
  overdue: Order[]
  dueSoon: Order[]
  ready: Order[]
  fittingsSoon: Order[]
  recentPayments: { orderId: string; orderNumber: string; clientName: string; amount: number; method: PaymentMethod; paidAt: string }[]
  totalOrders: number
}

export async function getDashboardData(): Promise<DashboardData> {
  const all   = await getOrders()
  const today = todayISO()
  const week  = addDaysISO(today, 7)
  const monthStart = today.slice(0, 7)

  const open   = all.filter(o => OPEN_STATUSES.includes(o.status))
  const ready  = all.filter(o => o.status === 'ready')
  const stageCounts = Object.fromEntries([...PIPELINE, 'cancelled'].map(s => [s, 0])) as Record<OrderStatus, number>
  for (const o of all) stageCounts[o.status] = (stageCounts[o.status] ?? 0) + 1

  const payments = all.flatMap(o => (o.payments ?? []).map(p => ({
    orderId: o.id, orderNumber: o.orderNumber, clientName: o.clientName, amount: p.amount, method: p.method, paidAt: p.paidAt,
  })))

  return {
    activeCount:  open.length,
    dueThisWeek:  open.filter(o => o.dueDate >= today && o.dueDate <= week).length,
    overdueCount: open.filter(o => o.dueDate < today).length,
    readyCount:   ready.length,
    outstanding:  money([...open, ...ready].reduce((s, o) => s + (o.balance ?? 0), 0)),
    collectedThisMonth: all.filter(o => o.status === 'collected' && (o.collectedAt ?? '').startsWith(monthStart)).length,
    paymentsThisMonth:  money(payments.filter(p => p.paidAt.startsWith(monthStart)).reduce((s, p) => s + p.amount, 0)),
    stageCounts,
    overdue:      open.filter(o => o.dueDate < today).slice(0, 8),
    dueSoon:      open.filter(o => o.dueDate >= today && o.dueDate <= week).slice(0, 8),
    ready:        ready.slice(0, 8),
    fittingsSoon: open.filter(o => o.fittingDate && o.fittingDate >= today && o.fittingDate <= addDaysISO(today, 3))
                      .sort((a, b) => (a.fittingDate ?? '').localeCompare(b.fittingDate ?? '')).slice(0, 6),
    recentPayments: payments.sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 6),
    totalOrders:  all.length,
  }
}
