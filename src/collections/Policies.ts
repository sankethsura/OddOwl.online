import type { CollectionConfig } from 'payload'

export const Policies: CollectionConfig = {
  slug: 'policies',
  admin: {
    useAsTitle: 'title',
    group: 'Store',
    defaultColumns: ['title', 'status', 'slug'],
    description: 'Razorpay asks for these before activating a live account.',
  },
  access: {
    read: ({ req }) => (req.user ? true : { status: { equals: 'published' } }),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: { rows: 16, description: 'Leave a blank line between paragraphs.' },
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
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
  ],
}
