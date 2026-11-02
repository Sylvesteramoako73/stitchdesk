import { notFound } from 'next/navigation'
import { getOrder } from '@/lib/actions/orders'
import { getStaff } from '@/lib/actions/staff'
import { getCatalogue } from '@/lib/actions/catalogue'
import { getSalonSettings } from '@/lib/actions/settings'
import { getSessionUser } from '@/lib/auth'
import { OrderDetailView } from './view'

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string } }) {
  const [order, staff, catalogue, settings, user] = await Promise.all([
    getOrder(params.id), getStaff(), getCatalogue(), getSalonSettings(), getSessionUser(),
  ])
  if (!order) notFound()
  return (
    <OrderDetailView
      order={order}
      staff={staff.map(s => ({ id: s.id, name: s.name }))}
      catalogue={catalogue}
      shop={{ name: settings.salonName, phone: settings.phone, address: settings.address }}
      justCreated={searchParams.created === '1'}
      canManage={user?.role !== 'staff'}
    />
  )
}
