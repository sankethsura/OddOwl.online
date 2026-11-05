import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Policies } from './collections/Policies'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { StoreSettings } from './globals/StoreSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · OddOwl',
    },
    components: {
      beforeDashboard: ['/components/admin/StockBoard#StockBoard'],
      graphics: {
        Logo: '/components/admin/Brand#Logo',
        Icon: '/components/admin/Brand#Icon',
      },
    },
  },
  collections: [Products, Categories, Media, Orders, Policies, Users],
  globals: [StoreSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
    // Always its own database, whatever name the address carries, so the shop
    // can never write into another project that shares the cluster.
    connectOptions: { dbName: 'oddowl' },
  }),
  sharp,
})
