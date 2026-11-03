'use server'
import { revalidatePath } from 'next/cache'
import { adminDb, docData } from '@/lib/firebase-admin'
import { ExpenseSchema } from '@/lib/validation'
import { getTenantId, requireTenant, getOwnedDoc, assertOwned } from '@/lib/auth'

export type ExpenseCategory =
  | 'rent' | 'fabric' | 'supplies' | 'utilities' | 'wages'
  | 'equipment' | 'marketing' | 'maintenance' | 'other'

export type Expense = {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  locationId: string | null
  locationName: string | null
  createdAt: string
}

export async function getExpenses(filters?: { month?: string; locationId?: string }): Promise<Expense[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  const snap = await adminDb.collection('expenses').where('tenantId', '==', tenantId).get()
  let results = snap.docs.map(d => docData(d) as Expense)
  if (filters?.month)      results = results.filter(e => e.date >= `${filters.month}-01` && e.date <= `${filters.month}-31`)
  if (filters?.locationId) results = results.filter(e => e.locationId === filters.locationId)
  return results.sort((a, b) => b.date.localeCompare(a.date))
}

export async function createExpense(data: {
  category: ExpenseCategory; description: string; amount: number; date: string; locationId?: string | null
}): Promise<Expense> {
  const { tenantId } = await requireTenant()
  const parsed = ExpenseSchema.parse(data)
  let locationName: string | null = null
  if (parsed.locationId) {
    const { snap: locDoc } = await getOwnedDoc('locations', parsed.locationId, tenantId)
    locationName = locDoc.data()?.name ?? null
  }
  const ref = adminDb.collection('expenses').doc()
  const now = new Date().toISOString()
  const doc = { ...parsed, tenantId, locationName, createdAt: now }
  await ref.set(doc)
  revalidatePath('/expenses')
  return { id: ref.id, ...doc } as Expense
}

export async function deleteExpense(id: string) {
  await assertOwned('expenses', id)
  await adminDb.collection('expenses').doc(id).delete()
  revalidatePath('/expenses')
}

export async function getPLReport(month: string) {
  const tenantId = await getTenantId()
  if (!tenantId) return null
  const monthStart = `${month}-01`
  const monthEnd   = `${month}-31`

  const [expSnap, aptSnap] = await Promise.all([
    adminDb.collection('expenses').where('tenantId', '==', tenantId).get(),
    adminDb.collection('appointments').where('tenantId', '==', tenantId).get(),
  ])

  const expenses = expSnap.docs.map(d => d.data() as Expense).filter(e => e.date >= monthStart && e.date <= monthEnd)
  const apts     = aptSnap.docs.map(d => d.data() as any).filter(a => a.date >= monthStart && a.date <= monthEnd && a.status === 'completed' && a.paymentStatus === 'paid')

  const totalRevenue  = apts.reduce((s: number, a: any) => s + (a.totalPrice ?? 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit     = totalRevenue - totalExpenses
  const margin        = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

  const expByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  // Revenue by week
  const weeks: { label: string; revenue: number; expenses: number }[] = []
  for (let w = 1; w <= 5; w++) {
    const d1 = new Date(`${month}-01`)
    d1.setDate((w - 1) * 7 + 1)
    const d2 = new Date(d1)
    d2.setDate(d1.getDate() + 6)
    const wStart = d1.toISOString().split('T')[0]
    const wEnd   = d2.toISOString().split('T')[0]
    const wRev   = apts.filter((a: any) => a.date >= wStart && a.date <= wEnd).reduce((s: number, a: any) => s + (a.totalPrice ?? 0), 0)
    const wExp   = expenses.filter(e => e.date >= wStart && e.date <= wEnd).reduce((s, e) => s + e.amount, 0)
    if (wRev > 0 || wExp > 0) weeks.push({ label: `Wk ${w}`, revenue: wRev, expenses: wExp })
  }

  return { totalRevenue, totalExpenses, netProfit, margin, expByCategory, weeks, aptCount: apts.length, expCount: expenses.length }
}

export async function getExpenseSummary(monthStart: string, monthEnd: string) {
  const tenantId = await getTenantId()
  if (!tenantId) return { total: 0, byCategory: {}, count: 0 }
  const snap = await adminDb.collection('expenses')
    .where('tenantId', '==', tenantId)
    .get()
  const expenses = snap.docs.map(d => d.data() as Expense).filter(e => e.date >= monthStart && e.date <= monthEnd)
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  return { total, byCategory, count: expenses.length }
}
