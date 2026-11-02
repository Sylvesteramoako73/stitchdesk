'use server'
import { revalidatePath } from 'next/cache'
import { adminDb, docData } from '@/lib/firebase-admin'
import { StaffSchema } from '@/lib/validation'
import { getTenantId, assertOwned } from '@/lib/auth'
import type { Staff, StaffWithStats } from '@/lib/types'

export async function getStaff(locationId?: string | null): Promise<Staff[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await adminDb.collection('staff')
    .where('tenantId', '==', tenantId)
    .get()
  return snap.docs
    .map(d => docData(d) as Staff)
    .filter(s => s.isActive)
    .filter(s => !locationId || !s.locationId || s.locationId === locationId)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Staff stats come from orders: work in hand, work finished this week,
// and commission on the value of orders collected this month.
export async function getStaffWithStats(locationId?: string | null): Promise<StaffWithStats[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const now        = new Date()
  const monthStart = now.toISOString().slice(0, 7)
  const weekAgo    = new Date(now.getTime() - 7 * 86400000).toISOString()

  const [staff, orderSnap] = await Promise.all([
    getStaff(locationId),
    adminDb.collection('orders').where('tenantId', '==', tenantId).get(),
  ])
  const orders = orderSnap.docs.map(d => d.data())
  const OPEN = ['received', 'cutting', 'sewing', 'fitting', 'finishing']

  return staff.map(member => {
    const mine = orders.filter(o => o.assignedTo === member.id)
    const inHand = mine.filter(o => OPEN.includes(o.status)).length
    const finishedThisWeek = mine.filter(o =>
      (o.statusHistory ?? []).some((e: any) => e.status === 'ready' && e.at >= weekAgo)
    ).length
    const collectedValue = mine
      .filter(o => o.status === 'collected' && String(o.collectedAt ?? '').startsWith(monthStart))
      .reduce((s, o) => s + (o.price ?? 0) - (o.discount ?? 0), 0)
    return {
      ...member,
      todayBookings:   inHand,
      completedToday:  finishedThisWeek,
      monthlyEarnings: Math.round(collectedValue * (member.commissionRate / 100)),
    }
  })
}

export async function updateStaffAvailability(id: string, isAvailable: boolean) {
  await assertOwned('staff', id)
  await adminDb.collection('staff').doc(id).update({ isAvailable, updatedAt: new Date().toISOString() })
  revalidatePath('/staff')
  revalidatePath('/')
}

export async function createStaff(data: {
  name: string; role: string; phone?: string; email?: string
  specialties?: string; commissionRate?: number; systemRole?: string
  locationId?: string | null
}): Promise<Staff> {
  const tenantId = await getTenantId()
  const parsed = StaffSchema.parse({ ...data, commissionRate: data.commissionRate ?? 30 })
  let locationName: string | null = null
  if (parsed.locationId) {
    const locDoc = await adminDb.collection('locations').doc(parsed.locationId).get()
    locationName = locDoc.data()?.name ?? null
  }
  const ref = adminDb.collection('staff').doc()
  const now = new Date().toISOString()
  const doc = {
    ...parsed,
    tenantId: tenantId ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    specialties: data.specialties ?? '',
    commissionRate: data.commissionRate ?? 30,
    systemRole: data.systemRole ?? 'staff',
    locationId: parsed.locationId ?? null,
    locationName,
    rating: 5.0,
    isActive: true,
    isAvailable: true,
    color: '#E5E7EB',
    createdAt: now,
    updatedAt: now,
  }
  await ref.set(doc)
  revalidatePath('/staff')
  return { id: ref.id, ...doc } as Staff
}

export async function updateStaff(id: string, data: {
  name?: string; role?: string; phone?: string
  specialties?: string; commissionRate?: number; isActive?: boolean; systemRole?: string
  workingHours?: Record<string, unknown>; locationId?: string | null
}): Promise<Staff> {
  await assertOwned('staff', id)
  const { isActive, workingHours, locationId, ...rest } = data
  const parsed = StaffSchema.partial().parse(rest)
  let locationName: string | null | undefined = undefined
  if (locationId !== undefined) {
    locationName = null
    if (locationId) {
      const locDoc = await adminDb.collection('locations').doc(locationId).get()
      locationName = locDoc.data()?.name ?? null
    }
  }
  await adminDb.collection('staff').doc(id).update({
    ...parsed,
    ...(isActive !== undefined && { isActive }),
    ...(workingHours !== undefined && { workingHours }),
    ...(locationId !== undefined && { locationId, locationName }),
    updatedAt: new Date().toISOString(),
  })

  // Sync locationId to the user account that has the same email, so branch-lock
  // takes effect immediately when a manager/staff logs in next time.
  if (locationId !== undefined) {
    const staffDoc = await adminDb.collection('staff').doc(id).get()
    const staffEmail = staffDoc.data()?.email
    if (staffEmail) {
      const userSnap = await adminDb.collection('users')
        .where('email', '==', staffEmail)
        .limit(1)
        .get()
      if (!userSnap.empty) {
        await userSnap.docs[0].ref.update({ locationId: locationId ?? null })
      }
    }
  }

  revalidatePath('/staff')
  const doc = await adminDb.collection('staff').doc(id).get()
  return docData(doc) as Staff
}

export async function getStaffAppointmentsForReport(staffId: string, startDate: string, endDate: string) {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await adminDb.collection('orders')
    .where('tenantId', '==', tenantId)
    .where('assignedTo', '==', staffId)
    .get()

  return snap.docs
    .map(d => d.data())
    .filter(o => o.dueDate >= startDate && o.dueDate <= endDate)
    .map(o => ({
      date:       o.dueDate as string,
      clientName: o.clientName as string,
      services:   `${o.orderNumber} ${o.title}` as string,
      totalPrice: ((o.price ?? 0) - (o.discount ?? 0)) as number,
      status:     o.status as string,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
