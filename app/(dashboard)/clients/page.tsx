import { getClientsWithStats } from '@/lib/actions/clients'
import { ClientsView } from './view'

export default async function ClientsPage() {
  const clients = await getClientsWithStats()
  return <ClientsView clients={clients} />
}
