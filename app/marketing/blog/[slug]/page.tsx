import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { formatDate, getPost, getPosts, readingMinutes } from '@/lib/marketing/blog'
import { featureBySlug } from '@/lib/marketing/features'
import { APP_URL, SITE_URL, canonical, pageMetadata } from '@/lib/marketing/site'
import { Breadcrumbs, FeatureIcon, JsonLd } from '@/components/marketing/shared'

export const dynamicParams = false

export function generateStaticParams() {
  return getPosts().map(p => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPost(params.slug)
  if (!p) return {}
  const full = `${p.title} | StitchDesk`
  return pageMetadata({
    path: `/blog/${p.slug}`,
    title: full.length <= 65 ? full : p.title,
    description: p.description,
    image: p.image,
    type: 'article',
    published: p.date,
  })
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()
  const feature = post.feature ? featureBySlug(post.feature) : undefined
  const others = getPosts().filter(p => p.slug !== post.slug).slice(0, 2)
  const trail = [{ name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }]
  const url = canonical(`/blog/${post.slug}`)

  return (
    <>
      <JsonLd
        breadcrumbs={trail}
        items={[{
          '@type': 'BlogPosting',
          '@id': `${url}#article`,
          headline: post.title,
          description: post.description,
          image: `${SITE_URL}${post.image}`,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          wordCount: post.words,
          inLanguage: 'en-GH',
          author: { '@type': 'Organization', name: post.author, url: `${SITE_URL}/` },
          publisher: { '@id': `${SITE_URL}/#organization` },
          mainEntityOfPage: url,
        }]}
      />
      <article className="pt-12 pb-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs trail={trail} />
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">{post.title}</h1>
          <p className="text-sm text-gray-500 mb-10">
            {post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time> · {readingMinutes(post)} min read
          </p>
        </div>
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100">
            <Image src={post.image} alt={post.imageAlt} fill priority sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          {post.headings.length > 2 && (
            <nav aria-label="In this guide" className="mb-12 rounded-2xl p-6 bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-4">In this guide</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                {post.headings.map(h => (
                  <li key={h.id}><a href={`#${h.id}`} className="hover:text-indigo-700 hover:underline">{h.text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div className="gd-article" dangerouslySetInnerHTML={{ __html: post.html }} />

          {feature && (
            <aside className="mt-14 rounded-2xl p-8 bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row gap-5 items-start">
              <FeatureIcon name={feature.icon} />
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">Try {feature.name.toLowerCase()} in StitchDesk</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{feature.description}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href={`${APP_URL}/signup`} className="inline-flex items-center gap-2 h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm">
                    Start 14 day free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href={`/features/${feature.slug}`} className="text-sm font-semibold text-indigo-700 hover:underline">See how it works</Link>
                </div>
              </div>
            </aside>
          )}
        </div>
      </article>

      {others.length > 0 && (
        <section className="py-20 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {others.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-xs text-gray-400 mb-2">{readingMinutes(p)} min read</p>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3">{p.title}</h3>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
                    Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
