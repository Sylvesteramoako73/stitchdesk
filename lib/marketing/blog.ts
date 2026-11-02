import fs from 'node:fs'
import path from 'node:path'
import { Marked } from 'marked'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  author: string
  image: string
  imageAlt: string
  feature?: string
  html: string
  headings: { id: string; text: string }[]
  words: number
}

const DIR = path.join(process.cwd(), 'content', 'blog')

const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')

function parse(file: string): BlogPost {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  const data: Record<string, string> = {}
  for (const line of (match?.[1] ?? '').split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i === -1) continue
    let value = line.slice(i + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    data[line.slice(0, i).trim()] = value
  }
  const body = match ? raw.slice(match[0].length) : raw
  const headings: { id: string; text: string }[] = []
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const id = slugify(text)
        if (depth === 2) headings.push({ id, text: text.replace(/<[^>]+>/g, '') })
        return `<h${depth} id="${id}">${text}</h${depth}>\n`
      },
    },
  })
  const html = marked.parse(body, { async: false }) as string
  return {
    slug: file.replace(/\.md$/, ''),
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated,
    author: data.author,
    image: data.image,
    imageAlt: data.imageAlt,
    feature: data.feature,
    html,
    headings,
    words: body.split(/\s+/).filter(Boolean).length,
  }
}

/** All posts, newest first */
export function getPosts(): BlogPost[] {
  return fs.readdirSync(DIR).filter(f => f.endsWith('.md')).map(parse)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}

export const getPost = (slug: string) => getPosts().find(p => p.slug === slug)

export const readingMinutes = (p: BlogPost) => Math.max(1, Math.round(p.words / 220))

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
