import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Media, Product } from '../payload-types'
import { catalogProducts, catalogSettings } from './catalog'
import { databaseEnabled } from './env'
import { releaseExpiredReservations } from './orders'

export const payloadClient = () => getPayload({ config })

export const getProducts = cache(async () => {
  if (!databaseEnabled()) return catalogProducts
  const payload = await payloadClient()
  await releaseExpiredReservations(payload)
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    sort: 'order',
    limit: 200,
    depth: 2,
  })
  return docs
})

export const getProduct = cache(async (slug: string) => {
  const products = await getProducts()
  return products.find((product) => product.slug === slug) ?? null
})

export const getSettings = cache(async () => {
  if (!databaseEnabled()) return catalogSettings
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'store-settings' })
})

export const getPolicies = cache(async () => {
  if (!databaseEnabled()) return []
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'policies',
    where: { status: { equals: 'published' } },
    limit: 20,
  })
  return docs
})

export const media = (value: string | Media | null | undefined) =>
  value && typeof value === 'object' && value.url ? value : null

export const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`

export const stockLine = (product: Pick<Product, 'stock'>, lowStockAt: number) => {
  if (!databaseEnabled()) return 'Orders open soon'
  if (product.stock === 0) return 'Sold out, printing more'
  if (product.stock <= lowStockAt) return `${product.stock} left on the shelf`
  return 'On the shelf'
}
