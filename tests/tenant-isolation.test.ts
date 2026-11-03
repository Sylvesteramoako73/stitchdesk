import { beforeEach, describe, expect, it, vi } from 'vitest'

// Runs the real server actions and the real checks in lib/auth.ts.
// Only the outside world is faked: Firestore, the session cookie and the Next.js cache.
const db = vi.hoisted(() => ({ store: new Map<string, Map<string, Record<string, unknown>>>() }))
const session = vi.hoisted(() => ({ current: 'owner-a' }))

vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T,>(fn: T) => fn,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => ({ value: session.current }) }),
}))
vi.mock('@/lib/firebase-admin', () => {
  const table = (name: string) => {
    if (!db.store.has(name)) db.store.set(name, new Map())
    return db.store.get(name)!
  }
  const docRef = (name: string, id: string) => ({
    id,
    get: async () => ({ id, exists: table(name).has(id), data: () => table(name).get(id) }),
    update: async (patch: Record<string, unknown>) => {
      table(name).set(id, { ...table(name).get(id), ...patch })
    },
  })
  const query = { where: () => query, get: async () => ({ empty: true, docs: [] }) }
  return {
    adminDb: {
      collection: (name: string) => ({ doc: (id: string) => docRef(name, id), where: () => query }),
      batch: () => ({ update: vi.fn(), commit: vi.fn() }),
    },
    adminAuth: {
      verifySessionCookie: async (uid: string) => ({
        uid,
        email: `${uid}@example.com`,
        role: 'owner',
        tenantId: uid === 'owner-a' ? 'tenant-a' : 'tenant-b',
      }),
    },
    docData: (snap: { id: string; data: () => Record<string, unknown> | undefined }) => ({ id: snap.id, ...snap.data() }),
  }
})

import { deleteClient, getClient, updateClient } from '@/lib/actions/clients'
import { getTenant } from '@/lib/actions/tenants'

describe('a user from one business and another business\'s data', () => {
  beforeEach(() => {
    session.current = 'owner-a'
    db.store.clear()
    db.store.set('clients', new Map([['client-of-b', { tenantId: 'tenant-b', name: 'Client of B', phone: '0240000000', isActive: true }]]))
    db.store.set('tenants', new Map([['tenant-b', { name: 'Business B', plan: 'pro', subscriptionStatus: 'active' }]]))
  })

  it('cannot read the other business\'s client', async () => {
    expect(await getClient('client-of-b')).toBeNull()
  })

  it('cannot edit it', async () => {
    await expect(updateClient('client-of-b', { name: 'Changed by A' })).rejects.toThrow('Not found')
    expect(db.store.get('clients')!.get('client-of-b')?.name).toBe('Client of B')
  })

  it('cannot delete it', async () => {
    await expect(deleteClient('client-of-b')).rejects.toThrow('Not found')
    expect(db.store.get('clients')!.get('client-of-b')?.isActive).toBe(true)
  })

  it('cannot read the other business\'s account record', async () => {
    expect(await getTenant('tenant-b')).toBeNull()
  })

  it('still works for the business that owns the data', async () => {
    session.current = 'owner-b'
    expect((await getClient('client-of-b'))?.name).toBe('Client of B')
    await updateClient('client-of-b', { name: 'Changed by B' })
    expect(db.store.get('clients')!.get('client-of-b')?.name).toBe('Changed by B')
    expect((await getTenant('tenant-b'))?.name).toBe('Business B')
  })
})
