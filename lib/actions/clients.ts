'use server'
import { revalidatePath } from 'next/cache'
import { adminDb, docData } from '@/lib/firebase-admin'
import { ClientSchema } from '@/lib/validation'
import { getTenantId, requireTenant, getOwnedDoc } from '@/lib/auth'
import type { Client } from '@/lib/types'

export type ClientWithStats = Client & { orderCount: number; openOrders: number; balanceOwed: number }

export async function getClients(): Promise<Client[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await adminDb.collection('clients').where('tenantId', '==', tenantId).get()
  return snap.docs
    .map(d => docData(d) as Client)
    .filter(c => c.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getClientsWithStats(): Promise<ClientWithStats[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const [clients, orderSnap] = await Promise.all([
    getClients(),
    adminDb.collection('orders').where('tenantId', '==', tenantId).get(),
  ])
  const stats = new Map<string, { orderCount: number; openOrders: number; balanceOwed: number }>()
  for (const d of orderSnap.docs) {
    const o = d.data()
    const s = stats.get(o.clientId) ?? { orderCount: 0, openOrders: 0, balanceOwed: 0 }
    s.orderCount++
    if (o.status !== 'collected' && o.status !== 'cancelled') {
      s.openOrders++
      s.balanceOwed += o.balance ?? 0
    }
    stats.set(o.clientId, s)
  }
  return clients.map(c => ({ ...c, ...(stats.get(c.id) ?? { orderCount: 0, openOrders: 0, balanceOwed: 0 }) }))
}

export async function getClient(id: string): Promise<Client | null> {
  const tenantId = await getTenantId()
  if (!tenantId) return null
  try {
    const { snap } = await getOwnedDoc('clients', id, tenantId)
    return docData(snap) as Client
  } catch {
    return null
  }
}

export async function createClient(data: {
  name: string; phone: string; email?: string; notes?: string; tags?: string; dateOfBirth?: string
  gender?: 'female' | 'male' | ''; address?: string
}): Promise<Client> {
  const { tenantId } = await requireTenant()
  const parsed = ClientSchema.parse(data)
  const ref = adminDb.collection('clients').doc()
  const now = new Date().toISOString()
  const doc = {
    name:        parsed.name,
    phone:       parsed.phone,
    tenantId,
    email:       parsed.email || null,
    notes:       parsed.notes || null,
    tags:        parsed.tags ?? '',
    gender:      parsed.gender || null,
    address:     parsed.address || null,
    dateOfBirth: parsed.dateOfBirth || null,
    loyaltyPoints: 0,
    loyaltyTier:   'Bronze',
    totalVisits:   0,
    totalSpent:    0,
    isActive:      true,
    lastVisitAt:   null,
    preferredStaff: null,
    createdAt: now,
    updatedAt: now,
  }
  await ref.set(doc)
  revalidatePath('/clients')
  const { tenantId: _t, ...client } = doc
  return { id: ref.id, ...client } as Client
}

export async function updateClient(id: string, data: {
  name?: string; phone?: string; email?: string; notes?: string; tags?: string
  gender?: 'female' | 'male' | ''; address?: string; dateOfBirth?: string
}): Promise<Client> {
  const { tenantId } = await requireTenant()
  const { ref } = await getOwnedDoc('clients', id, tenantId)
  const parsed = ClientSchema.partial().parse(data)
  const update: Record<string, unknown> = { ...parsed, updatedAt: new Date().toISOString() }
  for (const k of ['email', 'notes', 'gender', 'address', 'dateOfBirth']) {
    if (k in update && update[k] === '') update[k] = null
  }
  await ref.update(update)

  // Keep the name and phone on open orders in step with the client record
  if (parsed.name || parsed.phone) {
    const orders = await adminDb.collection('orders')
      .where('tenantId', '==', tenantId).where('clientId', '==', id).get()
    const batch = adminDb.batch()
    for (const d of orders.docs) {
      batch.update(d.ref, {
        ...(parsed.name  ? { clientName:  parsed.name }  : {}),
        ...(parsed.phone ? { clientPhone: parsed.phone } : {}),
      })
    }
    if (!orders.empty) await batch.commit()
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return docData(await ref.get()) as Client
}

export async function deleteClient(id: string) {
  const { tenantId } = await requireTenant()
  const { ref } = await getOwnedDoc('clients', id, tenantId)
  await ref.update({ isActive: false, updatedAt: new Date().toISOString() })
  revalidatePath('/clients')
}
