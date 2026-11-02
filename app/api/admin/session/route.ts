import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

const FIVE_DAYS = 60 * 60 * 24 * 5 * 1000

export async function POST(req: NextRequest) {
  const { idToken } = await req.json()
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    if (!decoded.email || decoded.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Access denied. Not a super-admin.' }, { status: 403 })
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   FIVE_DAYS / 1000,
      path:     '/',
    })
    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Auth failed' }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  return response
}
