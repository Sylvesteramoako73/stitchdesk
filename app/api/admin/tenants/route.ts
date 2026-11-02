import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const snap = await adminDb.collection('tenants').orderBy('createdAt', 'desc').get()

  const tenants = await Promise.all(
    snap.docs.map(async doc => {
      const data     = doc.data()
      const ownerDoc = await adminDb.collection('users').doc(data.ownerId).get()
      const settings = await adminDb.collection('settings').doc(doc.id).get()
      return {
        id:                 doc.id,
        name:               data.name,
        slug:               data.slug,
        plan:               data.plan,
        subscriptionStatus: data.subscriptionStatus,
        trialEndsAt:        data.trialEndsAt,
        createdAt:          data.createdAt,
        ownerEmail:         ownerDoc.data()?.email          ?? null,
        ownerName:          ownerDoc.data()?.name           ?? null,
        salonName:          settings.data()?.salonName      ?? data.name,
        phone:              settings.data()?.phone          ?? null,
        whatsappNumber:     settings.data()?.whatsappNumber ?? null,
      }
    })
  )

  return NextResponse.json({ tenants })
}
