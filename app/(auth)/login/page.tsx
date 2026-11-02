'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Loader2, Check, Sparkles } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginPage() {
  const [tab, setTab]           = useState<'signin' | 'signup'>('signin')

  // Sign in state
  const [siEmail, setSiEmail]   = useState('')
  const [siPass, setSiPass]     = useState('')
  const [siShow, setSiShow]     = useState(false)
  const [siLoading, setSiLoading] = useState(false)
  const [siError, setSiError]   = useState('')

  // Sign up state
  const [salonName, setSalonName]           = useState('')
  const [phone, setPhone]                   = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [ownerName, setOwnerName]           = useState('')
  const [suEmail, setSuEmail]               = useState('')
  const [suPass, setSuPass]                 = useState('')
  const [suShow, setSuShow]                 = useState(false)
  const [suLoading, setSuLoading]           = useState(false)
  const [suError, setSuError]               = useState('')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSiLoading(true); setSiError('')
    try {
      const credential   = await signInWithEmailAndPassword(auth, siEmail, siPass)
      const initialToken = await credential.user.getIdToken()
      await fetch('/api/auth/claims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: initialToken }),
      })
      const freshToken = await credential.user.getIdToken(true)
      const res = await fetch('/api/auth/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: freshToken }),
      })
      if (!res.ok) throw new Error('Session creation failed')
      window.location.href = '/'
    } catch (err: any) {
      const code = err?.code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setSiError('Invalid email or password.')
      else if (code === 'auth/too-many-requests')
        setSiError('Too many attempts. Please try again later.')
      else
        setSiError(err.message ?? 'Something went wrong.')
      setSiLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (suPass.length < 6) { setSuError('Password must be at least 6 characters.'); return }
    setSuLoading(true); setSuError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonName, phone, whatsappNumber, ownerName, email: suEmail, password: suPass }),
      })
      const data = await res.json()
      if (!res.ok) { setSuError(data.error ?? 'Signup failed'); setSuLoading(false); return }

      const credential   = await signInWithEmailAndPassword(auth, suEmail, suPass)
      const initialToken = await credential.user.getIdToken()
      await fetch('/api/auth/claims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: initialToken }),
      })
      const freshToken = await credential.user.getIdToken(true)
      await fetch('/api/auth/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: freshToken }),
      })
      window.location.href = '/'
    } catch (err: any) {
      setSuError(err.message ?? 'Something went wrong.')
      setSuLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-indigo-600 flex-col justify-between p-10 shrink-0">
        <div>
          <Image src="/logo.png" alt="StitchDesk" width={194} height={48} className="h-12 w-auto object-contain brightness-0 invert" priority />
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-indigo-100 text-sm font-medium uppercase tracking-widest mb-3">Built for fashion designers</p>
            <h2 className="text-white text-3xl font-bold leading-snug">
              Every order on time.<br />Every cedi accounted for.
            </h2>
            <p className="text-indigo-200 mt-3 text-sm leading-relaxed">
              Orders, measurements, deadlines and balances in one place. Start your 14 day free trial today.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'Measurements saved for every client',
              'Orders tracked from cutting to pickup',
              'Deposits and balances that add up',
              'Tracking links clients can check',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-indigo-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} StitchDesk</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden bg-indigo-600 px-6 py-5 flex items-center gap-3">
          <Image src="/logo.png" alt="StitchDesk" width={146} height={36} className="h-9 w-auto object-contain brightness-0 invert" priority />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                {tab === 'signin' ? 'Welcome back' : 'Start your free trial'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {tab === 'signin' ? 'Sign in to your workshop.' : '14 days free. No card needed.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-200 rounded-lg mb-6">
              {(['signin', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    tab === t
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {/* ── Sign In ── */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="form-label">Email address</label>
                    <input type="email" value={siEmail} onChange={e => setSiEmail(e.target.value)}
                      placeholder="you@example.com" className="form-input w-full" required autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <input type={siShow ? 'text' : 'password'} value={siPass} onChange={e => setSiPass(e.target.value)}
                        placeholder="••••••••" className="form-input w-full pr-10" required />
                      <button type="button" onClick={() => setSiShow(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {siShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {siError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{siError}</p>}
                  <button type="submit" disabled={siLoading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {siLoading
                      ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                      : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              )}

              {/* ── Sign Up ── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="form-label">Business name</label>
                    <input value={salonName} onChange={e => setSalonName(e.target.value)}
                      placeholder="e.g. Adwoa Couture" className="form-input w-full" required autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +233 24 000 0000" className="form-input w-full" required />
                  </div>
                  <div>
                    <label className="form-label">WhatsApp Number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. +233 54 000 0000" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="form-label">Your Name</label>
                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      placeholder="Full name" className="form-input w-full" required />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)}
                      placeholder="you@example.com" className="form-input w-full" required />
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <input type={suShow ? 'text' : 'password'} value={suPass} onChange={e => setSuPass(e.target.value)}
                        placeholder="Min. 6 characters" className="form-input w-full pr-10" required />
                      <button type="button" onClick={() => setSuShow(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {suShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {suError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{suError}</p>}
                  <button type="submit" disabled={suLoading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                    {suLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                      : <><Sparkles className="h-4 w-4" /> Start free trial</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
