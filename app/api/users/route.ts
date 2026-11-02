import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUsers } from '@/lib/actions/users'

export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  // getSessionUser verifies the session cookie and returns null when it is missing or invalid
  const caller = await getSessionUser()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
  }

  // Only owners manage the team list, and only for their own business
  if (caller.role !== 'owner' || !caller.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStore })
  }

  try {
    const users = await getUsers()
    return NextResponse.json(users, { headers: noStore })
  } catch (err) {
    console.error('[api/users] failed to load team:', err)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500, headers: noStore })
  }
}
