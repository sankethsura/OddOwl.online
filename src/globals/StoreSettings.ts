import type { GlobalConfig } from 'payload'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store settings',
  admin: { group: 'Store' },
  access: { read: () => true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'shippingFlat',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: { description: 'Flat shipping per order, in rupees.' },
        },
        {
          name: 'freeShippingOver',
          type: 'number',
          min: 0,
          admin: { description: 'Optional. Orders at or above this ship free.' },
        },
        {
          name: 'lowStockAt',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 3,
          admin: { description: 'At or below this, the site says how few are left.' },
        },
      ],
    },
    {
      name: 'makerNote',
      type: 'textarea',
      admin: { rows: 6, description: 'The story on the About page. Leave a blank line between paragraphs.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'contactEmail', type: 'email' },
        { name: 'whatsapp', type: 'text', admin: { description: 'With country code, e.g. 919800000000.' } },
        { name: 'instagram', type: 'text', admin: { description: 'Handle without the @.' } },
      ],
    },
  ],
}
