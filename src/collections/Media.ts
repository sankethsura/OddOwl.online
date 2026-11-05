import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Catalogue',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the photo for people who cannot see it, e.g. "Drift Lamp glowing on a bedside table".',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: 'media',
  },
}
