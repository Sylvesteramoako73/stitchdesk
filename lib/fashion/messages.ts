// Message templates for clients. Plain functions so they work on the server
// (automatic SMS or WhatsApp) and in the browser (one tap WhatsApp links).
import { formatCurrency } from '@/lib/utils'

type OrderLike = {
  orderNumber: string
  clientName: string
  title: string
  balance: number
  dueDate: string
  fittingDate: string | null
  trackingToken: string
}

type Shop = { salonName: string; phone?: string }

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

function niceDate(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function trackingUrl(token: string, origin?: string) {
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base.replace(/\/$/, '')}/track/${token}`
}

export function orderConfirmationMessage(o: OrderLike, shop: Shop, origin?: string) {
  const lines = [
    `Hello ${firstName(o.clientName)}, thank you for your order with ${shop.salonName}.`,
    `Order ${o.orderNumber}: ${o.title}.`,
    `Expected ready date: ${niceDate(o.dueDate)}.`,
  ]
  if (o.fittingDate) lines.push(`Fitting: ${niceDate(o.fittingDate)}.`)
  if (o.balance > 0) lines.push(`Balance: ${formatCurrency(o.balance)}.`)
  lines.push(`Follow your order here: ${trackingUrl(o.trackingToken, origin)}`)
  return lines.join('\n')
}

export function readyMessage(o: OrderLike, shop: Shop, origin?: string) {
  const lines = [
    `Hello ${firstName(o.clientName)}, good news. Your ${o.title} (order ${o.orderNumber}) is ready for pickup at ${shop.salonName}.`,
  ]
  if (o.balance > 0) lines.push(`Balance to pay on collection: ${formatCurrency(o.balance)}.`)
  if (shop.phone) lines.push(`Call ${shop.phone} if you need us to hold it for you.`)
  return lines.join('\n')
}

export function fittingReminderMessage(o: OrderLike, shop: Shop, origin?: string) {
  return [
    `Hello ${firstName(o.clientName)}, a reminder that your fitting for ${o.title} (order ${o.orderNumber}) is on ${niceDate(o.fittingDate ?? o.dueDate)} at ${shop.salonName}.`,
    shop.phone ? `Call ${shop.phone} to reschedule.` : '',
  ].filter(Boolean).join('\n')
}

export function balanceReminderMessage(o: OrderLike, shop: Shop, origin?: string) {
  return [
    `Hello ${firstName(o.clientName)}, a gentle reminder from ${shop.salonName}.`,
    `Order ${o.orderNumber} (${o.title}) has a balance of ${formatCurrency(o.balance)}.`,
    `Follow your order here: ${trackingUrl(o.trackingToken, origin)}`,
  ].join('\n')
}

/** Ghana numbers: 024 123 4567 → 233241234567 for wa.me links. */
export function toWhatsAppNumber(phone: string) {
  let d = (phone || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0') && d.length === 10) d = '233' + d.slice(1)
  if (d.length === 9) d = '233' + d
  return d
}

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`
}
