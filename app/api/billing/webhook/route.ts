import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_PLATFORM_SECRET_KEY
  if (!secret) return NextResponse.json({ ok: true }) // dev mode

  const body      = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = createHmac('sha512', secret).update(body).digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const { event: type, data } = event

  const customerCode: string | undefined = data?.customer?.customer_code
  const subscriptionCode: string | undefined = data?.subscription_code ?? data?.code

  // Find tenant by Paystack customer code
  async function findTenantByCustomer(code: string) {
    const snap = await adminDb.collection('tenants')
      .where('paystackCustomerCode', '==', code).limit(1).get()
    return snap.empty ? null : snap.docs[0]
  }

  if (type === 'subscription.create' || type === 'charge.success') {
    if (!customerCode) return NextResponse.json({ ok: true })
    const doc = await findTenantByCustomer(customerCode)
    if (doc) {
      await doc.ref.update({
        subscriptionStatus:       'active',
        paystackSubscriptionCode: subscriptionCode ?? doc.data().paystackSubscriptionCode,
        updatedAt:                new Date().toISOString(),
      })
    }
  }

  if (type === 'subscription.disable' || type === 'subscription.expiry_card') {
    if (!customerCode) return NextResponse.json({ ok: true })
    const doc = await findTenantByCustomer(customerCode)
    if (doc) {
      await doc.ref.update({
        subscriptionStatus: 'cancelled',
        updatedAt:          new Date().toISOString(),
      })
    }
  }

  if (type === 'invoice.payment_failed') {
    if (!customerCode) return NextResponse.json({ ok: true })
    const doc = await findTenantByCustomer(customerCode)
    if (doc) {
      await doc.ref.update({
        subscriptionStatus: 'past_due',
        updatedAt:          new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
