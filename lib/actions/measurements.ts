'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminDb, docData } from '@/lib/firebase-admin'
import { getTenantId, requireTenant, getOwnedDoc } from '@/lib/auth'
import type { Measurement } from '@/lib/types'

const col = () => adminDb.collection('measurements')

const MeasurementSchema = z.object({
  clientId: z.string().min(1).max(128),
  label:    z.string().min(1).max(80).trim(),
  gender:   z.enum(['female', 'male']),
  unit:     z.enum(['in', 'cm']),
  values:   z.record(z.string().max(40), z.number().min(0).max(500)),
  custom:   z.array(z.object({ name: z.string().min(1).max(60).trim(), value: z.number().min(0).max(500) })).max(30),
  notes:    z.string().max(1000).nullable().optional(),
  takenAt:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type MeasurementInput = z.infer<typeof MeasurementSchema>

export async function getMeasurements(clientId: string): Promise<Measurement[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await col().where('tenantId', '==', tenantId).where('clientId', '==', clientId).get()
  return snap.docs
    .map(d => docData(d) as Measurement)
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt) || b.createdAt.localeCompare(a.createdAt))
}

export async function saveMeasurement(input: MeasurementInput, id?: string): Promise<Measurement> {
  const { user, tenantId } = await requireTenant()
  const data = MeasurementSchema.parse(input)
  await getOwnedDoc('clients', data.clientId, tenantId)

  const now = new Date().toISOString()
  // Drop empty values so the record only holds what was actually measured
  const values = Object.fromEntries(Object.entries(data.values).filter(([, v]) => v > 0))

  if (id) {
    const { ref, snap } = await getOwnedDoc('measurements', id, tenantId)
    if (snap.data()?.clientId !== data.clientId) throw new Error('Not found')
    await ref.update({ ...data, values, notes: data.notes ?? null, updatedAt: now })
    revalidatePath(`/clients/${data.clientId}`)
    return docData(await ref.get()) as Measurement
  }

  const ref = col().doc()
  const doc = {
    ...data,
    values,
    notes:     data.notes ?? null,
    takenBy:   user.name,
    tenantId,
    createdAt: now,
    updatedAt: now,
  }
  await ref.set(doc)
  // Remember the client's gender for next time
  await adminDb.collection('clients').doc(data.clientId).update({ gender: data.gender, updatedAt: now })
  revalidatePath(`/clients/${data.clientId}`)
  return { id: ref.id, ...doc } as unknown as Measurement
}

export async function deleteMeasurement(id: string) {
  const { tenantId } = await requireTenant()
  const { ref, snap } = await getOwnedDoc('measurements', id, tenantId)
  await ref.delete()
  revalidatePath(`/clients/${snap.data()?.clientId}`)
}
