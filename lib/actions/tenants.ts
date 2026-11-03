'use server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { getTenantId } from '@/lib/auth'
import { isPaidPlanActive } from '@/lib/billing/plans'
import type { Tenant, TenantPlan } from '@/lib/types'

const col = () => adminDb.collection('tenants')

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const snap = await col().where('slug', '==', candidate).limit(1).get()
    if (snap.empty) return candidate
    suffix++
  }
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const callerTenantId = await getTenantId()
  if (!callerTenantId || callerTenantId !== tenantId) return null
  const doc = await col().doc(tenantId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as Tenant
}

// Not exported: everything exported from this file can be called from the browser.
async function createTenant(data: {
  name: string
  ownerId: string
  plan?: TenantPlan
}): Promise<Tenant> {
  const slug     = await uniqueSlug(data.name)
  const now      = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + 14)

  const ref = col().doc()
  const doc: Omit<Tenant, 'id'> = {
    name:                    data.name,
    slug,
    ownerId:                 data.ownerId,
    plan:                    data.plan ?? 'trial',
    trialEndsAt:             trialEnd.toISOString().split('T')[0],
    subscriptionStatus:      'trialing',
    paystackCustomerCode:    null,
    paystackSubscriptionCode: null,
    createdAt:               now.toISOString(),
    updatedAt:               now.toISOString(),
  }
  await ref.set(doc)
  return { id: ref.id, ...doc }
}

export async function isTrialActive(tenant: Tenant): Promise<boolean> {
  if (isPaidPlanActive(tenant)) return true
  if (tenant.subscriptionStatus !== 'trialing') return false
  return new Date(tenant.trialEndsAt) > new Date()
}

// Called from signup: creates Firebase Auth user + tenant + owner user doc
export async function signUpNewTenant(data: {
  salonName:      string
  phone:          string
  whatsappNumber: string
  ownerName:      string
  email:          string
  password:       string
}): Promise<{ tenantId: string; uid: string }> {
  // Create Firebase Auth user
  const userRecord = await adminAuth.createUser({
    email:       data.email,
    password:    data.password,
    displayName: data.ownerName,
  })

  // Create tenant
  const tenant = await createTenant({ name: data.salonName, ownerId: userRecord.uid })

  // Create user doc linked to tenant
  await adminDb.collection('users').doc(userRecord.uid).set({
    name:      data.ownerName,
    email:     data.email,
    role:      'owner',
    tenantId:  tenant.id,
    createdAt: new Date().toISOString(),
  })

  // Create initial salon settings for this tenant
  await adminDb.collection('settings').doc(tenant.id).set({
    tenantId:       tenant.id,
    salonName:      data.salonName,
    tagline:        '',
    phone:          data.phone,
    whatsappNumber: data.whatsappNumber,
    address:        '',
    email:          data.email,
    depositPct:     30,
  })

  return { tenantId: tenant.id, uid: userRecord.uid }
}
