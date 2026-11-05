import 'dotenv/config'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const images = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../seed/images')

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'products' })
if (existing.totalDocs > 0) {
  payload.logger.info('Products already exist, nothing to seed.')
  process.exit(0)
}

const upload = async (file: string, alt: string) => {
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(images, `${file}.webp`),
  })
  return doc.id
}

const [light, sculpture] = await Promise.all([
  payload.create({ collection: 'categories', data: { name: 'Light' } }),
  payload.create({ collection: 'categories', data: { name: 'Sculpture' } }),
])

const lampOff = await upload('lamp-day-off', 'Drift Lamp switched off on a wooden sideboard in morning light, its shade a pale celadon')
const lampOn = await upload('lamp-day-on', 'The same sideboard and the same lamp, now glowing warm from inside')
const lampBedside = await upload('lamp-bedside', 'Drift Lamp lit on a marble bedside table, the only light in a dark room')
const lampShelf = await upload('lamp-shelf', 'Drift Lamp glowing beside a television, its reflection floating in the dark screen')
const lampCutoutOn = await upload('lamp-cutout-on', 'Drift Lamp, lit: a twisted lattice shade on a white base')
const lampCutoutOff = await upload('lamp-cutout-off', 'Drift Lamp, unlit: a twisted lattice shade on a white base')

const bustStudio = await upload('bust-studio', 'Inner Stair bust under a shaft of light, staircases climbing through the open side of its head')
const bustRoom = await upload('bust-room', 'Inner Stair on a sunlit sideboard beside a vase of bougainvillea')
const bustCutout = await upload('bust-cutout', 'Inner Stair: a white bust of a sleeping face, its head opened to reveal arches and staircases')

await payload.create({
  collection: 'products',
  data: {
    name: 'Drift Lamp',
    slug: 'drift-lamp',
    status: 'published',
    order: 10,
    sku: 'OO-LAMP-01',
    category: light.id,
    oneLiner: 'A lattice that goes quiet by day and comes alive after dark.',
    description:
      'Switched off, the Drift Lamp is a pale, twisted lattice that you could mistake for a piece of pottery. Switched on, the whole surface turns to light, and every printed line shows.\n\nThe shade is a single twist of fine diagonal mesh. It throws a soft glow rather than a beam, which makes it a good last light of the evening.',
    price: 2499,
    stock: 8,
    photoDay: lampOff,
    photoNight: lampBedside,
    cutoutDay: lampCutoutOff,
    cutoutNight: lampCutoutOn,
    switchOff: lampOff,
    switchOn: lampOn,
    gallery: [{ image: lampShelf }],
    homeTreatment: 'hero',
  },
})

await payload.create({
  collection: 'products',
  data: {
    name: 'Inner Stair',
    slug: 'inner-stair',
    status: 'published',
    order: 20,
    sku: 'OO-BUST-01',
    category: sculpture.id,
    oneLiner: 'A sleeping face with a whole staircase inside it.',
    description:
      'From the front she is calm, eyes closed, hair falling across one cheek. Turn her a little and the side of her head is simply gone, and inside it arches and stairs climb over one another with no clear beginning or end.\n\nA desk piece for anyone who has ever got lost in their own head.',
    price: 3999,
    stock: 3,
    photoDay: bustRoom,
    photoNight: bustStudio,
    cutoutDay: bustCutout,
    cutoutNight: bustCutout,
    homeTreatment: 'descent',
    descentCaptions: [
      { line: 'From here, a face asleep.' },
      { line: 'Come closer. Someone left the side of her head open.' },
      { line: 'Inside, the stairs keep going.' },
    ],
  },
})

await payload.updateGlobal({
  slug: 'store-settings',
  data: {
    shippingFlat: 99,
    freeShippingOver: 2999,
    lowStockAt: 3,
    makerNote:
      'Every piece on this site comes off my own 3D printer.\n\nI like objects that look like one thing from across the room and another up close, so that is what I make.',
  },
})

const policies = [
  ['Shipping', 'shipping', '[REVIEW BEFORE PUBLISHING] Where you ship, your courier, dispatch time and delivery time.'],
  ['Returns and refunds', 'returns-and-refunds', '[REVIEW BEFORE PUBLISHING] Your return window, what happens to damaged pieces, and how long refunds take.'],
  ['Terms', 'terms', '[REVIEW BEFORE PUBLISHING] Your legal name and address, and your terms of sale.'],
  ['Privacy', 'privacy', '[REVIEW BEFORE PUBLISHING] What customer data you collect (name, email, phone, address), why, and who it is shared with (Razorpay, your courier).'],
  ['Contact', 'contact', '[REVIEW BEFORE PUBLISHING] Your legal business name, address, email and phone.'],
] as const

for (const [title, slug, body] of policies) {
  await payload.create({ collection: 'policies', data: { title, slug, body, status: 'draft' } })
}

payload.logger.info('Seeded the shop.')
process.exit(0)
