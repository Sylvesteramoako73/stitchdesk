'use server'
import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { getTenantId } from '@/lib/auth'
import { DEFAULT_WORKING_HOURS } from '@/lib/types'
import type { SalonSettings } from '@/lib/types'
export type { DayHours, WorkingHours, SalonSettings, MomoNetwork } from '@/lib/types'

const DEFAULTS = {
  salonName:      '',
  tagline:        '',
  phone:          '',
  whatsappNumber: '',
  address:        '',
  email:          '',
  depositPct:     30,
  workingHours:   DEFAULT_WORKING_HOURS,
}

export async function getSalonSettings(): Promise<SalonSettings> {
  const tenantId = await getTenantId()
  if (!tenantId) return DEFAULTS
  const doc = await adminDb.collection('settings').doc(tenantId).get()
  return { ...DEFAULTS, ...(doc.data() ?? {}) }
}

const EDITABLE: (keyof SalonSettings)[] = [
  'salonName', 'tagline', 'phone', 'whatsappNumber', 'address', 'email', 'depositPct', 'workingHours',
  'autoMessages', 'measurementUnit',
]

export async function updateSalonSettings(data: Partial<SalonSettings>): Promise<void> {
  const { getSessionUser } = await import('@/lib/auth')
  const user = await getSessionUser()
  if (!user?.tenantId || user.role !== 'owner') throw new Error('Only the owner can change settings')
  const clean = Object.fromEntries(Object.entries(data ?? {}).filter(([k]) => EDITABLE.includes(k as keyof SalonSettings)))
  if (clean.autoMessages && !['off', 'sms', 'whatsapp'].includes(clean.autoMessages as string)) delete clean.autoMessages
  if (clean.measurementUnit && !['in', 'cm'].includes(clean.measurementUnit as string)) delete clean.measurementUnit
  await adminDb.collection('settings').doc(user.tenantId).set(clean, { merge: true })
  revalidatePath('/settings')
}
