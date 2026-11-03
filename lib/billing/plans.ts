// Single source of truth for plan prices. The pricing page, the marketing site
// and the payment check all read from here, so a price only changes in one place.
export type PlanId = 'starter' | 'pro' | 'enterprise'

export const BILLING_PLANS: {
  id: PlanId
  name: string
  priceGHS: number
  desc: string
  features: string[]
  popular: boolean
}[] = [
  {
    id: 'starter', name: 'Starter', priceGHS: 99, popular: false,
    desc: 'For a designer or small shop with one or two hands',
    features: [
      'Unlimited orders and clients',
      'Measurement book for every client',
      'Deposits, balances and receipts',
      'Order tracking links for clients',
      'One tap WhatsApp messages',
      'Up to 3 team accounts',
    ],
  },
  {
    id: 'pro', name: 'Pro', priceGHS: 199, popular: true,
    desc: 'For busy workshops with tailors and apprentices',
    features: [
      'Everything in Starter',
      'Unlimited team accounts',
      'Production board and job cards',
      'Automatic SMS or WhatsApp messages',
      'Apprentice tracking',
      'Expenses and commission',
    ],
  },
  {
    id: 'enterprise', name: 'Fashion House', priceGHS: 399, popular: false,
    desc: 'For fashion houses with more than one branch',
    features: [
      'Everything in Pro',
      'Multiple branches',
      'Branch level reporting',
      'Priority support on WhatsApp',
      'Help moving your old records in',
    ],
  },
]

export function planById(id: string) {
  return BILLING_PLANS.find(p => p.id === id) ?? null
}

/** Each payment buys one month from today, or from the current paid date if later. */
export function extendPaidUntil(current: string | null | undefined): string {
  const base = current && new Date(current) > new Date() ? new Date(current) : new Date()
  base.setMonth(base.getMonth() + 1)
  return base.toISOString()
}

/** An active plan lapses after paidUntil. Older accounts have no paidUntil and stay active. */
export function isPaidPlanActive(tenant: { subscriptionStatus?: string | null; paidUntil?: string | null }): boolean {
  if (tenant.subscriptionStatus !== 'active') return false
  return !tenant.paidUntil || new Date(tenant.paidUntil) > new Date()
}
