'use client'
import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'

/**
 * Uploads images to Firebase Storage under the tenant's folder and returns URLs.
 * Storage is loaded lazily so pages that never upload don't pay for it.
 */
export function ImageUpload({
  value, onChange, folder, max = 6, label = 'Add photo',
}: {
  value: string[]
  onChange: (urls: string[]) => void
  folder: string
  max?: number
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(files: FileList | null) {
    if (!files?.length) return
    setBusy(true); setError(null)
    try {
      const tenant = await fetch('/api/tenant').then(r => (r.ok ? r.json() : null))
      if (!tenant?.tenantId) throw new Error('Not signed in')
      const [{ ref, uploadBytes, getDownloadURL }, { storage }] = await Promise.all([
        import('firebase/storage'), import('@/lib/firebase'),
      ])
      const urls: string[] = []
      for (const file of Array.from(files).slice(0, max - value.length)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 8 * 1024 * 1024) throw new Error('Photos must be under 8 MB')
        const name = `${Date.now()}-${file.name.replace(/[^\w.]+/g, '-')}`
        const r = ref(storage, `tenants/${tenant.tenantId}/${folder}/${name}`)
        await uploadBytes(r, file, { contentType: file.type })
        urls.push(await getDownloadURL(r))
      }
      onChange([...value, ...urls])
    } catch (e: any) {
      setError(e?.message?.includes('storage') ? 'Photo upload is not set up yet. Check Firebase Storage.' : (e?.message ?? 'Upload failed'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map(url => (
          <div key={url} className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter(u => u !== url))}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-90 hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? 'Uploading' : label}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handle(e.target.files)} />
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
