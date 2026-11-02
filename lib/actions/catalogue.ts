'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminDb, docData } from '@/lib/firebase-admin'
import { getTenantId, requireTenant, getOwnedDoc } from '@/lib/auth'
import type { CatalogueItem } from '@/lib/types'

const col = () => adminDb.collection('catalogue')

const ItemSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  category:    z.string().min(1).max(60).trim(),
  description: z.string().max(600).nullable().optional(),
  priceFrom:   z.number().min(0).max(1_000_000),
  typicalDays: z.number().int().min(0).max(365),
  imageUrl:    z.string().url().max(1000).nullable().optional().or(z.literal('')),
})

export type CatalogueInput = z.infer<typeof ItemSchema>

export async function getCatalogue(): Promise<CatalogueItem[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await col().where('tenantId', '==', tenantId).get()
  return snap.docs
    .map(d => docData(d) as CatalogueItem)
    .filter(i => i.isActive)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}

export async function saveCatalogueItem(input: CatalogueInput, id?: string): Promise<CatalogueItem> {
  const { user, tenantId } = await requireTenant()
  if (user.role === 'staff') throw new Error('Only owners and managers can edit the price list')
  const data = ItemSchema.parse(input)
  const now  = new Date().toISOString()
  const clean = { ...data, description: data.description || null, imageUrl: data.imageUrl || null }

  if (id) {
    const { ref } = await getOwnedDoc('catalogue', id, tenantId)
    await ref.update({ ...clean, updatedAt: now })
    revalidatePath('/catalogue')
    return docData(await ref.get()) as CatalogueItem
  }
  const ref = col().doc()
  const doc = { ...clean, tenantId, isActive: true, createdAt: now, updatedAt: now }
  await ref.set(doc)
  revalidatePath('/catalogue')
  const { tenantId: _t, ...item } = doc
  return { id: ref.id, ...item }
}

export async function deleteCatalogueItem(id: string) {
  const { user, tenantId } = await requireTenant()
  if (user.role === 'staff') throw new Error('Only owners and managers can edit the price list')
  const { ref } = await getOwnedDoc('catalogue', id, tenantId)
  await ref.update({ isActive: false, updatedAt: new Date().toISOString() })
  revalidatePath('/catalogue')
}
