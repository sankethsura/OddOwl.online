import type { BagLine } from '@/components/store/Bag'
import type { Product } from '@/payload-types'

import { media } from './store'

export const toBagProduct = (product: Product): Omit<BagLine, 'quantity'> => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  price: product.price,
  stock: product.stock,
  image: media(product.cutoutDay)?.url ?? media(product.photoDay)?.url ?? null,
})
