'use server'
import { revalidatePath } from 'next/cache'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export type Role = 'owner' | 'manager' | 'staff'

export type AppUser = {
  uid:       string
  name:      string
  email:     string
  role:      Role
  createdAt: string
}

const col = () => adminDb.collection('users')

// Only the fields the Settings team list needs. Never return tenant, location or audit fields.
export type TeamMember = Pick<AppUser, 'uid' | 'name' | 'email' | 'role'>

/**
 * Returns the team for the signed in owner's business only.
 * This file is 'use server', so every export is callable from the browser:
 * the tenant must always come from the session, never from an argument.
 */
export async function getUsers(): Promise<TeamMember[]> {
  const { getSessionUser } = await import('@/lib/auth')
  const caller = await getSessionUser()
  if (!caller || caller.role !== 'owner' || !caller.tenantId) return []

  const snap = await col().where('tenantId', '==', caller.tenantId).get()
  return snap.docs
    .map(d => {
      const data = d.data()
      return {
        uid:   d.id,
        name:  (data.name as string) ?? '',
        email: (data.email as string) ?? '',
        role:  ((data.role as Role) ?? 'staff'),
      }
    })
    .sort((a, b) => {
      const order = { owner: 0, manager: 1, staff: 2 }
      return (order[a.role] ?? 3) - (order[b.role] ?? 3) || a.name.localeCompare(b.name)
    })
}

// Throws unless the target user belongs to the caller's business.
async function assertSameTenant(callerTenantId: string | null, uid: string) {
  if (!callerTenantId) throw new Error('No business on this account')
  const target = await col().doc(uid).get()
  if (!target.exists || target.data()?.tenantId !== callerTenantId) {
    throw new Error('User not found')
  }
}

export async function createUserDoc(uid: string, name: string, email: string): Promise<Role> {
  // Every new signup is an owner of their own business account
  const role: Role = 'owner'

  await col().doc(uid).set({
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  })

  return role
}

export async function updateUserRole(uid: string, role: Role) {
  const { getSessionUser } = await import('@/lib/auth')
  const caller = await getSessionUser()
  if (!caller || caller.role !== 'owner') throw new Error('Only owners can change roles')
  await assertSameTenant(caller.tenantId, uid)
  await col().doc(uid).update({ role })
  revalidatePath('/settings')
}

export async function getUserRole(uid: string): Promise<Role> {
  const doc = await col().doc(uid).get()
  return (doc.data()?.role as Role) ?? 'staff'
}

export async function deleteUserAccount(uid: string) {
  const { getSessionUser } = await import('@/lib/auth')
  const caller = await getSessionUser()
  if (!caller || caller.role !== 'owner') throw new Error('Only owners can delete accounts')
  await assertSameTenant(caller.tenantId, uid)
  await Promise.all([
    adminAuth.deleteUser(uid),
    col().doc(uid).delete(),
  ])
  revalidatePath('/settings')
}
