import { getCatalogue } from '@/lib/actions/catalogue'
import { getSessionUser } from '@/lib/auth'
import { CatalogueView } from './view'

export default async function CataloguePage() {
  const [items, user] = await Promise.all([getCatalogue(), getSessionUser()])
  return <CatalogueView items={items} canEdit={user?.role !== 'staff'} />
}
