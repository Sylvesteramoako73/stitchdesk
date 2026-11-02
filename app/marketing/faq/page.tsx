import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/marketing/site'
import { FAQS, faqPageLd } from '@/lib/marketing/faqs'
import { CTA } from '@/components/marketing/chrome'
import { FAQ } from '@/components/marketing/faq'
import { JsonLd } from '@/components/marketing/shared'

export const metadata: Metadata = pageMetadata({
  path: '/faq',
  title: 'Fashion Designer Software FAQs | StitchDesk',
  description:
    'Answers about StitchDesk: pricing, the free trial, measurements, order tracking links, WhatsApp messages, team accounts and data security.',
})

export default function FaqPage() {
  return (
    <>
      <JsonLd breadcrumbs={[{ name: 'FAQ', path: '/faq' }]} items={[faqPageLd(FAQS)]} />
      <FAQ asPage />
      <CTA />
    </>
  )
}
