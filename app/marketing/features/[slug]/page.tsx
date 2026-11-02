import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { FEATURE_PAGES, featureBySlug } from '@/lib/marketing/features'
import { faqPageLd } from '@/lib/marketing/faqs'
import { getPost } from '@/lib/marketing/blog'
import { APP_URL, pageMetadata } from '@/lib/marketing/site'
import { CTA } from '@/components/marketing/chrome'
import { Breadcrumbs, FeatureIcon, JsonLd } from '@/components/marketing/shared'

export const dynamicParams = false

export function generateStaticParams() {
  return FEATURE_PAGES.map(f => ({ slug: f.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = featureBySlug(params.slug)
  if (!f) return {}
  return pageMetadata({ path: `/features/${f.slug}`, title: f.title, description: f.description, image: f.image.src })
}

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const f = featureBySlug(params.slug)
  if (!f) notFound()
  const related = f.related.map(s => featureBySlug(s)!).filter(Boolean)
  const post = f.relatedPost ? getPost(f.relatedPost) : undefined
  const trail = [{ name: 'Features', path: '/features' }, { name: f.name, path: `/features/${f.slug}` }]

  return (
    <>
      <JsonLd breadcrumbs={trail} items={[faqPageLd(f.faqs)]} />
      <section className="pt-12 pb-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs trail={trail} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <FeatureIcon name={f.icon} />
                <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">{f.name}</p>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">{f.h1}</h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">{f.intro}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href={`${APP_URL}/signup`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-900/10">
                  Start 14 day free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="text-sm font-semibold text-indigo-700 hover:underline">See plans and pricing</Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-gray-100">
              <Image src={f.image.src} alt={f.image.alt} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 max-w-2xl">{f.benefitsHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {f.benefits.map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 max-w-2xl">{f.stepsHeading}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {f.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl p-6 border border-gray-100 bg-gray-50">
                <span className="inline-flex h-9 w-9 rounded-xl bg-indigo-600 text-white text-sm font-bold items-center justify-center mb-4">{`0${i + 1}`}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 rounded-2xl px-6 py-4 bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-900">
            {f.planNote} <Link href="/pricing" className="underline">Compare plans</Link>
          </p>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Questions about {f.name.toLowerCase()}</h2>
          <div className="space-y-4">
            {f.faqs.map(q => (
              <div key={q.q} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{q.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{q.a}</p>
              </div>
            ))}
          </div>
          <Link href="/faq" className="inline-block mt-6 text-sm font-semibold text-indigo-700 hover:underline">More questions and answers</Link>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Works well with</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map(r => (
              <Link key={r.slug} href={`/features/${r.slug}`}
                className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                <FeatureIcon name={r.icon} />
                <h3 className="font-semibold text-gray-900 mt-4 mb-2">{r.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
                  Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          {post && (
            <Link href={`/blog/${post.slug}`}
              className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-6 bg-indigo-50 border border-indigo-100 hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">From the blog</p>
                <p className="text-lg font-bold text-gray-900">{post.title}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 shrink-0">
                Read the guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          )}
        </div>
      </section>
      <CTA />
    </>
  )
}
