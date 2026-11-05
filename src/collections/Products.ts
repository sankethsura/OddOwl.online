import type { CollectionConfig } from 'payload'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'price', 'stock', 'status', 'category'],
    listSearchableFields: ['name', 'sku'],
  },
  access: {
    read: ({ req }) => (req.user ? true : { status: { equals: 'published' } }),
  },
  defaultSort: 'order',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) data.slug = slugify(data.name)
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sell',
          fields: [
            { name: 'name', type: 'text', required: true },
            {
              name: 'oneLiner',
              type: 'text',
              required: true,
              admin: { description: 'One short sentence shown beside the name.' },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: { description: 'Leave a blank line between paragraphs.', rows: 6 },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  required: true,
                  min: 1,
                  admin: { description: 'In rupees.', width: '33%' },
                },
                {
                  name: 'compareAtPrice',
                  type: 'number',
                  min: 1,
                  admin: {
                    description: 'Optional. The old price, shown struck through.',
                    width: '33%',
                  },
                },
                {
                  name: 'stock',
                  type: 'number',
                  required: true,
                  min: 0,
                  defaultValue: 0,
                  validate: (value: number | null | undefined) =>
                    Number.isInteger(value) && (value as number) >= 0
                      ? true
                      : 'Stock must be a whole number, 0 or more.',
                  admin: {
                    description: 'Units ready to ship. Orders take from this automatically.',
                    width: '33%',
                  },
                },
              ],
            },
            {
              name: 'specs',
              type: 'array',
              labels: { singular: 'Detail', plural: 'Details' },
              admin: { description: 'Size, material, bulb type and so on.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'value', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Photos',
          description:
            'The site has a day and a night mode, and it swaps photos with the mode. Give each product one photo for each.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'photoDay', type: 'upload', relationTo: 'media', required: true },
                { name: 'photoNight', type: 'upload', relationTo: 'media', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'cutoutDay',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Optional. Transparent background, used on the shelf.' },
                },
                {
                  name: 'cutoutNight',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Optional. Falls back to the day cutout.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'switchOff',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Optional lamp-only pair: the same shot with the light off…' },
                },
                {
                  name: 'switchOn',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: '…and on. Adds a press-to-light photo.' },
                },
              ],
            },
            {
              name: 'gallery',
              type: 'array',
              labels: { singular: 'Photo', plural: 'Photos' },
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Homepage',
          fields: [
            {
              name: 'homeTreatment',
              type: 'select',
              defaultValue: 'none',
              required: true,
              options: [
                { label: 'Not on the homepage (still in the shop)', value: 'none' },
                { label: 'Feature: large photo with price and buy button', value: 'hero' },
                { label: 'Descent: scroll zooms into the piece', value: 'descent' },
              ],
            },
            {
              name: 'descentCaptions',
              type: 'array',
              maxRows: 3,
              admin: {
                description: 'Lines that appear during the scroll, for the Descent treatment.',
                condition: (_, sibling) => sibling?.homeTreatment === 'descent',
              },
              fields: [{ name: 'line', type: 'text', required: true }],
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft (hidden)', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'The web address. Filled in from the name.' },
    },
    { name: 'sku', type: 'text', admin: { position: 'sidebar' } },
    { name: 'category', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
  ],
}
