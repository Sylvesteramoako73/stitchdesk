import { SITE_URL, type JsonLd } from './site'
import { BILLING_PLANS } from '@/lib/billing/plans'

export const PLANS = BILLING_PLANS.map(p => ({
  name: p.name, price: p.priceGHS, highlight: p.popular, desc: p.desc, features: p.features,
}))

export const softwareApplicationLd: JsonLd = {
  '@type': 'SoftwareApplication',
  name: 'StitchDesk',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Fashion design and tailoring management software',
  operatingSystem: 'Web, Android, iOS',
  url: `${SITE_URL}/`,
  description:
    'Workshop software for fashion designers and tailors in Ghana: client measurement book, order tracking from cutting to pickup, deposits and balances in cedis, job cards, and WhatsApp messages with a tracking link for every client.',
  publisher: { '@id': `${SITE_URL}/#organization` },
  offers: PLANS.map(p => ({
    '@type': 'Offer',
    name: p.name,
    description: p.desc,
    url: `${SITE_URL}/pricing`,
    priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'GHS', unitText: 'MONTH' },
  })),
}
