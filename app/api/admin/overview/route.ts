import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

const PLAN_PRICE: Record<string, number> = {
  starter:    150,
  pro:        350,
  enterprise: 700,
}

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const snap = await adminDb.collection('tenants').orderBy('createdAt', 'desc').get()

  const now       = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  let mrr              = 0
  let activeCount      = 0
  let trialingCount    = 0
  let pastDueCount     = 0
  let cancelledCount   = 0
  let newThisMonth     = 0
  let newLastMonth     = 0
  let convertedTrials  = 0  // became active
  let expiredTrials    = 0  // trial ended without converting

  const planBreakdown: Record<string, { count: number; mrr: number }> = {
    starter:    { count: 0, mrr: 0 },
    pro:        { count: 0, mrr: 0 },
    enterprise: { count: 0, mrr: 0 },
  }

  const recentSignups: { name: string; ownerEmail?: string; plan: string; status: string; createdAt: string }[] = []

  for (const doc of snap.docs) {
    const d      = doc.data()
    const status = d.subscriptionStatus as string
    const plan   = d.plan as string
    const joined = (d.createdAt as string)?.slice(0, 7) // YYYY-MM

    if (status === 'active') {
      activeCount++
      const price = PLAN_PRICE[plan] ?? 0
      mrr += price
      if (planBreakdown[plan]) {
        planBreakdown[plan].count++
        planBreakdown[plan].mrr += price
      }
      convertedTrials++
    } else if (status === 'trialing') {
      trialingCount++
      const trialEnd = new Date(d.trialEndsAt as string)
      if (trialEnd < now) expiredTrials++
    } else if (status === 'past_due') {
      pastDueCount++
    } else if (status === 'cancelled') {
      cancelledCount++
      expiredTrials++
    }

    if (joined === thisMonth) newThisMonth++
    if (joined === lastMonth) newLastMonth++

    if (recentSignups.length < 10) {
      recentSignups.push({
        name:      d.name as string,
        plan,
        status,
        createdAt: d.createdAt as string,
      })
    }
  }

  const totalFinished       = convertedTrials + expiredTrials
  const conversionRate      = totalFinished > 0 ? Math.round((convertedTrials / totalFinished) * 100) : 0
  const signupGrowth        = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0

  return NextResponse.json({
    mrr,
    activeCount,
    trialingCount,
    pastDueCount,
    cancelledCount,
    totalTenants:    snap.size,
    newThisMonth,
    newLastMonth,
    signupGrowth,
    conversionRate,
    planBreakdown,
    recentSignups,
  })
}
