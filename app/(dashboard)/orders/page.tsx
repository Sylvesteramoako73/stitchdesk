import { getOrders } from '@/lib/actions/orders'
import { getClients } from '@/lib/actions/clients'
import { getStaff } from '@/lib/actions/staff'
import { getCatalogue } from '@/lib/actions/catalogue'
import { getEffectiveLocationId } from '@/lib/auth'
import { OrdersView } from './view'

export default async function OrdersPage({ searchParams }: { searchParams: { new?: string; client?: string; q?: string; filter?: string } }) {
  const locationId = await getEffectiveLocationId()
  const [orders, clients, staff, catalogue] = await Promise.all([
    getOrders(), getClients(), getStaff(locationId), getCatalogue(),
  ])
  return (
    <OrdersView
      orders={orders}
      clients={clients.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
      staff={staff.map(s => ({ id: s.id, name: s.name }))}
      catalogue={catalogue}
      openNew={searchParams.new === '1' || !!searchParams.client}
      defaultClientId={searchParams.client}
      initialQuery={searchParams.q ?? ''}
      initialFilter={searchParams.filter}
    />
  )
}
