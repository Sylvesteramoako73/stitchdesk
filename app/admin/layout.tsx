import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'
import { AdminSidebar } from '@/components/admin/sidebar'

export const metadata = { title: 'StitchDesk Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = cookies().get('admin_session')?.value

  if (!sessionCookie) redirect('/admin-login')

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false)
    if (!decoded.email || decoded.email !== process.env.SUPER_ADMIN_EMAIL) {
      redirect('/admin-login')
    }
  } catch {
    redirect('/admin-login')
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
