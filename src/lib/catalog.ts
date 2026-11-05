import type { Category, Media, Product, StoreSetting } from '../payload-types'

// What the site shows until the database is switched on. Nothing here can be
// bought: ordering needs the database for stock and payment records.

const stamp = '2026-11-05T00:00:00.000Z'

const photo = (file: string, width: number, height: number, alt: string): Media => ({
  id: file,
  alt,
  url: `/catalog/${file}.webp`,
  filename: `${file}.webp`,
  width,
  height,
  createdAt: stamp,
  updatedAt: stamp,
})

const category = (name: string): Category => ({ id: name, name, createdAt: stamp, updatedAt: stamp })

const lampOff = photo('lamp-day-off', 1199, 1312, 'Drift Lamp switched off on a wooden sideboard in morning light, its shade a pale celadon')
const lampOn = photo('lamp-day-on', 1199, 1312, 'The same sideboard and the same lamp, now glowing warm from inside')
const lampBedside = photo('lamp-bedside', 1199, 1312, 'Drift Lamp lit on a marble bedside table, the only light in a dark room')
const lampShelf = photo('lamp-shelf', 1199, 1312, 'Drift Lamp glowing beside a television, its reflection floating in the dark screen')
const lampCutoutOn = photo('lamp-cutout-on', 362, 641, 'Drift Lamp, lit: a twisted lattice shade on a white base')
const lampCutoutOff = photo('lamp-cutout-off', 360, 642, 'Drift Lamp, unlit: a twisted lattice shade on a white base')
const bustStudio = photo('bust-studio', 1199, 1312, 'Inner Stair bust under a shaft of light, staircases climbing through the open side of its head')
const bustRoom = photo('bust-room', 1199, 1312, 'Inner Stair on a sunlit sideboard beside a vase of bougainvillea')
const bustCutout = photo('bust-cutout', 643, 1131, 'Inner Stair: a white bust of a sleeping face, its head opened to reveal arches and staircases')

export const catalogProducts: Product[] = [
  {
    id: 'drift-lamp',
    name: 'Drift Lamp',
    slug: 'drift-lamp',
    status: 'published',
    order: 10,
    sku: 'OO-LAMP-01',
    category: category('Light'),
    oneLiner: 'A lattice that goes quiet by day and comes alive after dark.',
    description:
      'Switched off, the Drift Lamp is a pale, twisted lattice that you could mistake for a piece of pottery. Switched on, the whole surface turns to light, and every printed line shows.\n\nThe shade is a single twist of fine diagonal mesh. It throws a soft glow rather than a beam, which makes it a good last light of the evening.',
    price: 2499,
    stock: 0,
    photoDay: lampOff,
    photoNight: lampBedside,
    cutoutDay: lampCutoutOff,
    cutoutNight: lampCutoutOn,
    switchOff: lampOff,
    switchOn: lampOn,
    gallery: [{ image: lampShelf }],
    homeTreatment: 'hero',
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: 'inner-stair',
    name: 'Inner Stair',
    slug: 'inner-stair',
    status: 'published',
    order: 20,
    sku: 'OO-BUST-01',
    category: category('Sculpture'),
    oneLiner: 'A sleeping face with a whole staircase inside it.',
    description:
      'From the front she is calm, eyes closed, hair falling across one cheek. Turn her a little and the side of her head is simply gone, and inside it arches and stairs climb over one another with no clear beginning or end.\n\nA desk piece for anyone who has ever got lost in their own head.',
    price: 3999,
    stock: 0,
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
    createdAt: stamp,
    updatedAt: stamp,
  },
]

export const catalogSettings: StoreSetting = {
  id: 'catalog',
  shippingFlat: 99,
  freeShippingOver: 2999,
  lowStockAt: 3,
  makerNote:
    'Every piece on this site comes off my own 3D printer.\n\nI like objects that look like one thing from across the room and another up close, so that is what I make.',
}
