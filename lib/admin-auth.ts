import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'

export async function verifyAdminSession(): Promise<boolean> {
  const cookie = cookies().get('admin_session')?.value
  if (!cookie) return false

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, false)
    return !!decoded.email && decoded.email === process.env.SUPER_ADMIN_EMAIL
  } catch {
    return false
  }
}
