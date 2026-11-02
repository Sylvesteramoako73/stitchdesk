import type { OrderStatus, PaymentMethod } from '@/lib/types'

export const PIPELINE: OrderStatus[] = ['received', 'cutting', 'sewing', 'fitting', 'finishing', 'ready', 'collected']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received:  'Received',
  cutting:   'Cutting',
  sewing:    'Sewing',
  fitting:   'Fitting',
  finishing: 'Finishing',
  ready:     'Ready for pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
}

/** Short words for the client facing tracking page. */
export const STATUS_PUBLIC: Record<OrderStatus, string> = {
  received:  'We have your order',
  cutting:   'Your fabric is being cut',
  sewing:    'Your outfit is being sewn',
  fitting:   'Ready for your fitting',
  finishing: 'Adding the finishing touches',
  ready:     'Ready for pickup',
  collected: 'Collected. Enjoy wearing it',
  cancelled: 'This order was cancelled',
}

export const STATUS_BADGE: Record<OrderStatus, string> = {
  received:  'badge-gray',
  cutting:   'badge-blue',
  sewing:    'badge-blue',
  fitting:   'badge-yellow',
  finishing: 'badge-blue',
  ready:     'badge-green',
  collected: 'badge-gray',
  cancelled: 'badge-red',
}

export const STATUS_DOT: Record<OrderStatus, string> = {
  received:  'bg-gray-400',
  cutting:   'bg-sky-500',
  sewing:    'bg-indigo-500',
  fitting:   'bg-amber-500',
  finishing: 'bg-violet-500',
  ready:     'bg-emerald-500',
  collected: 'bg-gray-300',
  cancelled: 'bg-red-400',
}

export const OPEN_STATUSES: OrderStatus[] = ['received', 'cutting', 'sewing', 'fitting', 'finishing']

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = PIPELINE.indexOf(s)
  if (i < 0 || i >= PIPELINE.length - 1) return null
  return PIPELINE[i + 1]
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash', momo: 'Mobile Money', bank_transfer: 'Bank transfer', card: 'Card',
}

/** Today in Ghana (UTC+0) as YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysUntil(iso: string): number {
  const a = new Date(todayISO() + 'T00:00:00Z').getTime()
  const b = new Date(iso + 'T00:00:00Z').getTime()
  return Math.round((b - a) / 86400000)
}

export function dueLabel(iso: string): string {
  const d = daysUntil(iso)
  if (d < 0)  return `${-d} day${d === -1 ? '' : 's'} overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `Due in ${d} days`
}
