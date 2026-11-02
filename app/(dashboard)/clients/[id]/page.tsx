import { notFound } from 'next/navigation'
import { getClient } from '@/lib/actions/clients'
import { getMeasurements } from '@/lib/actions/measurements'
import { getOrders } from '@/lib/actions/orders'
import { getSalonSettings } from '@/lib/actions/settings'
import { ClientProfileView } from './view'

export default async function ClientProfilePage({ params, searchParams }: { params: { id: string }; searchParams: { measure?: string } }) {
  const client = await getClient(params.id)
  if (!client) notFound()
  const [measurements, orders, settings] = await Promise.all([
    getMeasurements(params.id),
    getOrders({ clientId: params.id }),
    getSalonSettings(),
  ])
  return (
    <ClientProfileView
      client={client}
      measurements={measurements}
      orders={orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
      defaultUnit={settings.measurementUnit ?? 'in'}
      openMeasure={searchParams.measure === '1'}
    />
  )
}
