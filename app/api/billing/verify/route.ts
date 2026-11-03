import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { planById, extendPaidUntil } from '@/lib/billing/plans'

// Paystack can return metadata as an object or as a JSON string
function metadataTenantId(metadata: unknown): string | null {
  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
    return (parsed as { tenantId?: string } | null)?.tenantId ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.tenantId || user.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reference, plan: planId } = await req.json().catch(() => ({}))
  const plan = planById(String(planId ?? ''))
  if (!reference || typeof reference !== 'string' || !/^[A-Za-z0-9_.=-]{1,100}$/.test(reference) || !plan) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const tenantRef = adminDb.collection('tenants').doc(user.tenantId)
  const secretKey = process.env.PAYSTACK_PLATFORM_SECRET_KEY

  if (!secretKey) {
    // Local development only. In production a missing key must never unlock a plan.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 })
    }
    const t = (await tenantRef.get()).data()
    await tenantRef.update({ plan: plan.id, subscriptionStatus: 'active', paidUntil: extendPaidUntil(t?.paidUntil), updatedAt: new Date().toISOString() })
    return NextResponse.json({ ok: true, mock: true })
  }

  const res  = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json()
  const tx   = data?.data

  // The payment must have succeeded, be in cedis, cover the plan, and belong to this business
  if (!data.status || tx?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
  }
  if (tx.currency !== 'GHS' || Number(tx.amount) < plan.priceGHS * 100) {
    return NextResponse.json({ error: 'Payment amount does not match the plan' }, { status: 400 })
  }
  if (metadataTenantId(tx.metadata) !== user.tenantId) {
    return NextResponse.json({ error: 'Payment belongs to another account' }, { status: 400 })
  }

  // A reference can only be used once
  const paymentRef = adminDb.collection('billingPayments').doc(reference)
  try {
    await adminDb.runTransaction(async t => {
      const [used, tenant] = await Promise.all([t.get(paymentRef), t.get(tenantRef)])
      if (used.exists) throw new Error('used')
      t.set(paymentRef, {
        tenantId: user.tenantId, plan: plan.id, amount: Number(tx.amount) / 100, currency: tx.currency,
        paidAt: tx.paid_at ?? new Date().toISOString(), createdAt: new Date().toISOString(),
      })
      t.update(tenantRef, {
        plan: plan.id,
        subscriptionStatus: 'active',
        paidUntil: extendPaidUntil(tenant.data()?.paidUntil),
        paystackCustomerCode: tx.customer?.customer_code ?? tenant.data()?.paystackCustomerCode ?? null,
        updatedAt: new Date().toISOString(),
      })
    })
  } catch (e: any) {
    if (e?.message === 'used') return NextResponse.json({ error: 'This payment was already applied' }, { status: 409 })
    throw e
  }

  return NextResponse.json({ ok: true })
}
