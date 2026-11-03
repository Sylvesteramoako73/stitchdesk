import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { subscriptionStatus, trialEndsAt } = body
  if (!subscriptionStatus) return NextResponse.json({ error: 'Missing status' }, { status: 400 })

  const update: Record<string, string | null> = { subscriptionStatus, updatedAt: new Date().toISOString() }
  if (trialEndsAt) update.trialEndsAt = trialEndsAt
  // An admin activation has no paid month behind it, so it must not lapse on an old paidUntil
  if (subscriptionStatus === 'active') update.paidUntil = null

  await adminDb.collection('tenants').doc(params.id).update(update)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenantId = params.id

  // Fetch owner ID before deleting
  const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get()
  const ownerId   = tenantDoc.data()?.ownerId as string | undefined

  // Delete all Firestore documents belonging to this tenant
  const collections = ['users', 'staff', 'clients', 'measurements', 'orders', 'catalogue',
    'locations', 'expenses', 'apprentices', 'apprenticeTasks', 'apprenticeAttendance', 'notifications']

  await Promise.all([
    ...collections.map(async col => {
      const snap = await adminDb.collection(col)
        .where('tenantId', '==', tenantId).get()
      const batch = adminDb.batch()
      snap.docs.forEach(d => batch.delete(d.ref))
      if (!snap.empty) await batch.commit()
    }),
    adminDb.collection('settings').doc(tenantId).delete(),
    adminDb.collection('tenants').doc(tenantId).delete(),
  ])

  // Delete Firebase Auth user
  if (ownerId) {
    await adminAuth.deleteUser(ownerId).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
