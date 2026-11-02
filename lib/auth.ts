import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import type { Role } from '@/lib/actions/users'

// cache() deduplicates this across a single request — layout + requireRole share one Firestore read
export const getSessionUser = cache(async () => {
  const sessionCookie = cookies().get('session')?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false)
    const email = decoded.email ?? null

    // Custom claims — baked into the session cookie during login.
    // When present, no Firestore read is needed per page load.
    const claimRole     = decoded['role']       as Role | undefined
    const claimTenantId = decoded['tenantId']   as string | null | undefined
    const claimLocId    = decoded['locationId'] as string | null | undefined

    if (claimRole) {
      return {
        uid:        decoded.uid,
        name:       decoded.name ?? email?.split('@')[0] ?? 'User',
        email,
        role:       claimRole,
        locationId: claimRole === 'owner' ? null : (claimLocId ?? null),
        tenantId:   claimTenantId ?? null,
      }
    }

    // Firestore fallback — for sessions created before custom claims were introduced.
    const doc  = await adminDb.collection('users').doc(decoded.uid).get()
    if (!doc.exists) return null
    const data = doc.data()!
    const role = (data.role as Role) ?? 'staff'
    const locationId = role === 'owner' ? null : (data.locationId as string | null) ?? null

    return {
      uid:        decoded.uid,
      name:       data.name ?? decoded.name ?? email?.split('@')[0] ?? 'User',
      email,
      role,
      locationId,
      tenantId:   (data.tenantId as string | null) ?? null,
    }
  } catch (err) {
    console.error('[getSessionUser] session verification failed:', err)
    return null
  }
})

// Returns tenantId for the current session — used inside server actions to scope all queries.
export const getTenantId = cache(async (): Promise<string | null> => {
  const user = await getSessionUser()
  return user?.tenantId ?? null
})

// Returns the effective location to filter by:
// - Branch-locked users (manager/staff with locationId) → their assigned branch
// - Owners → whatever is in the activeLocation cookie (switcher-selected)
export async function getEffectiveLocationId(): Promise<string | null> {
  const user = await getSessionUser()
  if (!user) return null
  if (user.locationId) return user.locationId
  return cookies().get('activeLocation')?.value ?? null
}

export async function requireRole(...allowed: Role[]) {
  const user = await getSessionUser()
  if (!user) redirect('/api/auth/session')
  if (!allowed.includes(user.role)) redirect('/')
  return user
}

/** For server actions: the signed in user plus their tenant, or throws. */
export async function requireTenant() {
  const user = await getSessionUser()
  if (!user?.tenantId) throw new Error('Not signed in')
  return { user, tenantId: user.tenantId }
}

/**
 * Loads a document and confirms it belongs to the caller's tenant.
 * Server actions are callable from the browser with any id, so every
 * read or write by id must go through a check like this.
 */
export async function getOwnedDoc(collection: string, id: string, tenantId: string) {
  const { adminDb } = await import('@/lib/firebase-admin')
  if (!id || typeof id !== 'string') throw new Error('Not found')
  const ref  = adminDb.collection(collection).doc(id)
  const snap = await ref.get()
  if (!snap.exists || snap.data()?.tenantId !== tenantId) throw new Error('Not found')
  return { ref, snap }
}

/** Throws unless the record with this id belongs to the caller's tenant. */
export async function assertOwned(collection: string, id: string) {
  const { tenantId } = await requireTenant()
  await getOwnedDoc(collection, id, tenantId)
}
