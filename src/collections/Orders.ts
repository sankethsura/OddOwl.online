import { APIError, type CollectionConfig } from 'payload'

import { reserveStock, returnStock } from '../lib/stock'

// Set by checkout and Razorpay only. Staff cannot rewrite what was charged.
const locked = { access: { update: () => false } }

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'number',
    group: 'Store',
    defaultColumns: ['number', 'status', 'total', 'customer.name', 'needsAttention', 'createdAt'],
    listSearchableFields: ['number', 'customer.name', 'customer.email', 'customer.phone'],
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    // Orders only come from checkout, and are cancelled rather than deleted so
    // that stock and payment history stay accurate.
    create: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !originalDoc || !data.status) return data

        const items = originalDoc.items as { product: number | { id: number }; quantity: number }[]
        const lines = items.map((item) => ({
          id: typeof item.product === 'object' ? item.product.id : item.product,
          quantity: item.quantity,
        }))

        if (data.status === 'cancelled' && !originalDoc.stockReleased) {
          await returnStock(req, lines)
          data.stockReleased = true
        } else if (data.status !== 'cancelled' && originalDoc.stockReleased) {
          const shortOf = await reserveStock(req, lines)
          if (shortOf !== null) {
            throw new APIError('Not enough stock left to reopen this order.', 400, undefined, true)
          }
          data.stockReleased = false
        }

        return data
      },
    ],
  },
  fields: [
    { name: 'number', type: 'text', required: true, unique: true, index: true, ...locked },
    {
      name: 'items',
      type: 'array',
      required: true,
      ...locked,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'unitPrice', type: 'number', required: true },
        { name: 'quantity', type: 'number', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', required: true, ...locked },
        { name: 'shipping', type: 'number', required: true, ...locked },
        { name: 'total', type: 'number', required: true, ...locked },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line1', type: 'text', required: true },
        { name: 'line2', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'pincode', type: 'text', required: true },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting_payment',
      index: true,
      options: [
        { label: 'Awaiting payment', value: 'awaiting_payment' },
        { label: 'Paid, to ship', value: 'paid' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled (stock returned)', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Cancelling puts the units back in stock. Refunds are issued from the Razorpay dashboard.',
      },
    },
    {
      name: 'needsAttention',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Paid, but stock had already gone. Refund or print more.' },
    },
    { name: 'trackingNote', type: 'text', admin: { position: 'sidebar', description: 'Courier and tracking number.' } },
    { name: 'razorpayOrderId', type: 'text', index: true, admin: { position: 'sidebar' }, ...locked },
    { name: 'razorpayPaymentId', type: 'text', admin: { position: 'sidebar' }, ...locked },
    { name: 'reservedUntil', type: 'date', admin: { hidden: true }, ...locked },
    { name: 'stockReleased', type: 'checkbox', defaultValue: false, admin: { hidden: true }, ...locked },
    { name: 'idempotencyKey', type: 'text', unique: true, admin: { hidden: true }, ...locked },
  ],
}
